import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  Product,
  SlotStatus,
  SnackStatus
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SIMULATED_PAYMENT_PROVIDER } from '../constants/order-payment.constants';
import { CreateOrderDto, CreateOrderItemDto } from '../dto/create-order.dto';

const SERVICE_FEE_CENTS = 49;

type SlotWithSnack = Prisma.SlotGetPayload<{
  include: { snack: true };
}>;

export type OrderCreated = Prisma.OrderGetPayload<{
  include: {
    items: true;
    payment: true;
    slot: true;
    snack: true;
    withdrawalCode: true;
  };
}>;

@Injectable()
export class OrderCreationService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(studentId: string, dto: CreateOrderDto): Promise<OrderCreated> {
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
          snack: true,
          withdrawalCode: true
        }
      });
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
