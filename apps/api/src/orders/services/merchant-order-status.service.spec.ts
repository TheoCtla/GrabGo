import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, PaymentStatus, Prisma, SlotStatus, SnackStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MerchantOrderStatusService, MerchantUpdatedOrder } from './merchant-order-status.service';

type MerchantOrder = Prisma.OrderGetPayload<{
  include: {
    snack: {
      include: {
        merchant: true;
      };
    };
  };
}>;

type PrismaMock = {
  order: {
    findUnique: jest.Mock<
      Promise<MerchantOrder | MerchantUpdatedOrder | null>,
      [Prisma.OrderFindUniqueArgs]
    >;
    updateMany: jest.Mock<Promise<Prisma.BatchPayload>, [Prisma.OrderUpdateManyArgs]>;
  };
};

describe('MerchantOrderStatusService', () => {
  let service: MerchantOrderStatusService;
  const now = new Date('2026-01-01T10:00:00.000Z');
  const merchantId = 'merchant-user-id';
  const prismaMock: PrismaMock = {
    order: {
      findUnique: jest.fn<
        Promise<MerchantOrder | MerchantUpdatedOrder | null>,
        [Prisma.OrderFindUniqueArgs]
      >(),
      updateMany: jest.fn<Promise<Prisma.BatchPayload>, [Prisma.OrderUpdateManyArgs]>()
    }
  };

  function createUpdatedOrder(overrides: Partial<MerchantUpdatedOrder> = {}): MerchantUpdatedOrder {
    return {
      id: 'order-id',
      userId: 'student-id',
      snackId: 'snack-id',
      slotId: 'slot-id',
      status: OrderStatus.PREPARING,
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

  function createMerchantOrder(overrides: Partial<MerchantOrder> = {}): MerchantOrder {
    const order = createUpdatedOrder();
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

  function arrangeMerchantOrderStatus(
    currentStatus: OrderStatus,
    nextStatus: OrderStatus
  ): MerchantUpdatedOrder {
    const updatedOrder = createUpdatedOrder({
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
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MerchantOrderStatusService,
        {
          provide: PrismaService,
          useValue: prismaMock
        }
      ]
    }).compile();

    service = module.get<MerchantOrderStatusService>(MerchantOrderStatusService);
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

  it('refuses when the updated order cannot be reread', async () => {
    prismaMock.order.findUnique
      .mockResolvedValueOnce(
        createMerchantOrder({
          status: OrderStatus.PREPARING
        })
      )
      .mockResolvedValueOnce(null);
    prismaMock.order.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      service.updateMerchantOrderStatus(merchantId, 'order-id', OrderStatus.READY)
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
