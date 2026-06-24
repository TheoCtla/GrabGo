import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  SlotStatus,
  SnackStatus,
  WithdrawalCode
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WithdrawalCodeOrderData, WithdrawalCodeService } from './withdrawal-code.service';
import { SimulatedPaidOrder, SimulatedPaymentService } from './simulated-payment.service';

type PayableOrder = Prisma.OrderGetPayload<{
  include: {
    payment: true;
    slot: true;
    withdrawalCode: true;
  };
}>;

type TransactionMock = {
  payment: {
    updateMany: jest.Mock<Promise<Prisma.BatchPayload>, [Prisma.PaymentUpdateManyArgs]>;
  };
  order: {
    updateMany: jest.Mock<Promise<Prisma.BatchPayload>, [Prisma.OrderUpdateManyArgs]>;
    findUnique: jest.Mock<Promise<SimulatedPaidOrder | null>, [Prisma.OrderFindUniqueArgs]>;
  };
};

type PrismaMock = {
  order: {
    findUnique: jest.Mock<Promise<PayableOrder | null>, [Prisma.OrderFindUniqueArgs]>;
  };
  $transaction: jest.Mock<
    Promise<SimulatedPaidOrder>,
    [(tx: TransactionMock) => Promise<SimulatedPaidOrder>]
  >;
};

type WithdrawalCodeServiceMock = {
  generateWithdrawalCodeForOrder: jest.Mock<
    Promise<WithdrawalCode>,
    [Prisma.TransactionClient, WithdrawalCodeOrderData]
  >;
};

describe('SimulatedPaymentService', () => {
  let service: SimulatedPaymentService;
  const now = new Date('2026-01-01T10:00:00.000Z');
  const studentId = 'student-id';
  const txMock: TransactionMock = {
    payment: {
      updateMany: jest.fn<Promise<Prisma.BatchPayload>, [Prisma.PaymentUpdateManyArgs]>()
    },
    order: {
      updateMany: jest.fn<Promise<Prisma.BatchPayload>, [Prisma.OrderUpdateManyArgs]>(),
      findUnique: jest.fn<Promise<SimulatedPaidOrder | null>, [Prisma.OrderFindUniqueArgs]>()
    }
  };
  const prismaMock: PrismaMock = {
    order: {
      findUnique: jest.fn<Promise<PayableOrder | null>, [Prisma.OrderFindUniqueArgs]>()
    },
    $transaction: jest.fn<
      Promise<SimulatedPaidOrder>,
      [(tx: TransactionMock) => Promise<SimulatedPaidOrder>]
    >()
  };
  const withdrawalCodeServiceMock: WithdrawalCodeServiceMock = {
    generateWithdrawalCodeForOrder: jest.fn<
      Promise<WithdrawalCode>,
      [Prisma.TransactionClient, WithdrawalCodeOrderData]
    >()
  };

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

  function createPayableOrder(overrides: Partial<PayableOrder> = {}): PayableOrder {
    return {
      id: 'order-id',
      userId: studentId,
      snackId: 'snack-id',
      slotId: 'slot-id',
      status: OrderStatus.PENDING_PAYMENT,
      productsTotalCents: 900,
      serviceFeeCents: 49,
      totalCents: 949,
      customerFirstName: 'Ada',
      specialNote: null,
      pickupConfirmedAt: null,
      lateReportedAt: null,
      createdAt: now,
      updatedAt: now,
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
      withdrawalCode: null,
      ...overrides
    };
  }

  function createPaidOrder(overrides: Partial<SimulatedPaidOrder> = {}): SimulatedPaidOrder {
    const withdrawalCode = createWithdrawalCode();

    return {
      ...createPayableOrder({
        status: OrderStatus.CONFIRMED
      }),
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
      withdrawalCode,
      ...overrides
    };
  }

  function arrangePayableOrder(): SimulatedPaidOrder {
    const withdrawalCode = createWithdrawalCode();
    const paidOrder = createPaidOrder({
      withdrawalCode
    });

    prismaMock.order.findUnique.mockResolvedValue(createPayableOrder());
    txMock.payment.updateMany.mockResolvedValue({ count: 1 });
    txMock.order.updateMany.mockResolvedValue({ count: 1 });
    withdrawalCodeServiceMock.generateWithdrawalCodeForOrder.mockResolvedValue(withdrawalCode);
    txMock.order.findUnique.mockResolvedValue(paidOrder);
    prismaMock.$transaction.mockImplementation((callback) => callback(txMock));

    return paidOrder;
  }

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(now);
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulatedPaymentService,
        {
          provide: PrismaService,
          useValue: prismaMock
        },
        {
          provide: WithdrawalCodeService,
          useValue: withdrawalCodeServiceMock
        }
      ]
    }).compile();

    service = module.get<SimulatedPaymentService>(SimulatedPaymentService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('pays a pending simulated order', async () => {
    const paidOrder = arrangePayableOrder();

    await expect(service.paySimulatedOrder(studentId, 'order-id')).resolves.toEqual(paidOrder);
  });

  it('delegates withdrawal code generation during simulated payment', async () => {
    arrangePayableOrder();

    await service.paySimulatedOrder(studentId, 'order-id');
    const call = withdrawalCodeServiceMock.generateWithdrawalCodeForOrder.mock.calls[0];

    if (!call) {
      throw new Error('Expected generateWithdrawalCodeForOrder to be called');
    }

    expect(call[0]).toBe(txMock);
    expect(call[1]).toMatchObject({
      id: 'order-id',
      snackId: 'snack-id',
      slot: {
        startAt: new Date('2026-01-01T12:00:00.000Z'),
        endAt: new Date('2026-01-01T12:15:00.000Z')
      }
    });
  });

  it('returns the paid order with its withdrawal code', async () => {
    const withdrawalCode = createWithdrawalCode();
    arrangePayableOrder();
    txMock.order.findUnique.mockResolvedValue(
      createPaidOrder({
        withdrawalCode
      })
    );

    await expect(service.paySimulatedOrder(studentId, 'order-id')).resolves.toMatchObject({
      withdrawalCode
    });
  });

  it('updates the payment status to PAID and sets paidAt', async () => {
    arrangePayableOrder();

    await service.paySimulatedOrder(studentId, 'order-id');

    expect(txMock.payment.updateMany).toHaveBeenCalledWith({
      where: {
        orderId: 'order-id',
        provider: 'simulated',
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
  });

  it('updates the order status to CONFIRMED after payment is paid', async () => {
    arrangePayableOrder();

    await service.paySimulatedOrder(studentId, 'order-id');

    expect(txMock.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'order-id',
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
  });

  it('refuses a missing order during simulated payment', async () => {
    arrangePayableOrder();
    prismaMock.order.findUnique.mockResolvedValue(null);

    await expect(service.paySimulatedOrder(studentId, 'missing-order')).rejects.toBeInstanceOf(
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

    await expect(service.paySimulatedOrder(studentId, 'order-id')).rejects.toBeInstanceOf(
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

    await expect(service.paySimulatedOrder(studentId, 'order-id')).rejects.toBeInstanceOf(
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

    await expect(service.paySimulatedOrder(studentId, 'order-id')).rejects.toBeInstanceOf(
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

    await expect(service.paySimulatedOrder(studentId, 'order-id')).rejects.toBeInstanceOf(
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

    await expect(service.paySimulatedOrder(studentId, 'order-id')).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('does not confirm the order if the payment cannot be marked paid', async () => {
    arrangePayableOrder();
    txMock.payment.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.paySimulatedOrder(studentId, 'order-id')).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(txMock.order.updateMany).not.toHaveBeenCalled();
  });

  it('refuses when the order cannot be confirmed', async () => {
    arrangePayableOrder();
    txMock.order.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.paySimulatedOrder(studentId, 'order-id')).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(withdrawalCodeServiceMock.generateWithdrawalCodeForOrder).not.toHaveBeenCalled();
  });

  it('refuses when the paid order cannot be reread', async () => {
    arrangePayableOrder();
    txMock.order.findUnique.mockResolvedValue(null);

    await expect(service.paySimulatedOrder(studentId, 'order-id')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });
});
