import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  Product,
  ProductType,
  Role,
  SlotStatus,
  SnackStatus,
  User,
  WithdrawalCode
} from '@prisma/client';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { MerchantOrdersQueryDto } from './dto/merchant-orders-query.dto';
import { StudentOrdersQueryDto } from './dto/student-orders-query.dto';
import { OrdersService } from './orders.service';

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

type ValidatableWithdrawalCode = Prisma.WithdrawalCodeGetPayload<{
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

type MerchantOrder = Prisma.OrderGetPayload<{
  include: {
    snack: {
      include: {
        merchant: true;
      };
    };
  };
}>;

type MerchantOrderListItem = Prisma.OrderGetPayload<{
  include: {
    items: true;
    payment: true;
    slot: true;
    snack: true;
    withdrawalCode: true;
    user: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        email: true;
      };
    };
  };
}>;

type OrderDetail = Prisma.OrderGetPayload<{
  include: {
    items: true;
    payment: true;
    slot: true;
    snack: {
      include: {
        merchant: true;
      };
    };
    withdrawalCode: true;
    user: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        email: true;
      };
    };
  };
}>;

type OrderFindManyResult = CreatedOrder | MerchantOrderListItem;

type TransactionMock = {
  slot: {
    updateMany: jest.Mock<Promise<Prisma.BatchPayload>, [Prisma.SlotUpdateManyArgs]>;
  };
  payment: {
    updateMany: jest.Mock<Promise<Prisma.BatchPayload>, [Prisma.PaymentUpdateManyArgs]>;
  };
  order: {
    create: jest.Mock<Promise<CreatedOrder>, [Prisma.OrderCreateArgs]>;
    updateMany: jest.Mock<Promise<Prisma.BatchPayload>, [Prisma.OrderUpdateManyArgs]>;
    findUnique: jest.Mock<Promise<CreatedOrder | null>, [Prisma.OrderFindUniqueArgs]>;
  };
  withdrawalCode: {
    findUnique: jest.Mock<
      Promise<WithdrawalCode | ValidatableWithdrawalCode | null>,
      [Prisma.WithdrawalCodeFindUniqueArgs]
    >;
    findFirst: jest.Mock<
      Promise<WithdrawalCode | ValidatableWithdrawalCode | null>,
      [Prisma.WithdrawalCodeFindFirstArgs]
    >;
    create: jest.Mock<Promise<WithdrawalCode>, [Prisma.WithdrawalCodeCreateArgs]>;
    updateMany: jest.Mock<Promise<Prisma.BatchPayload>, [Prisma.WithdrawalCodeUpdateManyArgs]>;
  };
};

type PrismaMock = {
  user: {
    findUnique: jest.Mock<Promise<User | null>, [Prisma.UserFindUniqueArgs]>;
  };
  slot: {
    fields: {
      capacity: Prisma.FieldRef<'Slot', 'Int'>;
    };
    findUnique: jest.Mock<Promise<SlotWithSnack | null>, [Prisma.SlotFindUniqueArgs]>;
  };
  product: {
    findMany: jest.Mock<Promise<Product[]>, [Prisma.ProductFindManyArgs]>;
  };
  order: {
    findUnique: jest.Mock<
      Promise<PayableOrder | MerchantOrder | CreatedOrder | OrderDetail | null>,
      [Prisma.OrderFindUniqueArgs]
    >;
    findMany: jest.Mock<Promise<OrderFindManyResult[]>, [Prisma.OrderFindManyArgs]>;
    updateMany: jest.Mock<Promise<Prisma.BatchPayload>, [Prisma.OrderUpdateManyArgs]>;
  };
  $transaction: jest.Mock<Promise<CreatedOrder>, [(tx: TransactionMock) => Promise<CreatedOrder>]>;
};

describe('OrdersService', () => {
  let service: OrdersService;
  const now = new Date('2026-01-01T10:00:00.000Z');
  const merchantId = 'merchant-user-id';
  const studentUser: AuthenticatedUser = {
    id: 'student-id',
    email: 'student@grabgo.test',
    role: Role.STUDENT
  };
  const merchantUser: AuthenticatedUser = {
    id: merchantId,
    email: 'merchant@grabgo.test',
    role: Role.MERCHANT
  };
  const adminUser: AuthenticatedUser = {
    id: 'admin-user-id',
    email: 'admin@grabgo.test',
    role: Role.ADMIN
  };
  const student: User = {
    id: 'student-id',
    email: 'student@grabgo.test',
    passwordHash: 'hashed-password',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: Role.STUDENT,
    phone: null,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };
  const dto: CreateOrderDto = {
    snackId: 'snack-id',
    slotId: 'slot-id',
    items: [
      {
        productId: 'product-id',
        quantity: 2
      }
    ]
  };
  const product: Product = {
    id: 'product-id',
    snackId: 'snack-id',
    name: 'Sandwich',
    description: null,
    type: ProductType.SANDWICH,
    priceCents: 450,
    stock: 12,
    isAvailable: true,
    allergensVerifiedAt: now,
    createdAt: now,
    updatedAt: now
  };
  const txMock: TransactionMock = {
    slot: {
      updateMany: jest.fn<Promise<Prisma.BatchPayload>, [Prisma.SlotUpdateManyArgs]>()
    },
    payment: {
      updateMany: jest.fn<Promise<Prisma.BatchPayload>, [Prisma.PaymentUpdateManyArgs]>()
    },
    order: {
      create: jest.fn<Promise<CreatedOrder>, [Prisma.OrderCreateArgs]>(),
      updateMany: jest.fn<Promise<Prisma.BatchPayload>, [Prisma.OrderUpdateManyArgs]>(),
      findUnique: jest.fn<Promise<CreatedOrder | null>, [Prisma.OrderFindUniqueArgs]>()
    },
    withdrawalCode: {
      findUnique: jest.fn<
        Promise<WithdrawalCode | ValidatableWithdrawalCode | null>,
        [Prisma.WithdrawalCodeFindUniqueArgs]
      >(),
      findFirst: jest.fn<
        Promise<WithdrawalCode | ValidatableWithdrawalCode | null>,
        [Prisma.WithdrawalCodeFindFirstArgs]
      >(),
      create: jest.fn<Promise<WithdrawalCode>, [Prisma.WithdrawalCodeCreateArgs]>(),
      updateMany: jest.fn<Promise<Prisma.BatchPayload>, [Prisma.WithdrawalCodeUpdateManyArgs]>()
    }
  };
  const prismaMock: PrismaMock = {
    user: {
      findUnique: jest.fn<Promise<User | null>, [Prisma.UserFindUniqueArgs]>()
    },
    slot: {
      fields: {
        capacity: {} as Prisma.FieldRef<'Slot', 'Int'>
      },
      findUnique: jest.fn<Promise<SlotWithSnack | null>, [Prisma.SlotFindUniqueArgs]>()
    },
    product: {
      findMany: jest.fn<Promise<Product[]>, [Prisma.ProductFindManyArgs]>()
    },
    order: {
      findUnique: jest.fn<
        Promise<PayableOrder | MerchantOrder | CreatedOrder | OrderDetail | null>,
        [Prisma.OrderFindUniqueArgs]
      >(),
      findMany: jest.fn<Promise<OrderFindManyResult[]>, [Prisma.OrderFindManyArgs]>(),
      updateMany: jest.fn<Promise<Prisma.BatchPayload>, [Prisma.OrderUpdateManyArgs]>()
    },
    $transaction: jest.fn<Promise<CreatedOrder>, [(tx: TransactionMock) => Promise<CreatedOrder>]>()
  };

  function createSlot(overrides: Partial<SlotWithSnack> = {}): SlotWithSnack {
    return {
      id: 'slot-id',
      snackId: 'snack-id',
      startAt: new Date('2026-01-01T12:00:00.000Z'),
      endAt: new Date('2026-01-01T12:15:00.000Z'),
      capacity: 10,
      reservedCount: 3,
      status: SlotStatus.AVAILABLE,
      createdAt: now,
      updatedAt: now,
      snack: {
        id: 'snack-id',
        merchantId: 'merchant-id',
        campusId: 'campus-id',
        name: 'Snack Campus',
        description: null,
        status: SnackStatus.ONLINE,
        circuitBreaker: false,
        snoozedUntil: null,
        openingTime: null,
        closingTime: null,
        createdAt: now,
        updatedAt: now
      },
      ...overrides
    };
  }

  function createOrder(overrides: Partial<CreatedOrder> = {}): CreatedOrder {
    return {
      id: 'order-id',
      userId: student.id,
      snackId: dto.snackId,
      slotId: dto.slotId,
      status: OrderStatus.PENDING_PAYMENT,
      productsTotalCents: 900,
      serviceFeeCents: 49,
      totalCents: 949,
      customerFirstName: student.firstName,
      specialNote: null,
      pickupConfirmedAt: null,
      lateReportedAt: null,
      createdAt: now,
      updatedAt: now,
      items: [
        {
          id: 'order-item-id',
          orderId: 'order-id',
          productId: product.id,
          productName: product.name,
          quantity: 2,
          unitPriceCents: 450,
          totalPriceCents: 900,
          specialNote: null,
          selectedOptions: null,
          createdAt: now,
          updatedAt: now
        }
      ],
      payment: {
        id: 'payment-id',
        orderId: 'order-id',
        status: PaymentStatus.PENDING,
        amountCents: 949,
        provider: 'simulated',
        providerPaymentId: null,
        paidAt: null,
        createdAt: now,
        updatedAt: now
      },
      slot: {
        id: 'slot-id',
        snackId: 'snack-id',
        startAt: new Date('2026-01-01T12:00:00.000Z'),
        endAt: new Date('2026-01-01T12:15:00.000Z'),
        capacity: 10,
        reservedCount: 4,
        status: SlotStatus.AVAILABLE,
        createdAt: now,
        updatedAt: now
      },
      snack: {
        id: 'snack-id',
        merchantId: 'merchant-id',
        campusId: 'campus-id',
        name: 'Snack Campus',
        description: null,
        status: SnackStatus.ONLINE,
        circuitBreaker: false,
        snoozedUntil: null,
        openingTime: null,
        closingTime: null,
        createdAt: now,
        updatedAt: now
      },
      withdrawalCode: null,
      ...overrides
    };
  }

  function createWithdrawalCode(overrides: Partial<WithdrawalCode> = {}): WithdrawalCode {
    return {
      id: 'withdrawal-code-id',
      orderId: 'order-id',
      code: '1234',
      qrToken: 'qr-token',
      usedAt: null,
      expiresAt: new Date('2026-01-01T14:15:00.000Z'),
      createdAt: now,
      updatedAt: now,
      ...overrides
    };
  }

  function createValidatableWithdrawalCode(
    overrides: Partial<ValidatableWithdrawalCode> = {}
  ): ValidatableWithdrawalCode {
    return {
      ...createWithdrawalCode(),
      order: {
        id: 'order-id',
        userId: student.id,
        snackId: 'snack-id',
        slotId: 'slot-id',
        status: OrderStatus.CONFIRMED,
        productsTotalCents: 900,
        serviceFeeCents: 49,
        totalCents: 949,
        customerFirstName: student.firstName,
        specialNote: null,
        pickupConfirmedAt: null,
        lateReportedAt: null,
        createdAt: now,
        updatedAt: now,
        slot: {
          id: 'slot-id',
          snackId: 'snack-id',
          startAt: new Date('2026-01-01T12:00:00.000Z'),
          endAt: new Date('2026-01-01T12:15:00.000Z'),
          capacity: 10,
          reservedCount: 4,
          status: SlotStatus.AVAILABLE,
          createdAt: now,
          updatedAt: now
        },
        snack: {
          id: 'snack-id',
          merchantId: 'merchant-id',
          campusId: 'campus-id',
          name: 'Snack Campus',
          description: null,
          status: SnackStatus.ONLINE,
          circuitBreaker: false,
          snoozedUntil: null,
          openingTime: null,
          closingTime: null,
          createdAt: now,
          updatedAt: now,
          merchant: {
            id: 'merchant-id',
            userId: merchantId,
            companyName: 'Snack Campus SARL',
            siret: null,
            createdAt: now,
            updatedAt: now
          }
        }
      },
      ...overrides
    };
  }

  function createPayableOrder(overrides: Partial<PayableOrder> = {}): PayableOrder {
    const order = createOrder();
    const { items, snack, ...payableOrder } = order;
    void items;
    void snack;

    return {
      ...payableOrder,
      ...overrides
    };
  }

  function createMerchantOrder(overrides: Partial<MerchantOrder> = {}): MerchantOrder {
    const order = createOrder();
    const { items, payment, slot, withdrawalCode, snack, ...orderBase } = order;
    void items;
    void payment;
    void slot;
    void withdrawalCode;

    return {
      ...orderBase,
      snack: {
        ...snack,
        merchant: {
          id: 'merchant-id',
          userId: merchantId,
          companyName: 'Snack Campus SARL',
          siret: null,
          createdAt: now,
          updatedAt: now
        }
      },
      ...overrides
    };
  }

  function createMerchantOrderListItem(
    overrides: Partial<MerchantOrderListItem> = {}
  ): MerchantOrderListItem {
    return {
      ...createOrder(),
      user: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email
      },
      ...overrides
    };
  }

  function createOrderDetail(overrides: Partial<OrderDetail> = {}): OrderDetail {
    const order = createOrder();

    return {
      ...order,
      snack: {
        ...order.snack,
        merchant: {
          id: 'merchant-id',
          userId: merchantId,
          companyName: 'Snack Campus SARL',
          siret: null,
          createdAt: now,
          updatedAt: now
        }
      },
      user: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email
      },
      ...overrides
    };
  }

  function arrangeOrderDetail(order = createOrderDetail()) {
    prismaMock.order.findUnique.mockResolvedValue(order);

    return order;
  }

  function arrangeMerchantOrdersList(orders = [createMerchantOrderListItem()]) {
    prismaMock.order.findMany.mockResolvedValue(orders);

    return orders;
  }

  function arrangeStudentOrdersList(orders = [createOrder()]) {
    prismaMock.order.findMany.mockResolvedValue(orders);

    return orders;
  }

  function arrangeValidOrder(): CreatedOrder {
    const order = createOrder();
    prismaMock.user.findUnique.mockResolvedValue(student);
    prismaMock.slot.findUnique.mockResolvedValue(createSlot());
    prismaMock.product.findMany.mockResolvedValue([product]);
    txMock.slot.updateMany.mockResolvedValue({ count: 1 });
    txMock.order.create.mockResolvedValue(order);
    prismaMock.$transaction.mockImplementation((callback) => callback(txMock));

    return order;
  }

  function arrangePayableOrder(): CreatedOrder {
    const withdrawalCode = createWithdrawalCode();
    const paidOrder = createOrder({
      status: OrderStatus.CONFIRMED,
      payment: {
        id: 'payment-id',
        orderId: 'order-id',
        status: PaymentStatus.PAID,
        amountCents: 949,
        provider: 'simulated',
        providerPaymentId: null,
        paidAt: now,
        createdAt: now,
        updatedAt: now
      },
      withdrawalCode
    });
    prismaMock.order.findUnique.mockResolvedValue(createPayableOrder());
    txMock.payment.updateMany.mockResolvedValue({ count: 1 });
    txMock.order.updateMany.mockResolvedValue({ count: 1 });
    txMock.withdrawalCode.findUnique.mockResolvedValue(null);
    txMock.withdrawalCode.findFirst.mockResolvedValue(null);
    txMock.withdrawalCode.create.mockResolvedValue(withdrawalCode);
    txMock.order.findUnique.mockResolvedValue(paidOrder);
    prismaMock.$transaction.mockImplementation((callback) => callback(txMock));

    return paidOrder;
  }

  function arrangeValidWithdrawal(): CreatedOrder {
    const withdrawalCode = createWithdrawalCode({
      usedAt: now
    });
    const completedOrder = createOrder({
      status: OrderStatus.COMPLETED,
      pickupConfirmedAt: now,
      withdrawalCode
    });

    txMock.withdrawalCode.findUnique.mockResolvedValue(createValidatableWithdrawalCode());
    txMock.withdrawalCode.findFirst.mockResolvedValue(createValidatableWithdrawalCode());
    txMock.withdrawalCode.updateMany.mockResolvedValue({ count: 1 });
    txMock.order.updateMany.mockResolvedValue({ count: 1 });
    txMock.order.findUnique.mockResolvedValue(completedOrder);
    prismaMock.$transaction.mockImplementation((callback) => callback(txMock));

    return completedOrder;
  }

  function arrangeMerchantOrderStatus(
    currentStatus: OrderStatus,
    nextStatus: OrderStatus
  ): CreatedOrder {
    const updatedOrder = createOrder({
      status: nextStatus
    });

    prismaMock.order.findUnique
      .mockResolvedValueOnce(
        createMerchantOrder({
          status: currentStatus
        })
      )
      .mockResolvedValueOnce(updatedOrder);
    prismaMock.order.updateMany.mockResolvedValue({ count: 1 });

    return updatedOrder;
  }

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(now);
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: prismaMock
        }
      ]
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates an order with the correct total', async () => {
    const order = arrangeValidOrder();

    await expect(service.createOrder(student.id, dto)).resolves.toEqual(order);
    const call = txMock.order.create.mock.calls[0];

    if (!call) {
      throw new Error('Expected order.create to be called');
    }

    expect(call[0].data).toMatchObject({
      productsTotalCents: 900,
      totalCents: 949,
      status: OrderStatus.PENDING_PAYMENT,
      customerFirstName: student.firstName
    });
  });

  it('adds serviceFeeCents 49', async () => {
    arrangeValidOrder();

    await service.createOrder(student.id, dto);
    const call = txMock.order.create.mock.calls[0];

    if (!call) {
      throw new Error('Expected order.create to be called');
    }

    expect(call[0].data).toMatchObject({
      serviceFeeCents: 49
    });
  });

  it('creates a simulated pending payment', async () => {
    arrangeValidOrder();

    await service.createOrder(student.id, dto);
    const call = txMock.order.create.mock.calls[0];

    if (!call) {
      throw new Error('Expected order.create to be called');
    }

    expect(call[0].data).toMatchObject({
      payment: {
        create: {
          provider: 'simulated',
          status: PaymentStatus.PENDING,
          amountCents: 949
        }
      }
    });
  });

  it('increments the slot reserved count atomically', async () => {
    arrangeValidOrder();

    await service.createOrder(student.id, dto);
    const call = txMock.slot.updateMany.mock.calls[0];

    if (!call) {
      throw new Error('Expected slot.updateMany to be called');
    }

    expect(call[0]).toMatchObject({
      where: {
        id: dto.slotId,
        snackId: dto.snackId,
        status: SlotStatus.AVAILABLE
      },
      data: {
        reservedCount: {
          increment: 1
        }
      }
    });
    expect(call[0].where?.snack).toMatchObject({
      status: SnackStatus.ONLINE,
      circuitBreaker: false
    });
  });

  it('uses capacity and reserved count conditions for the atomic reservation', async () => {
    arrangeValidOrder();

    await service.createOrder(student.id, dto);
    const call = txMock.slot.updateMany.mock.calls[0];

    if (!call) {
      throw new Error('Expected slot.updateMany to be called');
    }

    expect(call[0].where).toMatchObject({
      capacity: {
        gt: 0
      }
    });
    expect(call[0].where).toHaveProperty('reservedCount.lt');
  });

  it('does not create the order if the atomic reservation fails', async () => {
    arrangeValidOrder();
    txMock.slot.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.createOrder(student.id, dto)).rejects.toBeInstanceOf(BadRequestException);
    expect(txMock.order.create).not.toHaveBeenCalled();
  });

  it('refuses a full slot', async () => {
    arrangeValidOrder();
    prismaMock.slot.findUnique.mockResolvedValue(
      createSlot({
        reservedCount: 10,
        capacity: 10
      })
    );

    await expect(service.createOrder(student.id, dto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses a capacity 0 slot', async () => {
    arrangeValidOrder();
    prismaMock.slot.findUnique.mockResolvedValue(
      createSlot({
        reservedCount: 0,
        capacity: 0
      })
    );

    await expect(service.createOrder(student.id, dto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses a slot outside the requested snack', async () => {
    arrangeValidOrder();
    prismaMock.slot.findUnique.mockResolvedValue(
      createSlot({
        snackId: 'other-snack-id'
      })
    );

    await expect(service.createOrder(student.id, dto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses an offline snack', async () => {
    arrangeValidOrder();
    const slot = createSlot();
    prismaMock.slot.findUnique.mockResolvedValue({
      ...slot,
      snack: {
        ...slot.snack,
        status: SnackStatus.OFFLINE
      }
    });

    await expect(service.createOrder(student.id, dto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses an active circuit breaker', async () => {
    arrangeValidOrder();
    const slot = createSlot();
    prismaMock.slot.findUnique.mockResolvedValue({
      ...slot,
      snack: {
        ...slot.snack,
        circuitBreaker: true
      }
    });

    await expect(service.createOrder(student.id, dto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses a snack snoozed in the future', async () => {
    arrangeValidOrder();
    const slot = createSlot();
    prismaMock.slot.findUnique.mockResolvedValue({
      ...slot,
      snack: {
        ...slot.snack,
        snoozedUntil: new Date('2026-01-01T10:15:00.000Z')
      }
    });

    await expect(service.createOrder(student.id, dto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses an unavailable product', async () => {
    arrangeValidOrder();
    prismaMock.product.findMany.mockResolvedValue([
      {
        ...product,
        isAvailable: false
      }
    ]);

    await expect(service.createOrder(student.id, dto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses a product outside the requested snack', async () => {
    arrangeValidOrder();
    prismaMock.product.findMany.mockResolvedValue([
      {
        ...product,
        snackId: 'other-snack-id'
      }
    ]);

    await expect(service.createOrder(student.id, dto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses a missing product', async () => {
    arrangeValidOrder();
    prismaMock.product.findMany.mockResolvedValue([]);

    await expect(service.createOrder(student.id, dto)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns only orders for the connected student', async () => {
    const orders = arrangeStudentOrdersList();

    await expect(service.findStudentOrders(student.id, {})).resolves.toEqual(orders);
    const call = prismaMock.order.findMany.mock.calls[0];

    if (!call) {
      throw new Error('Expected order.findMany to be called');
    }

    expect(call[0].where).toMatchObject({
      userId: student.id
    });
  });

  it('filters student orders by status', async () => {
    arrangeStudentOrdersList();

    await service.findStudentOrders(student.id, { status: OrderStatus.CONFIRMED });
    const call = prismaMock.order.findMany.mock.calls[0];

    if (!call) {
      throw new Error('Expected order.findMany to be called');
    }

    expect(call[0].where).toMatchObject({
      status: OrderStatus.CONFIRMED
    });
  });

  it('filters student orders by from and to dates on createdAt', async () => {
    arrangeStudentOrdersList();
    const from = '2026-01-01T08:00:00.000Z';
    const to = '2026-01-02T08:00:00.000Z';
    const query: StudentOrdersQueryDto = {
      from,
      to
    };

    await service.findStudentOrders(student.id, query);
    const call = prismaMock.order.findMany.mock.calls[0];

    if (!call) {
      throw new Error('Expected order.findMany to be called');
    }

    expect(call[0].where).toMatchObject({
      createdAt: {
        gte: new Date(from),
        lt: new Date(to)
      }
    });
  });

  it('does not filter student orders by date by default', async () => {
    arrangeStudentOrdersList();

    await service.findStudentOrders(student.id, {});
    const call = prismaMock.order.findMany.mock.calls[0];

    if (!call) {
      throw new Error('Expected order.findMany to be called');
    }

    expect(call[0].where).not.toHaveProperty('createdAt');
  });

  it('sorts student orders by creation date descending', async () => {
    arrangeStudentOrdersList();

    await service.findStudentOrders(student.id, {});
    const call = prismaMock.order.findMany.mock.calls[0];

    if (!call) {
      throw new Error('Expected order.findMany to be called');
    }

    expect(call[0].orderBy).toEqual({
      createdAt: 'desc'
    });
  });

  it('returns student orders with items, payment, slot, snack and withdrawalCode', async () => {
    const orders = arrangeStudentOrdersList();

    await expect(service.findStudentOrders(student.id, {})).resolves.toEqual(orders);
    const call = prismaMock.order.findMany.mock.calls[0];

    if (!call) {
      throw new Error('Expected order.findMany to be called');
    }

    expect(call[0].include).toEqual({
      items: true,
      payment: true,
      slot: true,
      snack: true,
      withdrawalCode: true
    });
  });

  it('returns an empty list when the connected student has no matching orders', async () => {
    arrangeStudentOrdersList([]);

    await expect(service.findStudentOrders(student.id, {})).resolves.toEqual([]);
  });

  it('refuses student order date filters when from is after to', async () => {
    arrangeStudentOrdersList();

    await expect(
      service.findStudentOrders(student.id, {
        from: '2026-01-02T08:00:00.000Z',
        to: '2026-01-01T08:00:00.000Z'
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.order.findMany).not.toHaveBeenCalled();
  });

  it('returns an order detail when the student owns it', async () => {
    const order = arrangeOrderDetail();

    await expect(service.findOrderByIdForUser(studentUser, 'order-id')).resolves.toEqual(order);
  });

  it('refuses an order detail when the student does not own it', async () => {
    arrangeOrderDetail(
      createOrderDetail({
        userId: 'other-student-id'
      })
    );

    await expect(service.findOrderByIdForUser(studentUser, 'order-id')).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  it('returns an order detail when the merchant owns the snack', async () => {
    const order = arrangeOrderDetail();

    await expect(service.findOrderByIdForUser(merchantUser, 'order-id')).resolves.toEqual(order);
  });

  it('refuses an order detail when the merchant does not own the snack', async () => {
    const order = createOrderDetail();
    arrangeOrderDetail({
      ...order,
      snack: {
        ...order.snack,
        merchant: {
          ...order.snack.merchant,
          userId: 'other-merchant-user-id'
        }
      }
    });

    await expect(service.findOrderByIdForUser(merchantUser, 'order-id')).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  it('returns an order detail for an admin user', async () => {
    const order = arrangeOrderDetail();

    await expect(service.findOrderByIdForUser(adminUser, 'order-id')).resolves.toEqual(order);
  });

  it('refuses a missing order detail with NotFoundException', async () => {
    prismaMock.order.findUnique.mockResolvedValue(null);

    await expect(
      service.findOrderByIdForUser(studentUser, 'missing-order-id')
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns an order detail with items, payment, slot, snack and withdrawalCode', async () => {
    const order = arrangeOrderDetail();

    await expect(service.findOrderByIdForUser(studentUser, 'order-id')).resolves.toMatchObject({
      items: order.items,
      payment: order.payment,
      slot: order.slot,
      snack: order.snack,
      withdrawalCode: order.withdrawalCode
    });
    const call = prismaMock.order.findUnique.mock.calls[0];

    if (!call) {
      throw new Error('Expected order.findUnique to be called');
    }

    expect(call[0].include).toMatchObject({
      items: true,
      payment: true,
      slot: true,
      snack: {
        include: {
          merchant: true
        }
      },
      withdrawalCode: true
    });
  });

  it('includes a minimal student user without passwordHash in order detail', async () => {
    const order = arrangeOrderDetail();

    const result = await service.findOrderByIdForUser(studentUser, 'order-id');
    const call = prismaMock.order.findUnique.mock.calls[0];

    if (!call) {
      throw new Error('Expected order.findUnique to be called');
    }

    expect(result.user).toEqual(order.user);
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(call[0].include).toMatchObject({
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    });
  });

  it('returns orders for the connected merchant', async () => {
    const orders = arrangeMerchantOrdersList();

    await expect(service.findMerchantOrders(merchantId, {})).resolves.toEqual(orders);
  });

  it('filters merchant orders by snackId', async () => {
    arrangeMerchantOrdersList();

    await service.findMerchantOrders(merchantId, { snackId: 'snack-id' });
    const call = prismaMock.order.findMany.mock.calls[0];

    if (!call) {
      throw new Error('Expected order.findMany to be called');
    }

    expect(call[0].where).toMatchObject({
      snack: {
        id: 'snack-id',
        merchant: {
          userId: merchantId
        }
      }
    });
  });

  it('filters merchant orders by status', async () => {
    arrangeMerchantOrdersList();

    await service.findMerchantOrders(merchantId, { status: OrderStatus.READY });
    const call = prismaMock.order.findMany.mock.calls[0];

    if (!call) {
      throw new Error('Expected order.findMany to be called');
    }

    expect(call[0].where).toMatchObject({
      status: OrderStatus.READY
    });
  });

  it('filters merchant orders by from and to dates', async () => {
    arrangeMerchantOrdersList();
    const from = '2026-01-01T08:00:00.000Z';
    const to = '2026-01-01T13:00:00.000Z';
    const query: MerchantOrdersQueryDto = {
      from,
      to
    };

    await service.findMerchantOrders(merchantId, query);
    const call = prismaMock.order.findMany.mock.calls[0];

    if (!call) {
      throw new Error('Expected order.findMany to be called');
    }

    expect(call[0].where).toMatchObject({
      slot: {
        startAt: {
          gte: new Date(from),
          lt: new Date(to)
        }
      }
    });
  });

  it('applies the current service day by default when from and to are absent', async () => {
    arrangeMerchantOrdersList();

    await service.findMerchantOrders(merchantId, {});
    const call = prismaMock.order.findMany.mock.calls[0];
    const serviceDayStart = new Date(now);
    serviceDayStart.setHours(0, 0, 0, 0);
    const serviceDayEnd = new Date(serviceDayStart);
    serviceDayEnd.setDate(serviceDayEnd.getDate() + 1);

    if (!call) {
      throw new Error('Expected order.findMany to be called');
    }

    expect(call[0].where).toMatchObject({
      slot: {
        startAt: {
          gte: serviceDayStart,
          lt: serviceDayEnd
        }
      }
    });
  });

  it('sorts merchant orders by slot start then creation date', async () => {
    arrangeMerchantOrdersList();

    await service.findMerchantOrders(merchantId, {});
    const call = prismaMock.order.findMany.mock.calls[0];

    if (!call) {
      throw new Error('Expected order.findMany to be called');
    }

    expect(call[0].orderBy).toEqual([
      {
        slot: {
          startAt: 'asc'
        }
      },
      {
        createdAt: 'asc'
      }
    ]);
  });

  it('always filters merchant orders by snack merchant user id', async () => {
    arrangeMerchantOrdersList();

    await service.findMerchantOrders(merchantId, {});
    const call = prismaMock.order.findMany.mock.calls[0];

    if (!call) {
      throw new Error('Expected order.findMany to be called');
    }

    expect(call[0].where).toMatchObject({
      snack: {
        merchant: {
          userId: merchantId
        }
      }
    });
  });

  it('returns an empty list when the connected merchant has no matching orders', async () => {
    arrangeMerchantOrdersList([]);

    await expect(service.findMerchantOrders(merchantId, {})).resolves.toEqual([]);
  });

  it('selects a minimal student user without passwordHash for merchant orders', async () => {
    arrangeMerchantOrdersList();

    const result = await service.findMerchantOrders(merchantId, {});
    const [order] = result;
    const call = prismaMock.order.findMany.mock.calls[0];

    if (!order || !call) {
      throw new Error('Expected merchant order and order.findMany call');
    }

    expect(order.user).not.toHaveProperty('passwordHash');
    expect(call[0].include).toMatchObject({
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    });
  });

  it('refuses merchant order date filters when from is after to', async () => {
    arrangeMerchantOrdersList();

    await expect(
      service.findMerchantOrders(merchantId, {
        from: '2026-01-01T13:00:00.000Z',
        to: '2026-01-01T08:00:00.000Z'
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.order.findMany).not.toHaveBeenCalled();
  });

  it('pays a pending simulated order', async () => {
    const paidOrder = arrangePayableOrder();

    await expect(service.paySimulatedOrder(student.id, 'order-id')).resolves.toEqual(paidOrder);
  });

  it('creates a withdrawal code after confirmed payment', async () => {
    arrangePayableOrder();

    await service.paySimulatedOrder(student.id, 'order-id');
    const call = txMock.withdrawalCode.create.mock.calls[0];

    if (!call) {
      throw new Error('Expected withdrawalCode.create to be called');
    }

    expect(call[0].data.orderId).toBe('order-id');
  });

  it('generates an exactly 4 digit withdrawal code', async () => {
    arrangePayableOrder();

    await service.paySimulatedOrder(student.id, 'order-id');
    const call = txMock.withdrawalCode.create.mock.calls[0];

    if (!call) {
      throw new Error('Expected withdrawalCode.create to be called');
    }

    expect(call[0].data.code).toMatch(/^\d{4}$/);
  });

  it('generates a qrToken without using Math.random', async () => {
    const mathRandomSpy = jest.spyOn(Math, 'random');
    arrangePayableOrder();

    await service.paySimulatedOrder(student.id, 'order-id');
    const call = txMock.withdrawalCode.create.mock.calls[0];

    if (!call) {
      throw new Error('Expected withdrawalCode.create to be called');
    }

    expect(call[0].data.qrToken).toEqual(expect.any(String));
    expect(mathRandomSpy).not.toHaveBeenCalled();
    mathRandomSpy.mockRestore();
  });

  it('does not create a second withdrawal code if one already exists', async () => {
    const existingWithdrawalCode = createWithdrawalCode({
      id: 'existing-withdrawal-code-id'
    });
    arrangePayableOrder();
    txMock.withdrawalCode.findUnique.mockResolvedValue(existingWithdrawalCode);
    txMock.order.findUnique.mockResolvedValue(
      createOrder({
        status: OrderStatus.CONFIRMED,
        withdrawalCode: existingWithdrawalCode
      })
    );

    await expect(service.paySimulatedOrder(student.id, 'order-id')).resolves.toMatchObject({
      withdrawalCode: existingWithdrawalCode
    });
    expect(txMock.withdrawalCode.create).not.toHaveBeenCalled();
  });

  it('retries when an active withdrawal code collision exists for the same snack and service day', async () => {
    arrangePayableOrder();
    txMock.withdrawalCode.findFirst
      .mockResolvedValueOnce(createWithdrawalCode({ id: 'collision-id' }))
      .mockResolvedValueOnce(null);

    await service.paySimulatedOrder(student.id, 'order-id');
    const call = txMock.withdrawalCode.findFirst.mock.calls[0];
    const serviceDayStart = new Date('2026-01-01T12:00:00.000Z');
    serviceDayStart.setHours(0, 0, 0, 0);
    const serviceDayEnd = new Date(serviceDayStart);
    serviceDayEnd.setDate(serviceDayEnd.getDate() + 1);

    if (!call) {
      throw new Error('Expected withdrawalCode.findFirst to be called');
    }

    expect(txMock.withdrawalCode.findFirst).toHaveBeenCalledTimes(2);
    expect(call[0].where).toMatchObject({
      order: {
        snackId: 'snack-id',
        slot: {
          startAt: {
            gte: serviceDayStart,
            lt: serviceDayEnd
          }
        }
      }
    });
    expect(call[0].where).toMatchObject({
      order: {
        status: {
          in: [
            OrderStatus.CONFIRMED,
            OrderStatus.WAITING_PULL_CONFIRMATION,
            OrderStatus.PREPARING,
            OrderStatus.READY,
            OrderStatus.LATE
          ]
        }
      }
    });
  });

  it('fails cleanly after too many active withdrawal code collisions', async () => {
    arrangePayableOrder();
    txMock.withdrawalCode.findFirst.mockResolvedValue(createWithdrawalCode({ id: 'collision-id' }));

    await expect(service.paySimulatedOrder(student.id, 'order-id')).rejects.toBeInstanceOf(
      InternalServerErrorException
    );
    expect(txMock.withdrawalCode.findFirst).toHaveBeenCalledTimes(20);
    expect(txMock.withdrawalCode.create).not.toHaveBeenCalled();
  });

  it('returns the paid order with its withdrawal code', async () => {
    const withdrawalCode = createWithdrawalCode();
    arrangePayableOrder();
    txMock.order.findUnique.mockResolvedValue(
      createOrder({
        status: OrderStatus.CONFIRMED,
        withdrawalCode
      })
    );

    await expect(service.paySimulatedOrder(student.id, 'order-id')).resolves.toMatchObject({
      withdrawalCode
    });
  });

  it('updates the payment status to PAID and sets paidAt', async () => {
    arrangePayableOrder();

    await service.paySimulatedOrder(student.id, 'order-id');

    expect(txMock.payment.updateMany).toHaveBeenCalledWith({
      where: {
        orderId: 'order-id',
        provider: 'simulated',
        status: PaymentStatus.PENDING,
        order: {
          userId: student.id,
          status: OrderStatus.PENDING_PAYMENT
        }
      },
      data: {
        status: PaymentStatus.PAID,
        paidAt: now
      }
    });
  });

  it('updates the order status to CONFIRMED after payment is paid', async () => {
    arrangePayableOrder();

    await service.paySimulatedOrder(student.id, 'order-id');

    expect(txMock.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'order-id',
        userId: student.id,
        status: OrderStatus.PENDING_PAYMENT,
        payment: {
          status: PaymentStatus.PAID
        }
      },
      data: {
        status: OrderStatus.CONFIRMED
      }
    });
  });

  it('refuses a missing order during simulated payment', async () => {
    arrangePayableOrder();
    prismaMock.order.findUnique.mockResolvedValue(null);

    await expect(service.paySimulatedOrder(student.id, 'missing-order')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('refuses an order owned by another student', async () => {
    arrangePayableOrder();
    prismaMock.order.findUnique.mockResolvedValue(
      createPayableOrder({
        userId: 'other-student-id'
      })
    );

    await expect(service.paySimulatedOrder(student.id, 'order-id')).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  it('refuses an already confirmed order', async () => {
    arrangePayableOrder();
    prismaMock.order.findUnique.mockResolvedValue(
      createPayableOrder({
        status: OrderStatus.CONFIRMED
      })
    );

    await expect(service.paySimulatedOrder(student.id, 'order-id')).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('refuses an order without payment', async () => {
    arrangePayableOrder();
    prismaMock.order.findUnique.mockResolvedValue(
      createPayableOrder({
        payment: null
      })
    );

    await expect(service.paySimulatedOrder(student.id, 'order-id')).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('refuses an already paid payment', async () => {
    arrangePayableOrder();
    const order = createPayableOrder();
    prismaMock.order.findUnique.mockResolvedValue({
      ...order,
      payment: order.payment
        ? {
            ...order.payment,
            status: PaymentStatus.PAID
          }
        : null
    });

    await expect(service.paySimulatedOrder(student.id, 'order-id')).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('refuses a provider different from simulated', async () => {
    arrangePayableOrder();
    const order = createPayableOrder();
    prismaMock.order.findUnique.mockResolvedValue({
      ...order,
      payment: order.payment
        ? {
            ...order.payment,
            provider: 'stripe'
          }
        : null
    });

    await expect(service.paySimulatedOrder(student.id, 'order-id')).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('does not confirm the order if the payment cannot be marked paid', async () => {
    arrangePayableOrder();
    txMock.payment.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.paySimulatedOrder(student.id, 'order-id')).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(txMock.order.updateMany).not.toHaveBeenCalled();
  });

  it('validates a withdrawal by qrToken', async () => {
    const completedOrder = arrangeValidWithdrawal();

    await expect(service.validateWithdrawal(merchantId, { qrToken: 'qr-token' })).resolves.toEqual(
      completedOrder
    );
    const call = txMock.withdrawalCode.findUnique.mock.calls[0];

    if (!call) {
      throw new Error('Expected withdrawalCode.findUnique to be called');
    }

    expect(call[0].where).toEqual({
      qrToken: 'qr-token'
    });
    expect(call[0].include).toBeDefined();
  });

  it('validates a withdrawal by code and snackId', async () => {
    const completedOrder = arrangeValidWithdrawal();

    await expect(
      service.validateWithdrawal(merchantId, { code: '1234', snackId: 'snack-id' })
    ).resolves.toEqual(completedOrder);
    const call = txMock.withdrawalCode.findFirst.mock.calls[0];

    if (!call) {
      throw new Error('Expected withdrawalCode.findFirst to be called');
    }

    const serviceDayStart = new Date(now);
    serviceDayStart.setHours(0, 0, 0, 0);
    const serviceDayEnd = new Date(serviceDayStart);
    serviceDayEnd.setDate(serviceDayEnd.getDate() + 1);

    expect(call[0].where).toMatchObject({
      code: '1234',
      usedAt: null,
      expiresAt: {
        gt: now
      },
      order: {
        snackId: 'snack-id',
        status: {
          in: [
            OrderStatus.CONFIRMED,
            OrderStatus.WAITING_PULL_CONFIRMATION,
            OrderStatus.PREPARING,
            OrderStatus.READY,
            OrderStatus.LATE
          ]
        },
        slot: {
          startAt: {
            gte: serviceDayStart,
            lt: serviceDayEnd
          }
        }
      }
    });
  });

  it('prioritizes qrToken when qrToken and code are provided', async () => {
    arrangeValidWithdrawal();

    await service.validateWithdrawal(merchantId, {
      qrToken: 'qr-token',
      code: '1234',
      snackId: 'snack-id'
    });

    expect(txMock.withdrawalCode.findUnique).toHaveBeenCalled();
    expect(txMock.withdrawalCode.findFirst).not.toHaveBeenCalled();
  });

  it('refuses withdrawal validation without qrToken or code', async () => {
    await expect(service.validateWithdrawal(merchantId, {})).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('refuses fallback code validation without snackId', async () => {
    await expect(service.validateWithdrawal(merchantId, { code: '1234' })).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('refuses an unknown qrToken or code', async () => {
    arrangeValidWithdrawal();
    txMock.withdrawalCode.findUnique.mockResolvedValue(null);

    await expect(
      service.validateWithdrawal(merchantId, { qrToken: 'unknown-token' })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses an already used withdrawal code', async () => {
    arrangeValidWithdrawal();
    txMock.withdrawalCode.findUnique.mockResolvedValue(
      createValidatableWithdrawalCode({
        usedAt: now
      })
    );

    await expect(
      service.validateWithdrawal(merchantId, { qrToken: 'qr-token' })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses an expired withdrawal code', async () => {
    arrangeValidWithdrawal();
    txMock.withdrawalCode.findUnique.mockResolvedValue(
      createValidatableWithdrawalCode({
        expiresAt: new Date('2026-01-01T09:59:00.000Z')
      })
    );

    await expect(
      service.validateWithdrawal(merchantId, { qrToken: 'qr-token' })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses a snack owned by another merchant', async () => {
    const withdrawalCode = createValidatableWithdrawalCode();
    arrangeValidWithdrawal();
    txMock.withdrawalCode.findUnique.mockResolvedValue({
      ...withdrawalCode,
      order: {
        ...withdrawalCode.order,
        snack: {
          ...withdrawalCode.order.snack,
          merchant: {
            ...withdrawalCode.order.snack.merchant,
            userId: 'other-merchant-user-id'
          }
        }
      }
    });

    await expect(
      service.validateWithdrawal(merchantId, { qrToken: 'qr-token' })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses a non-validable order status', async () => {
    const withdrawalCode = createValidatableWithdrawalCode();
    arrangeValidWithdrawal();
    txMock.withdrawalCode.findUnique.mockResolvedValue({
      ...withdrawalCode,
      order: {
        ...withdrawalCode.order,
        status: OrderStatus.COMPLETED
      }
    });

    await expect(
      service.validateWithdrawal(merchantId, { qrToken: 'qr-token' })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('prevents double validation when usedAt update count is 0', async () => {
    arrangeValidWithdrawal();
    txMock.withdrawalCode.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.validateWithdrawal(merchantId, { qrToken: 'qr-token' })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(txMock.order.updateMany).not.toHaveBeenCalled();
  });

  it('sets order status to COMPLETED and pickupConfirmedAt during withdrawal validation', async () => {
    arrangeValidWithdrawal();

    await service.validateWithdrawal(merchantId, { qrToken: 'qr-token' });

    expect(txMock.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'order-id',
        status: {
          in: [
            OrderStatus.CONFIRMED,
            OrderStatus.WAITING_PULL_CONFIRMATION,
            OrderStatus.PREPARING,
            OrderStatus.READY,
            OrderStatus.LATE
          ]
        }
      },
      data: {
        status: OrderStatus.COMPLETED,
        pickupConfirmedAt: now
      }
    });
  });

  it('returns the completed order with its withdrawal code', async () => {
    const completedOrder = arrangeValidWithdrawal();

    await expect(
      service.validateWithdrawal(merchantId, { qrToken: 'qr-token' })
    ).resolves.toMatchObject({
      withdrawalCode: completedOrder.withdrawalCode
    });
  });

  it('allows CONFIRMED to WAITING_PULL_CONFIRMATION', async () => {
    const updatedOrder = arrangeMerchantOrderStatus(
      OrderStatus.CONFIRMED,
      OrderStatus.WAITING_PULL_CONFIRMATION
    );

    await expect(
      service.updateMerchantOrderStatus(
        merchantId,
        'order-id',
        OrderStatus.WAITING_PULL_CONFIRMATION
      )
    ).resolves.toEqual(updatedOrder);
  });

  it('allows CONFIRMED to PREPARING', async () => {
    const updatedOrder = arrangeMerchantOrderStatus(OrderStatus.CONFIRMED, OrderStatus.PREPARING);

    await expect(
      service.updateMerchantOrderStatus(merchantId, 'order-id', OrderStatus.PREPARING)
    ).resolves.toEqual(updatedOrder);
  });

  it('allows WAITING_PULL_CONFIRMATION to PREPARING', async () => {
    const updatedOrder = arrangeMerchantOrderStatus(
      OrderStatus.WAITING_PULL_CONFIRMATION,
      OrderStatus.PREPARING
    );

    await expect(
      service.updateMerchantOrderStatus(merchantId, 'order-id', OrderStatus.PREPARING)
    ).resolves.toEqual(updatedOrder);
  });

  it('allows PREPARING to READY', async () => {
    const updatedOrder = arrangeMerchantOrderStatus(OrderStatus.PREPARING, OrderStatus.READY);

    await expect(
      service.updateMerchantOrderStatus(merchantId, 'order-id', OrderStatus.READY)
    ).resolves.toEqual(updatedOrder);
  });

  it('allows READY to LATE', async () => {
    const updatedOrder = arrangeMerchantOrderStatus(OrderStatus.READY, OrderStatus.LATE);

    await expect(
      service.updateMerchantOrderStatus(merchantId, 'order-id', OrderStatus.LATE)
    ).resolves.toEqual(updatedOrder);
  });

  it('allows LATE to READY', async () => {
    const updatedOrder = arrangeMerchantOrderStatus(OrderStatus.LATE, OrderStatus.READY);

    await expect(
      service.updateMerchantOrderStatus(merchantId, 'order-id', OrderStatus.READY)
    ).resolves.toEqual(updatedOrder);
  });

  it('refuses READY to PREPARING', async () => {
    arrangeMerchantOrderStatus(OrderStatus.READY, OrderStatus.PREPARING);

    await expect(
      service.updateMerchantOrderStatus(merchantId, 'order-id', OrderStatus.PREPARING)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses PREPARING to CONFIRMED', async () => {
    arrangeMerchantOrderStatus(OrderStatus.PREPARING, OrderStatus.CONFIRMED);

    await expect(
      service.updateMerchantOrderStatus(merchantId, 'order-id', OrderStatus.CONFIRMED)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses LATE to PREPARING', async () => {
    arrangeMerchantOrderStatus(OrderStatus.LATE, OrderStatus.PREPARING);

    await expect(
      service.updateMerchantOrderStatus(merchantId, 'order-id', OrderStatus.PREPARING)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses PENDING_PAYMENT to PREPARING', async () => {
    arrangeMerchantOrderStatus(OrderStatus.PENDING_PAYMENT, OrderStatus.PREPARING);

    await expect(
      service.updateMerchantOrderStatus(merchantId, 'order-id', OrderStatus.PREPARING)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses COMPLETED to READY', async () => {
    arrangeMerchantOrderStatus(OrderStatus.COMPLETED, OrderStatus.READY);

    await expect(
      service.updateMerchantOrderStatus(merchantId, 'order-id', OrderStatus.READY)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses updating an order owned by another merchant', async () => {
    const merchantOrder = createMerchantOrder();
    prismaMock.order.findUnique.mockResolvedValue({
      ...merchantOrder,
      snack: {
        ...merchantOrder.snack,
        merchant: {
          ...merchantOrder.snack.merchant,
          userId: 'other-merchant-user-id'
        }
      }
    });

    await expect(
      service.updateMerchantOrderStatus(merchantId, 'order-id', OrderStatus.PREPARING)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses updating a missing order', async () => {
    prismaMock.order.findUnique.mockResolvedValue(null);

    await expect(
      service.updateMerchantOrderStatus(merchantId, 'missing-order-id', OrderStatus.PREPARING)
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the merchant updated order with items, payment, slot, snack and withdrawalCode', async () => {
    const updatedOrder = arrangeMerchantOrderStatus(OrderStatus.PREPARING, OrderStatus.READY);

    await expect(
      service.updateMerchantOrderStatus(merchantId, 'order-id', OrderStatus.READY)
    ).resolves.toMatchObject({
      items: updatedOrder.items,
      payment: updatedOrder.payment,
      slot: updatedOrder.slot,
      snack: updatedOrder.snack,
      withdrawalCode: updatedOrder.withdrawalCode
    });
    expect(prismaMock.order.findUnique).toHaveBeenCalledTimes(2);
  });

  it('uses updateMany for merchant order status updates', async () => {
    arrangeMerchantOrderStatus(OrderStatus.PREPARING, OrderStatus.READY);

    await service.updateMerchantOrderStatus(merchantId, 'order-id', OrderStatus.READY);

    expect(prismaMock.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'order-id',
        status: OrderStatus.PREPARING,
        AND: [
          {
            status: {
              in: [
                OrderStatus.CONFIRMED,
                OrderStatus.WAITING_PULL_CONFIRMATION,
                OrderStatus.PREPARING,
                OrderStatus.READY,
                OrderStatus.LATE
              ]
            }
          }
        ],
        snack: {
          merchant: {
            userId: merchantId
          }
        }
      },
      data: {
        status: OrderStatus.READY
      }
    });
  });

  it('rereads the merchant order after a successful atomic status update', async () => {
    arrangeMerchantOrderStatus(OrderStatus.PREPARING, OrderStatus.READY);

    await service.updateMerchantOrderStatus(merchantId, 'order-id', OrderStatus.READY);

    expect(prismaMock.order.findUnique).toHaveBeenLastCalledWith({
      where: {
        id: 'order-id'
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

  it('refuses merchant order status update if the atomic update count is 0', async () => {
    arrangeMerchantOrderStatus(OrderStatus.PREPARING, OrderStatus.READY);
    prismaMock.order.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.updateMerchantOrderStatus(merchantId, 'order-id', OrderStatus.READY)
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.order.findUnique).toHaveBeenCalledTimes(1);
  });
});
