import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, PaymentStatus, Prisma, Role, SlotStatus, SnackStatus } from '@prisma/client';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderDetail, OrderDetailService } from './order-detail.service';

type PrismaMock = {
  order: {
    findUnique: jest.Mock<Promise<OrderDetail | null>, [Prisma.OrderFindUniqueArgs]>;
  };
};

describe('OrderDetailService', () => {
  let service: OrderDetailService;
  const now = new Date('2026-01-01T10:00:00.000Z');
  const studentUser: AuthenticatedUser = {
    id: 'student-id',
    email: 'student@grabgo.test',
    role: Role.STUDENT
  };
  const merchantUser: AuthenticatedUser = {
    id: 'merchant-user-id',
    email: 'merchant@grabgo.test',
    role: Role.MERCHANT
  };
  const adminUser: AuthenticatedUser = {
    id: 'admin-user-id',
    email: 'admin@grabgo.test',
    role: Role.ADMIN
  };
  const prismaMock: PrismaMock = {
    order: {
      findUnique: jest.fn<Promise<OrderDetail | null>, [Prisma.OrderFindUniqueArgs]>()
    }
  };

  function createOrder(overrides: Partial<OrderDetail> = {}): OrderDetail {
    return {
      id: 'order-id',
      userId: studentUser.id,
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
        updatedAt: now,
        merchant: {
          id: 'merchant-id',
          userId: merchantUser.id,
          companyName: 'Snack Campus SARL',
          siret: null,
          createdAt: now,
          updatedAt: now
        }
      },
      withdrawalCode: null,
      user: {
        id: studentUser.id,
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: studentUser.email
      },
      ...overrides
    };
  }

  function getFindUniqueArgs(): Prisma.OrderFindUniqueArgs {
    const call = prismaMock.order.findUnique.mock.calls[0];

    if (!call) {
      throw new Error('Expected order.findUnique to be called');
    }

    return call[0];
  }

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderDetailService,
        {
          provide: PrismaService,
          useValue: prismaMock
        }
      ]
    }).compile();

    service = module.get<OrderDetailService>(OrderDetailService);
  });

  it('returns an order when the student owns it', async () => {
    const order = createOrder();
    prismaMock.order.findUnique.mockResolvedValue(order);

    await expect(service.findOrderByIdForUser(studentUser, order.id)).resolves.toEqual(order);
  });

  it('refuses a student who does not own the order', async () => {
    prismaMock.order.findUnique.mockResolvedValue(
      createOrder({
        userId: 'other-student-id'
      })
    );

    await expect(service.findOrderByIdForUser(studentUser, 'order-id')).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  it('returns an order when the merchant owns the snack', async () => {
    const order = createOrder();
    prismaMock.order.findUnique.mockResolvedValue(order);

    await expect(service.findOrderByIdForUser(merchantUser, order.id)).resolves.toEqual(order);
  });

  it('refuses a merchant who does not own the snack', async () => {
    const order = createOrder();
    prismaMock.order.findUnique.mockResolvedValue({
      ...order,
      snack: {
        ...order.snack,
        merchant: {
          ...order.snack.merchant,
          userId: 'other-merchant-user-id'
        }
      }
    });

    await expect(service.findOrderByIdForUser(merchantUser, order.id)).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  it('returns an order for an admin user', async () => {
    const order = createOrder();
    prismaMock.order.findUnique.mockResolvedValue(order);

    await expect(service.findOrderByIdForUser(adminUser, order.id)).resolves.toEqual(order);
  });

  it('refuses a missing order with NotFoundException', async () => {
    prismaMock.order.findUnique.mockResolvedValue(null);

    await expect(
      service.findOrderByIdForUser(studentUser, 'missing-order-id')
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns items, payment, slot, snack and withdrawalCode', async () => {
    const order = createOrder();
    prismaMock.order.findUnique.mockResolvedValue(order);

    await expect(service.findOrderByIdForUser(studentUser, order.id)).resolves.toMatchObject({
      items: order.items,
      payment: order.payment,
      slot: order.slot,
      snack: order.snack,
      withdrawalCode: order.withdrawalCode
    });
    expect(getFindUniqueArgs().include).toMatchObject({
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

  it('includes a minimal student user without passwordHash', async () => {
    const order = createOrder();
    prismaMock.order.findUnique.mockResolvedValue(order);

    const result = await service.findOrderByIdForUser(studentUser, order.id);

    expect(result.user).toEqual(order.user);
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(getFindUniqueArgs().include).toMatchObject({
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
});
