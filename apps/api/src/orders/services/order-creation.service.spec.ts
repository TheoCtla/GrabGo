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
  User
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderCreated, OrderCreationService } from './order-creation.service';

type SlotWithSnack = Prisma.SlotGetPayload<{
  include: { snack: true };
}>;

type TransactionMock = {
  slot: {
    updateMany: jest.Mock<Promise<Prisma.BatchPayload>, [Prisma.SlotUpdateManyArgs]>;
  };
  order: {
    create: jest.Mock<Promise<OrderCreated>, [Prisma.OrderCreateArgs]>;
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
  $transaction: jest.Mock<Promise<OrderCreated>, [(tx: TransactionMock) => Promise<OrderCreated>]>;
};

describe('OrderCreationService', () => {
  let service: OrderCreationService;
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
    order: {
      create: jest.fn<Promise<OrderCreated>, [Prisma.OrderCreateArgs]>()
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
    $transaction: jest.fn<Promise<OrderCreated>, [(tx: TransactionMock) => Promise<OrderCreated>]>()
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

  function createOrder(overrides: Partial<OrderCreated> = {}): OrderCreated {
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

  function arrangeValidOrder(): OrderCreated {
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
        OrderCreationService,
        {
          provide: PrismaService,
          useValue: prismaMock
        }
      ]
    }).compile();

    service = module.get<OrderCreationService>(OrderCreationService);
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
});
