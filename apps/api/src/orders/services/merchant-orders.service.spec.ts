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
  const merchantId = 'merchant-user-id';
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

    await expect(service.findMerchantOrders(merchantId, {})).resolves.toEqual(orders);
  });

  it('filters merchant orders by snackId', async () => {
    prismaMock.order.findMany.mockResolvedValue([createOrder()]);

    await service.findMerchantOrders(merchantId, { snackId: 'snack-id' });

    expect(getFindManyArgs().where).toMatchObject({
      snack: {
        id: 'snack-id',
        merchant: {
          userId: merchantId
        }
      }
    });
  });

  it('filters merchant orders by status', async () => {
    prismaMock.order.findMany.mockResolvedValue([createOrder()]);

    await service.findMerchantOrders(merchantId, { status: OrderStatus.READY });

    expect(getFindManyArgs().where).toMatchObject({
      status: OrderStatus.READY
    });
  });

  it('filters merchant orders by from and to dates', async () => {
    prismaMock.order.findMany.mockResolvedValue([createOrder()]);
    const from = '2026-01-01T08:00:00.000Z';
    const to = '2026-01-01T13:00:00.000Z';

    await service.findMerchantOrders(merchantId, { from, to });

    expect(getFindManyArgs().where).toMatchObject({
      slot: {
        startAt: {
          gte: new Date(from),
          lt: new Date(to)
        }
      }
    });
  });

  it('applies the current service day by default when from and to are absent', async () => {
    prismaMock.order.findMany.mockResolvedValue([createOrder()]);
    const serviceDayStart = new Date(now);
    serviceDayStart.setHours(0, 0, 0, 0);
    const serviceDayEnd = new Date(serviceDayStart);
    serviceDayEnd.setDate(serviceDayEnd.getDate() + 1);

    await service.findMerchantOrders(merchantId, {});

    expect(getFindManyArgs().where).toMatchObject({
      slot: {
        startAt: {
          gte: serviceDayStart,
          lt: serviceDayEnd
        }
      }
    });
  });

  it('sorts merchant orders by slot start then creation date', async () => {
    prismaMock.order.findMany.mockResolvedValue([createOrder()]);

    await service.findMerchantOrders(merchantId, {});

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

  it('always filters merchant orders by snack merchant user id', async () => {
    prismaMock.order.findMany.mockResolvedValue([createOrder()]);

    await service.findMerchantOrders(merchantId, {});

    expect(getFindManyArgs().where).toMatchObject({
      snack: {
        merchant: {
          userId: merchantId
        }
      }
    });
  });

  it('returns an empty list when the connected merchant has no matching orders', async () => {
    prismaMock.order.findMany.mockResolvedValue([]);

    await expect(service.findMerchantOrders(merchantId, {})).resolves.toEqual([]);
  });

  it('selects a minimal student user without passwordHash for merchant orders', async () => {
    prismaMock.order.findMany.mockResolvedValue([createOrder()]);

    const [order] = await service.findMerchantOrders(merchantId, {});

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
      service.findMerchantOrders(merchantId, {
        from: '2026-01-01T13:00:00.000Z',
        to: '2026-01-01T08:00:00.000Z'
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.order.findMany).not.toHaveBeenCalled();
  });
});
