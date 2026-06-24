import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, PaymentStatus, Prisma, SlotStatus, SnackStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  WithdrawalValidatedOrder,
  WithdrawalValidationService
} from './withdrawal-validation.service';

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

type TransactionMock = {
  withdrawalCode: {
    findUnique: jest.Mock<
      Promise<ValidatableWithdrawalCode | null>,
      [Prisma.WithdrawalCodeFindUniqueArgs]
    >;
    findFirst: jest.Mock<
      Promise<ValidatableWithdrawalCode | null>,
      [Prisma.WithdrawalCodeFindFirstArgs]
    >;
    updateMany: jest.Mock<Promise<Prisma.BatchPayload>, [Prisma.WithdrawalCodeUpdateManyArgs]>;
  };
  order: {
    updateMany: jest.Mock<Promise<Prisma.BatchPayload>, [Prisma.OrderUpdateManyArgs]>;
    findUnique: jest.Mock<Promise<WithdrawalValidatedOrder | null>, [Prisma.OrderFindUniqueArgs]>;
  };
};

type PrismaMock = {
  $transaction: jest.Mock<
    Promise<WithdrawalValidatedOrder>,
    [(tx: TransactionMock) => Promise<WithdrawalValidatedOrder>]
  >;
};

describe('WithdrawalValidationService', () => {
  let service: WithdrawalValidationService;
  const now = new Date('2026-01-01T10:00:00.000Z');
  const merchantId = 'merchant-user-id';
  const txMock: TransactionMock = {
    withdrawalCode: {
      findUnique: jest.fn<
        Promise<ValidatableWithdrawalCode | null>,
        [Prisma.WithdrawalCodeFindUniqueArgs]
      >(),
      findFirst: jest.fn<
        Promise<ValidatableWithdrawalCode | null>,
        [Prisma.WithdrawalCodeFindFirstArgs]
      >(),
      updateMany: jest.fn<Promise<Prisma.BatchPayload>, [Prisma.WithdrawalCodeUpdateManyArgs]>()
    },
    order: {
      updateMany: jest.fn<Promise<Prisma.BatchPayload>, [Prisma.OrderUpdateManyArgs]>(),
      findUnique: jest.fn<Promise<WithdrawalValidatedOrder | null>, [Prisma.OrderFindUniqueArgs]>()
    }
  };
  const prismaMock: PrismaMock = {
    $transaction: jest.fn<
      Promise<WithdrawalValidatedOrder>,
      [(tx: TransactionMock) => Promise<WithdrawalValidatedOrder>]
    >()
  };

  function createCompletedOrder(
    overrides: Partial<WithdrawalValidatedOrder> = {}
  ): WithdrawalValidatedOrder {
    return {
      id: 'order-id',
      userId: 'student-id',
      snackId: 'snack-id',
      slotId: 'slot-id',
      status: OrderStatus.COMPLETED,
      productsTotalCents: 900,
      serviceFeeCents: 49,
      totalCents: 949,
      customerFirstName: 'Ada',
      specialNote: null,
      pickupConfirmedAt: now,
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
      withdrawalCode: {
        id: 'withdrawal-code-id',
        orderId: 'order-id',
        code: '1234',
        qrToken: 'qr-token',
        usedAt: now,
        expiresAt: new Date('2026-01-01T14:15:00.000Z'),
        createdAt: now,
        updatedAt: now
      },
      ...overrides
    };
  }

  function createValidatableWithdrawalCode(
    overrides: Partial<ValidatableWithdrawalCode> = {}
  ): ValidatableWithdrawalCode {
    return {
      id: 'withdrawal-code-id',
      orderId: 'order-id',
      code: '1234',
      qrToken: 'qr-token',
      usedAt: null,
      expiresAt: new Date('2026-01-01T14:15:00.000Z'),
      createdAt: now,
      updatedAt: now,
      order: {
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

  function arrangeValidWithdrawal(): WithdrawalValidatedOrder {
    const completedOrder = createCompletedOrder();

    txMock.withdrawalCode.findUnique.mockResolvedValue(createValidatableWithdrawalCode());
    txMock.withdrawalCode.findFirst.mockResolvedValue(createValidatableWithdrawalCode());
    txMock.withdrawalCode.updateMany.mockResolvedValue({ count: 1 });
    txMock.order.updateMany.mockResolvedValue({ count: 1 });
    txMock.order.findUnique.mockResolvedValue(completedOrder);
    prismaMock.$transaction.mockImplementation((callback) => callback(txMock));

    return completedOrder;
  }

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(now);
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WithdrawalValidationService,
        {
          provide: PrismaService,
          useValue: prismaMock
        }
      ]
    }).compile();

    service = module.get<WithdrawalValidationService>(WithdrawalValidationService);
  });

  afterEach(() => {
    jest.useRealTimers();
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

  it('refuses when the order can no longer be completed', async () => {
    arrangeValidWithdrawal();
    txMock.order.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.validateWithdrawal(merchantId, { qrToken: 'qr-token' })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(txMock.order.findUnique).not.toHaveBeenCalled();
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

  it('refuses when the completed order cannot be reread', async () => {
    arrangeValidWithdrawal();
    txMock.order.findUnique.mockResolvedValue(null);

    await expect(
      service.validateWithdrawal(merchantId, { qrToken: 'qr-token' })
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
