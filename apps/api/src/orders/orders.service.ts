import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  Product,
  SlotStatus,
  SnackStatus
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, CreateOrderItemDto } from './dto/create-order.dto';

const SERVICE_FEE_CENTS = 49;
const SIMULATED_PAYMENT_PROVIDER = 'simulated';

type SlotWithSnack = Prisma.SlotGetPayload<{
  include: { snack: true };
}>;

type CreatedOrder = Prisma.OrderGetPayload<{
  include: {
    items: true;
    payment: true;
    slot: true;
    snack: true;
  };
}>;

type OrderWithPayment = Prisma.OrderGetPayload<{
  include: {
    payment: true;
  };
}>;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(studentId: string, dto: CreateOrderDto): Promise<CreatedOrder> {
    const now = new Date();
    const student = await this.prisma.user.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const slot = await this.prisma.slot.findUnique({
      where: { id: dto.slotId },
      include: { snack: true }
    });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    this.ensureSlotCanBeReserved(slot, dto.snackId, now);

    const products = await this.findAndValidateProducts(dto);
    const orderItems = this.buildOrderItems(dto.items, products);
    const productsTotalCents = orderItems.reduce((total, item) => total + item.totalPriceCents, 0);
    const totalCents = productsTotalCents + SERVICE_FEE_CENTS;

    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.slot.updateMany({
        where: {
          id: dto.slotId,
          snackId: dto.snackId,
          status: SlotStatus.AVAILABLE,
          capacity: {
            gt: 0
          },
          reservedCount: {
            lt: this.prisma.slot.fields.capacity
          },
          snack: {
            status: SnackStatus.ONLINE,
            circuitBreaker: false,
            OR: [
              {
                snoozedUntil: null
              },
              {
                snoozedUntil: {
                  lte: now
                }
              }
            ]
          }
        },
        data: {
          reservedCount: {
            increment: 1
          }
        }
      });

      if (reservation.count !== 1) {
        throw new BadRequestException('Slot is no longer available');
      }

      return tx.order.create({
        data: {
          userId: studentId,
          snackId: dto.snackId,
          slotId: dto.slotId,
          status: OrderStatus.PENDING_PAYMENT,
          productsTotalCents,
          serviceFeeCents: SERVICE_FEE_CENTS,
          totalCents,
          customerFirstName: student.firstName,
          specialNote: dto.specialNote,
          items: {
            create: orderItems
          },
          payment: {
            create: {
              provider: SIMULATED_PAYMENT_PROVIDER,
              status: PaymentStatus.PENDING,
              amountCents: totalCents
            }
          }
        },
        include: {
          items: true,
          payment: true,
          slot: true,
          snack: true
        }
      });
    });
  }

  async paySimulatedOrder(studentId: string, orderId: string): Promise<CreatedOrder> {
    const now = new Date();
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    this.ensureOrderCanBePaid(order, studentId);

    return this.prisma.$transaction(async (tx) => {
      const paymentUpdate = await tx.payment.updateMany({
        where: {
          orderId,
          provider: SIMULATED_PAYMENT_PROVIDER,
          status: PaymentStatus.PENDING,
          order: {
            userId: studentId,
            status: OrderStatus.PENDING_PAYMENT
          }
        },
        data: {
          status: PaymentStatus.PAID,
          paidAt: now
        }
      });

      if (paymentUpdate.count !== 1) {
        throw new BadRequestException('Payment cannot be completed');
      }

      const orderUpdate = await tx.order.updateMany({
        where: {
          id: orderId,
          userId: studentId,
          status: OrderStatus.PENDING_PAYMENT,
          payment: {
            status: PaymentStatus.PAID
          }
        },
        data: {
          status: OrderStatus.CONFIRMED
        }
      });

      if (orderUpdate.count !== 1) {
        throw new BadRequestException('Order cannot be confirmed');
      }

      const updatedOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          payment: true,
          slot: true,
          snack: true
        }
      });

      if (!updatedOrder) {
        throw new NotFoundException('Order not found');
      }

      return updatedOrder;
    });
  }

  private ensureSlotCanBeReserved(slot: SlotWithSnack, snackId: string, now: Date): void {
    if (slot.snackId !== snackId) {
      throw new BadRequestException('Slot does not belong to the requested snack');
    }

    if (slot.status !== SlotStatus.AVAILABLE) {
      throw new BadRequestException('Slot is not available');
    }

    if (slot.capacity <= 0) {
      throw new BadRequestException('Slot capacity must be greater than zero');
    }

    if (slot.reservedCount >= slot.capacity) {
      throw new BadRequestException('Slot is full');
    }

    if (slot.snack.status !== SnackStatus.ONLINE) {
      throw new BadRequestException('Snack is not online');
    }

    if (slot.snack.circuitBreaker) {
      throw new BadRequestException('Snack is temporarily closed');
    }

    if (slot.snack.snoozedUntil && slot.snack.snoozedUntil > now) {
      throw new BadRequestException('Snack is snoozed');
    }
  }

  private ensureOrderCanBePaid(order: OrderWithPayment, studentId: string): void {
    if (order.userId !== studentId) {
      throw new ForbiddenException('Order does not belong to the current student');
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Order is not payable');
    }

    if (!order.payment) {
      throw new BadRequestException('Payment is missing');
    }

    if (order.payment.provider !== SIMULATED_PAYMENT_PROVIDER) {
      throw new BadRequestException('Payment provider is not simulated');
    }

    if (order.payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment is not pending');
    }
  }

  private async findAndValidateProducts(dto: CreateOrderDto): Promise<Product[]> {
    const productIds = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: productIds
        }
      }
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException('Product not found');
    }

    for (const product of products) {
      if (product.snackId !== dto.snackId) {
        throw new BadRequestException('Product does not belong to the requested snack');
      }

      if (!product.isAvailable) {
        throw new BadRequestException('Product is not available');
      }
    }

    return products;
  }

  private buildOrderItems(
    items: CreateOrderItemDto[],
    products: Product[]
  ): Prisma.OrderItemCreateWithoutOrderInput[] {
    const productsById = new Map(products.map((product) => [product.id, product]));

    return items.map((item) => {
      const product = productsById.get(item.productId);

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return {
        product: {
          connect: {
            id: product.id
          }
        },
        productName: product.name,
        quantity: item.quantity,
        unitPriceCents: product.priceCents,
        totalPriceCents: product.priceCents * item.quantity,
        specialNote: item.specialNote,
        selectedOptions: item.selectedOptions as Prisma.InputJsonValue | undefined
      };
    });
  }
}
