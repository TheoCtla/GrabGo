import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, PaymentStatus, Prisma, SlotStatus, SnackStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MerchantOrderListItem, MerchantOrdersService } from './merchant-orders.service';

type PrismaMock = {
  order: {
    findMany: jest.Mock<Promise<MerchantOrderListItem[]>, [Prisma.OrderFindManyArgs]>;
  };
};

describe('MerchantOrdersService', () => {
  let service: MerchantOrdersService;
  const now = new Date('2026-01-01T10:00:00.000Z');
  const merchantUserId = 'merchant-user-id';
  const merchantRecordId = 'merchant-record-id';
  const otherMerchantUserId = 'other-merchant-user-id';
  const prismaMock: PrismaMock = {
    order: {
      findMany: jest.fn<Promise<MerchantOrderListItem[]>, [Prisma.OrderFindManyArgs]>()
    }
  };

  function createOrder(overrides: Partial<MerchantOrderListItem> = {}): MerchantOrderListItem {
    return {
      id: 'order-id',
      userId: 'student-id',
      snackId: 'snack-id',
      slotId: 'slot-id',
      status: OrderStatus.CONFIRMED,
      productsTotalCents: 900,
      serviceFeeCents: 49,
      totalCents: 949,
      customerFirstName: 'Ada',
      specialNote: null,
      pickupConfirmedAt: null,
      lateReportedAt: null,
      createdAt: now,
      updatedAt: now,
      items: [],
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
        merchantId: merchantRecordId,
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
      user: {
        id: 'student-id',
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'student@grabgo.test'
      },
      ...overrides
    };
  }

  function getFindManyArgs(): Prisma.OrderFindManyArgs {
    const call = prismaMock.order.findMany.mock.calls[0];

    if (!call) {
      throw new Error('Expected order.findMany to be called');
    }

    return call[0];
  }

  function getDefaultStatusFilter(): Prisma.EnumOrderStatusFilter<'Order'> {
    const statusFilter = getFindManyArgs().where?.status;

    if (!statusFilter || typeof statusFilter === 'string') {
      throw new Error('Expected a default status filter object');
    }

    return statusFilter;
  }

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(now);
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MerchantOrdersService,
        {
          provide: PrismaService,
          useValue: prismaMock
        }
      ]
    }).compile();

    service = module.get<MerchantOrdersService>(MerchantOrdersService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns orders for the connected merchant', async () => {
    const orders = [createOrder()];
    prismaMock.order.findMany.mockResolvedValue(orders);

    await expect(service.findMerchantOrders(merchantUserId, {})).resolves.toEqual(orders);
  });

  it('lets a merchant see a confirmed order from their snack', async () => {
    const confirmedOrder = createOrder({
      status: OrderStatus.CONFIRMED
    });
    prismaMock.order.findMany.mockResolvedValue([confirmedOrder]);

    await expect(service.findMerchantOrders(merchantUserId, {})).resolves.toEqual([confirmedOrder]);
    expect(getDefaultStatusFilter().in).toContain(OrderStatus.CONFIRMED);
  });

  it('lets a merchant see a waiting pull confirmation order from their snack', async () => {
    const waitingOrder = createOrder({
      status: OrderStatus.WAITING_PULL_CONFIRMATION
    });
    prismaMock.order.findMany.mockResolvedValue([waitingOrder]);

    await expect(service.findMerchantOrders(merchantUserId, {})).resolves.toEqual([waitingOrder]);
    expect(getDefaultStatusFilter().in).toContain(OrderStatus.WAITING_PULL_CONFIRMATION);
  });

  it('lets a merchant see orders from snacks owned by their user account', async () => {
    prismaMock.order.findMany.mockResolvedValue([createOrder()]);

    await service.findMerchantOrders(merchantUserId, {});

    expect(getFindManyArgs().where).toMatchObject({
      snack: {
        merchant: {
          is: {
            userId: merchantUserId
          }
        }
      }
    });
  });

  it('does not filter merchant orders with snack.merchantId equal to the user id', async () => {
    prismaMock.order.findMany.mockResolvedValue([createOrder()]);

    await service.findMerchantOrders(merchantUserId, {});

    expect(getFindManyArgs().where).toMatchObject({
      snack: {
        merchant: {
          is: {
            userId: merchantUserId
          }
        }
      }
    });
    expect(getFindManyArgs().where).not.toMatchObject({
      snack: {
        merchantId: merchantUserId
      }
    });
  });

  it('does not include orders from another merchant in the generated filter', async () => {
    prismaMock.order.findMany.mockResolvedValue([]);

    await service.findMerchantOrders(merchantUserId, {});

    expect(getFindManyArgs().where).toMatchObject({
      snack: {
        merchant: {
          is: {
            userId: merchantUserId
          }
        }
      }
    });
    expect(getFindManyArgs().where).not.toMatchObject({
      snack: {
        merchant: {
          is: {
            userId: otherMerchantUserId
          }
        }
      }
    });
  });

  it('filters merchant orders by snackId while keeping merchant ownership', async () => {
    prismaMock.order.findMany.mockResolvedValue([createOrder()]);

    await service.findMerchantOrders(merchantUserId, { snackId: 'snack-id' });

    expect(getFindManyArgs().where).toMatchObject({
      snack: {
        id: 'snack-id',
        merchant: {
          is: {
            userId: merchantUserId
          }
        }
      }
    });
  });

  it('filters merchant orders by status', async () => {
    prismaMock.order.findMany.mockResolvedValue([createOrder()]);

    await service.findMerchantOrders(merchantUserId, { status: OrderStatus.READY });

    expect(getFindManyArgs().where).toMatchObject({
      status: {
        equals: OrderStatus.READY
      }
    });
  });

  it('filters merchant orders by from and to dates', async () => {
    prismaMock.order.findMany.mockResolvedValue([createOrder()]);
    const from = '2026-01-01T08:00:00.000Z';
    const to = '2026-01-01T13:00:00.000Z';

    await service.findMerchantOrders(merchantUserId, { from, to });

    expect(getFindManyArgs().where).toMatchObject({
      slot: {
        startAt: {
          gte: new Date(from),
          lt: new Date(to)
        }
      }
    });
  });

  it('does not apply a default slot date filter when from and to are absent', async () => {
    prismaMock.order.findMany.mockResolvedValue([createOrder()]);

    await service.findMerchantOrders(merchantUserId, {});

    expect(getFindManyArgs().where).not.toHaveProperty('slot');
  });

  it('sorts merchant orders by slot start then creation date', async () => {
    prismaMock.order.findMany.mockResolvedValue([createOrder()]);

    await service.findMerchantOrders(merchantUserId, {});

    expect(getFindManyArgs().orderBy).toEqual([
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

  it('does not return an empty list when an order exists for the merchant snack', async () => {
    prismaMock.order.findMany.mockResolvedValue([createOrder()]);

    await expect(service.findMerchantOrders(merchantUserId, {})).resolves.toHaveLength(1);
  });

  it('includes an order visible through detail in the merchant list filters', async () => {
    const orderVisibleThroughDetail = createOrder({
      id: 'order-visible-through-detail',
      snackId: 'snack-id',
      status: OrderStatus.WAITING_PULL_CONFIRMATION,
      slot: {
        ...createOrder().slot,
        startAt: new Date('2025-12-31T12:00:00.000Z'),
        endAt: new Date('2025-12-31T12:15:00.000Z')
      }
    });
    prismaMock.order.findMany.mockResolvedValue([orderVisibleThroughDetail]);

    await expect(
      service.findMerchantOrders(merchantUserId, { snackId: 'snack-id' })
    ).resolves.toEqual([orderVisibleThroughDetail]);
    expect(getFindManyArgs().where).toMatchObject({
      snack: {
        id: 'snack-id',
        merchant: {
          is: {
            userId: merchantUserId
          }
        }
      },
      status: {
        in: [
          OrderStatus.CONFIRMED,
          OrderStatus.WAITING_PULL_CONFIRMATION,
          OrderStatus.PREPARING,
          OrderStatus.READY,
          OrderStatus.LATE
        ]
      }
    });
    expect(getFindManyArgs().where).not.toHaveProperty('slot');
  });

  it('always filters merchant orders by snack merchant user id', async () => {
    prismaMock.order.findMany.mockResolvedValue([createOrder()]);

    await service.findMerchantOrders(merchantUserId, {});

    expect(getFindManyArgs().where).toMatchObject({
      snack: {
        merchant: {
          is: {
            userId: merchantUserId
          }
        }
      }
    });
  });

  it('returns an empty list when the connected merchant has no matching orders', async () => {
    prismaMock.order.findMany.mockResolvedValue([]);

    await expect(service.findMerchantOrders(merchantUserId, {})).resolves.toEqual([]);
  });

  it('selects a minimal student user without passwordHash for merchant orders', async () => {
    prismaMock.order.findMany.mockResolvedValue([createOrder()]);

    const [order] = await service.findMerchantOrders(merchantUserId, {});

    expect(order?.user).not.toHaveProperty('passwordHash');
    expect(getFindManyArgs().include).toMatchObject({
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
    await expect(
      service.findMerchantOrders(merchantUserId, {
        from: '2026-01-01T13:00:00.000Z',
        to: '2026-01-01T08:00:00.000Z'
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.order.findMany).not.toHaveBeenCalled();
  });
});
