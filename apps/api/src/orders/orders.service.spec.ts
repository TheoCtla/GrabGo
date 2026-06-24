import { BadRequestException, NotFoundException } from '@nestjs/common';
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
import { ValidateWithdrawalDto } from './dto/validate-withdrawal.dto';
import { OrdersService } from './orders.service';
import { MerchantOrdersService } from './services/merchant-orders.service';
import { MerchantOrderStatusService } from './services/merchant-order-status.service';
import { OrderDetailService } from './services/order-detail.service';
import { SimulatedPaymentService } from './services/simulated-payment.service';
import { StudentOrdersService } from './services/student-orders.service';
import { WithdrawalValidationService } from './services/withdrawal-validation.service';

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

type TransactionMock = {
  slot: {
    updateMany: jest.Mock<Promise<Prisma.BatchPayload>, [Prisma.SlotUpdateManyArgs]>;
  };
  order: {
    create: jest.Mock<Promise<CreatedOrder>, [Prisma.OrderCreateArgs]>;
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
  $transaction: jest.Mock<Promise<CreatedOrder>, [(tx: TransactionMock) => Promise<CreatedOrder>]>;
};

type StudentOrdersServiceMock = {
  findStudentOrders: jest.Mock<Promise<unknown>, [string, StudentOrdersQueryDto]>;
};

type MerchantOrdersServiceMock = {
  findMerchantOrders: jest.Mock<Promise<unknown>, [string, MerchantOrdersQueryDto]>;
};

type OrderDetailServiceMock = {
  findOrderByIdForUser: jest.Mock<Promise<unknown>, [AuthenticatedUser, string]>;
};

type MerchantOrderStatusServiceMock = {
  updateMerchantOrderStatus: jest.Mock<Promise<unknown>, [string, string, OrderStatus]>;
};

type SimulatedPaymentServiceMock = {
  paySimulatedOrder: jest.Mock<Promise<unknown>, [string, string]>;
};

type WithdrawalValidationServiceMock = {
  validateWithdrawal: jest.Mock<Promise<unknown>, [string, ValidateWithdrawalDto]>;
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
    order: {
      create: jest.fn<Promise<CreatedOrder>, [Prisma.OrderCreateArgs]>()
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
    $transaction: jest.fn<Promise<CreatedOrder>, [(tx: TransactionMock) => Promise<CreatedOrder>]>()
  };
  const studentOrdersServiceMock: StudentOrdersServiceMock = {
    findStudentOrders: jest.fn<Promise<unknown>, [string, StudentOrdersQueryDto]>()
  };
  const merchantOrdersServiceMock: MerchantOrdersServiceMock = {
    findMerchantOrders: jest.fn<Promise<unknown>, [string, MerchantOrdersQueryDto]>()
  };
  const orderDetailServiceMock: OrderDetailServiceMock = {
    findOrderByIdForUser: jest.fn<Promise<unknown>, [AuthenticatedUser, string]>()
  };
  const merchantOrderStatusServiceMock: MerchantOrderStatusServiceMock = {
    updateMerchantOrderStatus: jest.fn<Promise<unknown>, [string, string, OrderStatus]>()
  };
  const simulatedPaymentServiceMock: SimulatedPaymentServiceMock = {
    paySimulatedOrder: jest.fn<Promise<unknown>, [string, string]>()
  };
  const withdrawalValidationServiceMock: WithdrawalValidationServiceMock = {
    validateWithdrawal: jest.fn<Promise<unknown>, [string, ValidateWithdrawalDto]>()
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

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(now);
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: prismaMock
        },
        {
          provide: StudentOrdersService,
          useValue: studentOrdersServiceMock
        },
        {
          provide: MerchantOrdersService,
          useValue: merchantOrdersServiceMock
        },
        {
          provide: OrderDetailService,
          useValue: orderDetailServiceMock
        },
        {
          provide: MerchantOrderStatusService,
          useValue: merchantOrderStatusServiceMock
        },
        {
          provide: SimulatedPaymentService,
          useValue: simulatedPaymentServiceMock
        },
        {
          provide: WithdrawalValidationService,
          useValue: withdrawalValidationServiceMock
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

  it('delegates student order listing to StudentOrdersService', async () => {
    const query: StudentOrdersQueryDto = {
      status: OrderStatus.CONFIRMED
    };
    const orders = [createOrder({ status: query.status })];
    studentOrdersServiceMock.findStudentOrders.mockResolvedValue(orders);

    await expect(service.findStudentOrders(student.id, query)).resolves.toEqual(orders);
    expect(studentOrdersServiceMock.findStudentOrders).toHaveBeenCalledWith(student.id, query);
  });

  it('delegates merchant order listing to MerchantOrdersService', async () => {
    const query: MerchantOrdersQueryDto = {
      snackId: 'snack-id'
    };
    const orders = [createOrder()];
    merchantOrdersServiceMock.findMerchantOrders.mockResolvedValue(orders);

    await expect(service.findMerchantOrders(merchantId, query)).resolves.toEqual(orders);
    expect(merchantOrdersServiceMock.findMerchantOrders).toHaveBeenCalledWith(merchantId, query);
  });

  it('delegates order detail lookup to OrderDetailService', async () => {
    const order = createOrder();
    orderDetailServiceMock.findOrderByIdForUser.mockResolvedValue(order);

    await expect(service.findOrderByIdForUser(studentUser, 'order-id')).resolves.toEqual(order);
    expect(orderDetailServiceMock.findOrderByIdForUser).toHaveBeenCalledWith(
      studentUser,
      'order-id'
    );
  });

  it('delegates merchant order status updates to MerchantOrderStatusService', async () => {
    const order = createOrder({
      status: OrderStatus.READY
    });
    merchantOrderStatusServiceMock.updateMerchantOrderStatus.mockResolvedValue(order);

    await expect(
      service.updateMerchantOrderStatus(merchantId, 'order-id', OrderStatus.READY)
    ).resolves.toEqual(order);
    expect(merchantOrderStatusServiceMock.updateMerchantOrderStatus).toHaveBeenCalledWith(
      merchantId,
      'order-id',
      OrderStatus.READY
    );
  });

  it('delegates simulated payment to SimulatedPaymentService', async () => {
    const paidOrder = createOrder({
      status: OrderStatus.CONFIRMED,
      withdrawalCode: createWithdrawalCode()
    });
    simulatedPaymentServiceMock.paySimulatedOrder.mockResolvedValue(paidOrder);

    await expect(service.paySimulatedOrder(student.id, 'order-id')).resolves.toEqual(paidOrder);
    expect(simulatedPaymentServiceMock.paySimulatedOrder).toHaveBeenCalledWith(
      student.id,
      'order-id'
    );
  });

  it('delegates withdrawal validation to WithdrawalValidationService', async () => {
    const dto: ValidateWithdrawalDto = {
      qrToken: 'qr-token'
    };
    const completedOrder = createOrder({
      status: OrderStatus.COMPLETED,
      pickupConfirmedAt: now,
      withdrawalCode: createWithdrawalCode({
        usedAt: now
      })
    });
    withdrawalValidationServiceMock.validateWithdrawal.mockResolvedValue(completedOrder);

    await expect(service.validateWithdrawal(merchantId, dto)).resolves.toEqual(completedOrder);
    expect(withdrawalValidationServiceMock.validateWithdrawal).toHaveBeenCalledWith(
      merchantId,
      dto
    );
  });
});
