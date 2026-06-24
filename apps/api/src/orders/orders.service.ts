import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { randomInt, randomUUID } from 'crypto';
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  Product,
  SlotStatus,
  SnackStatus
} from '@prisma/client';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, CreateOrderItemDto } from './dto/create-order.dto';
import { MerchantOrdersQueryDto } from './dto/merchant-orders-query.dto';
import { StudentOrdersQueryDto } from './dto/student-orders-query.dto';
import { ValidateWithdrawalDto } from './dto/validate-withdrawal.dto';
import { MerchantOrdersService } from './services/merchant-orders.service';
import { MerchantOrderStatusService } from './services/merchant-order-status.service';
import { OrderDetailService } from './services/order-detail.service';
import { StudentOrdersService } from './services/student-orders.service';

const SERVICE_FEE_CENTS = 49;
const SIMULATED_PAYMENT_PROVIDER = 'simulated';
const WITHDRAWAL_CODE_ATTEMPTS = 20;
const WITHDRAWAL_EXPIRATION_DELAY_MS = 2 * 60 * 60 * 1000;
const ACTIVE_WITHDRAWAL_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.WAITING_PULL_CONFIRMATION,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.LATE
];

type SlotWithSnack = Prisma.SlotGetPayload<{
  include: { snack: true };
}>;

type CreatedOrder = Prisma.OrderGetPayload<{
  include: {
    items: true;
    payment: true;
    slot: true;
    snack: true;
    withdrawalCode: true;
  };
}>;

type PayableOrder = Prisma.OrderGetPayload<{
  include: {
    payment: true;
    slot: true;
    withdrawalCode: true;
  };
}>;

type WithdrawalOrderData = {
  id: string;
  snackId: string;
  slot: {
    startAt: Date;
    endAt: Date;
  };
};

type WithdrawalCodeForValidation = Prisma.WithdrawalCodeGetPayload<{
  include: {
    order: {
      include: {
        slot: true;
        snack: {
          include: {
            merchant: true;
          };
        };
      };
    };
  };
}>;

type StudentOrderListItem = CreatedOrder;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentOrdersService: StudentOrdersService,
    private readonly merchantOrdersService: MerchantOrdersService,
    private readonly orderDetailService: OrderDetailService,
    private readonly merchantOrderStatusService: MerchantOrderStatusService
  ) {}

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
          snack: true,
          withdrawalCode: true
        }
      });
    });
  }

  async findStudentOrders(
    studentId: string,
    query: StudentOrdersQueryDto
  ): Promise<StudentOrderListItem[]> {
    return this.studentOrdersService.findStudentOrders(studentId, query);
  }

  async findMerchantOrders(
    merchantId: string,
    query: MerchantOrdersQueryDto
  ): ReturnType<MerchantOrdersService['findMerchantOrders']> {
    return this.merchantOrdersService.findMerchantOrders(merchantId, query);
  }

  async findOrderByIdForUser(
    user: AuthenticatedUser,
    orderId: string
  ): ReturnType<OrderDetailService['findOrderByIdForUser']> {
    return this.orderDetailService.findOrderByIdForUser(user, orderId);
  }

  async paySimulatedOrder(studentId: string, orderId: string): Promise<CreatedOrder> {
    const now = new Date();
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        slot: true,
        withdrawalCode: true
      }
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

      await this.generateWithdrawalCodeForOrder(tx, order);

      const updatedOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          payment: true,
          slot: true,
          snack: true,
          withdrawalCode: true
        }
      });

      if (!updatedOrder) {
        throw new NotFoundException('Order not found');
      }

      return updatedOrder;
    });
  }

  async validateWithdrawal(merchantId: string, dto: ValidateWithdrawalDto): Promise<CreatedOrder> {
    const now = new Date();

    this.ensureWithdrawalLookupIsValid(dto);

    return this.prisma.$transaction(async (tx) => {
      const withdrawalCode = await this.findWithdrawalCodeForValidation(tx, dto, now);

      if (!withdrawalCode) {
        throw new NotFoundException('Withdrawal code not found');
      }

      this.ensureWithdrawalCanBeValidated(withdrawalCode, merchantId, now);

      const withdrawalUpdate = await tx.withdrawalCode.updateMany({
        where: {
          id: withdrawalCode.id,
          usedAt: null
        },
        data: {
          usedAt: now
        }
      });

      if (withdrawalUpdate.count !== 1) {
        throw new BadRequestException('Withdrawal code already used');
      }

      const orderUpdate = await tx.order.updateMany({
        where: {
          id: withdrawalCode.orderId,
          status: {
            in: ACTIVE_WITHDRAWAL_ORDER_STATUSES
          }
        },
        data: {
          status: OrderStatus.COMPLETED,
          pickupConfirmedAt: now
        }
      });

      if (orderUpdate.count !== 1) {
        throw new BadRequestException('Order is not validable');
      }

      const updatedOrder = await tx.order.findUnique({
        where: {
          id: withdrawalCode.orderId
        },
        include: {
          items: true,
          payment: true,
          slot: true,
          snack: true,
          withdrawalCode: true
        }
      });

      if (!updatedOrder) {
        throw new NotFoundException('Order not found');
      }

      return updatedOrder;
    });
  }

  async updateMerchantOrderStatus(
    merchantId: string,
    orderId: string,
    status: OrderStatus
  ): ReturnType<MerchantOrderStatusService['updateMerchantOrderStatus']> {
    return this.merchantOrderStatusService.updateMerchantOrderStatus(merchantId, orderId, status);
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

  private ensureOrderCanBePaid(order: PayableOrder, studentId: string): void {
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

  private ensureWithdrawalLookupIsValid(dto: ValidateWithdrawalDto): void {
    if (!dto.qrToken && !dto.code) {
      throw new BadRequestException('qrToken or code is required');
    }

    if (!dto.qrToken && dto.code && !dto.snackId) {
      throw new BadRequestException('snackId is required when validating with code');
    }
  }

  private async findWithdrawalCodeForValidation(
    tx: Prisma.TransactionClient,
    dto: ValidateWithdrawalDto,
    now: Date
  ): Promise<WithdrawalCodeForValidation | null> {
    const include = {
      order: {
        include: {
          slot: true,
          snack: {
            include: {
              merchant: true
            }
          }
        }
      }
    } satisfies Prisma.WithdrawalCodeInclude;

    if (dto.qrToken) {
      return tx.withdrawalCode.findUnique({
        where: {
          qrToken: dto.qrToken
        },
        include
      });
    }

    const serviceDay = this.getServiceDayBounds(now);

    return tx.withdrawalCode.findFirst({
      where: {
        code: dto.code,
        usedAt: null,
        expiresAt: {
          gt: now
        },
        order: {
          snackId: dto.snackId,
          status: {
            in: ACTIVE_WITHDRAWAL_ORDER_STATUSES
          },
          slot: {
            startAt: {
              gte: serviceDay.start,
              lt: serviceDay.end
            }
          }
        }
      },
      include
    });
  }

  private ensureWithdrawalCanBeValidated(
    withdrawalCode: WithdrawalCodeForValidation,
    merchantId: string,
    now: Date
  ): void {
    if (withdrawalCode.usedAt) {
      throw new BadRequestException('Withdrawal code already used');
    }

    if (withdrawalCode.expiresAt && withdrawalCode.expiresAt <= now) {
      throw new BadRequestException('Withdrawal code expired');
    }

    if (withdrawalCode.order.snack.merchant.userId !== merchantId) {
      throw new ForbiddenException('Snack does not belong to the current merchant');
    }

    if (!ACTIVE_WITHDRAWAL_ORDER_STATUSES.includes(withdrawalCode.order.status)) {
      throw new BadRequestException('Order is not validable');
    }
  }

  private async generateWithdrawalCodeForOrder(
    tx: Prisma.TransactionClient,
    order: WithdrawalOrderData
  ) {
    const existingWithdrawalCode = await tx.withdrawalCode.findUnique({
      where: {
        orderId: order.id
      }
    });

    if (existingWithdrawalCode) {
      return existingWithdrawalCode;
    }

    const serviceDay = this.getServiceDayBounds(order.slot.startAt);

    for (let attempt = 0; attempt < WITHDRAWAL_CODE_ATTEMPTS; attempt += 1) {
      const code = this.generateFourDigitWithdrawalCode();
      const activeCollision = await tx.withdrawalCode.findFirst({
        where: {
          code,
          order: {
            snackId: order.snackId,
            status: {
              in: ACTIVE_WITHDRAWAL_ORDER_STATUSES
            },
            slot: {
              startAt: {
                gte: serviceDay.start,
                lt: serviceDay.end
              }
            }
          }
        }
      });

      if (!activeCollision) {
        return tx.withdrawalCode.create({
          data: {
            orderId: order.id,
            code,
            qrToken: randomUUID(),
            expiresAt: this.getWithdrawalExpiresAt(order.slot.endAt)
          }
        });
      }
    }

    throw new InternalServerErrorException('Unable to generate a withdrawal code');
  }

  private generateFourDigitWithdrawalCode(): string {
    return randomInt(0, 10_000).toString().padStart(4, '0');
  }

  private getWithdrawalExpiresAt(slotEndAt: Date): Date {
    return new Date(slotEndAt.getTime() + WITHDRAWAL_EXPIRATION_DELAY_MS);
  }

  private getServiceDayBounds(date: Date): { start: Date; end: Date } {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return { start, end };
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
