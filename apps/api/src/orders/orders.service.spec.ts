import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
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
  User
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
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
  };
}>;

type OrderWithPayment = Prisma.OrderGetPayload<{
  include: {
    payment: true;
  };
}>;

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
    findUnique: jest.Mock<Promise<OrderWithPayment | null>, [Prisma.OrderFindUniqueArgs]>;
  };
  $transaction: jest.Mock<Promise<CreatedOrder>, [(tx: TransactionMock) => Promise<CreatedOrder>]>;
};

describe('OrdersService', () => {
  let service: OrdersService;
  const now = new Date('2026-01-01T10:00:00.000Z');
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
      findUnique: jest.fn<Promise<OrderWithPayment | null>, [Prisma.OrderFindUniqueArgs]>()
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
      ...overrides
    };
  }

  function createOrderWithPayment(overrides: Partial<OrderWithPayment> = {}): OrderWithPayment {
    const order = createOrder();
    const { items, slot, snack, ...orderWithPayment } = order;
    void items;
    void slot;
    void snack;

    return {
      ...orderWithPayment,
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

  function arrangePayableOrder(): CreatedOrder {
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
      }
    });
    prismaMock.order.findUnique.mockResolvedValue(createOrderWithPayment());
    txMock.payment.updateMany.mockResolvedValue({ count: 1 });
    txMock.order.updateMany.mockResolvedValue({ count: 1 });
    txMock.order.findUnique.mockResolvedValue(paidOrder);
    prismaMock.$transaction.mockImplementation((callback) => callback(txMock));

    return paidOrder;
  }

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(now);

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
    jest.clearAllMocks();
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

  it('pays a pending simulated order', async () => {
    const paidOrder = arrangePayableOrder();

    await expect(service.paySimulatedOrder(student.id, 'order-id')).resolves.toEqual(paidOrder);
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
      createOrderWithPayment({
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
      createOrderWithPayment({
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
      createOrderWithPayment({
        payment: null
      })
    );

    await expect(service.paySimulatedOrder(student.id, 'order-id')).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('refuses an already paid payment', async () => {
    arrangePayableOrder();
    const order = createOrderWithPayment();
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
    const order = createOrderWithPayment();
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
});
