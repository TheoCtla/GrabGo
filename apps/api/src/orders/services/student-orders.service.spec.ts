import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, PaymentStatus, Prisma, SlotStatus, SnackStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StudentOrdersService, StudentOrderListItem } from './student-orders.service';

type PrismaMock = {
  order: {
    findMany: jest.Mock<Promise<StudentOrderListItem[]>, [Prisma.OrderFindManyArgs]>;
  };
};

describe('StudentOrdersService', () => {
  let service: StudentOrdersService;
  const now = new Date('2026-01-01T10:00:00.000Z');
  const studentId = 'student-id';
  const prismaMock: PrismaMock = {
    order: {
      findMany: jest.fn<Promise<StudentOrderListItem[]>, [Prisma.OrderFindManyArgs]>()
    }
  };

  function createOrder(overrides: Partial<StudentOrderListItem> = {}): StudentOrderListItem {
    return {
      id: 'order-id',
      userId: studentId,
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
        StudentOrdersService,
        {
          provide: PrismaService,
          useValue: prismaMock
        }
      ]
    }).compile();

    service = module.get<StudentOrdersService>(StudentOrdersService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns only orders for the connected student', async () => {
    const orders = [createOrder()];
    prismaMock.order.findMany.mockResolvedValue(orders);

    await expect(service.findStudentOrders(studentId, {})).resolves.toEqual(orders);
    expect(prismaMock.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: studentId,
          status: undefined
        }
      })
    );
  });

  it('filters student orders by status', async () => {
    prismaMock.order.findMany.mockResolvedValue([createOrder()]);

    await service.findStudentOrders(studentId, { status: OrderStatus.CONFIRMED });

    expect(getFindManyArgs().where).toMatchObject({
      status: OrderStatus.CONFIRMED
    });
  });

  it('filters student orders by from and to dates on createdAt', async () => {
    prismaMock.order.findMany.mockResolvedValue([createOrder()]);
    const from = '2026-01-01T08:00:00.000Z';
    const to = '2026-01-02T08:00:00.000Z';

    await service.findStudentOrders(studentId, { from, to });

    expect(getFindManyArgs().where).toMatchObject({
      createdAt: {
        gte: new Date(from),
        lt: new Date(to)
      }
    });
  });

  it('does not filter student orders by date by default', async () => {
    prismaMock.order.findMany.mockResolvedValue([createOrder()]);

    await service.findStudentOrders(studentId, {});
    const call = prismaMock.order.findMany.mock.calls[0];

    if (!call) {
      throw new Error('Expected order.findMany to be called');
    }

    expect(call[0].where).not.toHaveProperty('createdAt');
  });

  it('sorts student orders by creation date descending', async () => {
    prismaMock.order.findMany.mockResolvedValue([createOrder()]);

    await service.findStudentOrders(studentId, {});

    expect(getFindManyArgs().orderBy).toEqual({
      createdAt: 'desc'
    });
  });

  it('returns student orders with items, payment, slot, snack and withdrawalCode', async () => {
    prismaMock.order.findMany.mockResolvedValue([createOrder()]);

    await service.findStudentOrders(studentId, {});

    expect(getFindManyArgs().include).toEqual({
      items: true,
      payment: true,
      slot: true,
      snack: true,
      withdrawalCode: true
    });
  });

  it('returns an empty list when the connected student has no matching orders', async () => {
    prismaMock.order.findMany.mockResolvedValue([]);

    await expect(service.findStudentOrders(studentId, {})).resolves.toEqual([]);
  });

  it('refuses student order date filters when from is after to', async () => {
    await expect(
      service.findStudentOrders(studentId, {
        from: '2026-01-02T08:00:00.000Z',
        to: '2026-01-01T08:00:00.000Z'
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.order.findMany).not.toHaveBeenCalled();
  });
});
