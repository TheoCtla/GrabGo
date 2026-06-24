import { InternalServerErrorException } from '@nestjs/common';
import { OrderStatus, Prisma, WithdrawalCode } from '@prisma/client';
import { WithdrawalCodeOrderData, WithdrawalCodeService } from './withdrawal-code.service';

type TransactionMock = {
  withdrawalCode: {
    findUnique: jest.Mock<Promise<WithdrawalCode | null>, [Prisma.WithdrawalCodeFindUniqueArgs]>;
    findFirst: jest.Mock<Promise<WithdrawalCode | null>, [Prisma.WithdrawalCodeFindFirstArgs]>;
    create: jest.Mock<Promise<WithdrawalCode>, [Prisma.WithdrawalCodeCreateArgs]>;
  };
};

describe('WithdrawalCodeService', () => {
  let service: WithdrawalCodeService;
  const now = new Date('2026-01-01T10:00:00.000Z');
  const order: WithdrawalCodeOrderData = {
    id: 'order-id',
    snackId: 'snack-id',
    slot: {
      startAt: new Date('2026-01-01T12:00:00.000Z'),
      endAt: new Date('2026-01-01T12:15:00.000Z')
    }
  };
  const txMock: TransactionMock = {
    withdrawalCode: {
      findUnique: jest.fn<Promise<WithdrawalCode | null>, [Prisma.WithdrawalCodeFindUniqueArgs]>(),
      findFirst: jest.fn<Promise<WithdrawalCode | null>, [Prisma.WithdrawalCodeFindFirstArgs]>(),
      create: jest.fn<Promise<WithdrawalCode>, [Prisma.WithdrawalCodeCreateArgs]>()
    }
  };

  function createWithdrawalCode(overrides: Partial<WithdrawalCode> = {}): WithdrawalCode {
    return {
      id: 'withdrawal-code-id',
      orderId: order.id,
      code: '1234',
      qrToken: 'qr-token',
      usedAt: null,
      expiresAt: new Date('2026-01-01T14:15:00.000Z'),
      createdAt: now,
      updatedAt: now,
      ...overrides
    };
  }

  function arrangeWithdrawalCodeCreation(): WithdrawalCode {
    const withdrawalCode = createWithdrawalCode();

    txMock.withdrawalCode.findUnique.mockResolvedValue(null);
    txMock.withdrawalCode.findFirst.mockResolvedValue(null);
    txMock.withdrawalCode.create.mockResolvedValue(withdrawalCode);

    return withdrawalCode;
  }

  beforeEach(() => {
    jest.resetAllMocks();
    service = new WithdrawalCodeService();
  });

  it('creates a withdrawal code for an order', async () => {
    const withdrawalCode = arrangeWithdrawalCodeCreation();

    await expect(
      service.generateWithdrawalCodeForOrder(txMock as unknown as Prisma.TransactionClient, order)
    ).resolves.toEqual(withdrawalCode);
    const call = txMock.withdrawalCode.create.mock.calls[0];

    if (!call) {
      throw new Error('Expected withdrawalCode.create to be called');
    }

    expect(call[0].data.orderId).toBe(order.id);
  });

  it('generates an exactly 4 digit withdrawal code', async () => {
    arrangeWithdrawalCodeCreation();

    await service.generateWithdrawalCodeForOrder(
      txMock as unknown as Prisma.TransactionClient,
      order
    );
    const call = txMock.withdrawalCode.create.mock.calls[0];

    if (!call) {
      throw new Error('Expected withdrawalCode.create to be called');
    }

    expect(call[0].data.code).toMatch(/^\d{4}$/);
  });

  it('generates a qrToken without using Math.random', async () => {
    const mathRandomSpy = jest.spyOn(Math, 'random');
    arrangeWithdrawalCodeCreation();

    await service.generateWithdrawalCodeForOrder(
      txMock as unknown as Prisma.TransactionClient,
      order
    );
    const call = txMock.withdrawalCode.create.mock.calls[0];

    if (!call) {
      mathRandomSpy.mockRestore();
      throw new Error('Expected withdrawalCode.create to be called');
    }

    expect(call[0].data.qrToken).toEqual(expect.any(String));
    expect(mathRandomSpy).not.toHaveBeenCalled();
    mathRandomSpy.mockRestore();
  });

  it('does not create a second withdrawal code if one already exists', async () => {
    const existingWithdrawalCode = createWithdrawalCode({
      id: 'existing-withdrawal-code-id'
    });
    txMock.withdrawalCode.findUnique.mockResolvedValue(existingWithdrawalCode);

    await expect(
      service.generateWithdrawalCodeForOrder(txMock as unknown as Prisma.TransactionClient, order)
    ).resolves.toEqual(existingWithdrawalCode);
    expect(txMock.withdrawalCode.create).not.toHaveBeenCalled();
  });

  it('retries when an active withdrawal code collision exists for the same snack and service day', async () => {
    arrangeWithdrawalCodeCreation();
    txMock.withdrawalCode.findFirst
      .mockResolvedValueOnce(createWithdrawalCode({ id: 'collision-id' }))
      .mockResolvedValueOnce(null);

    await service.generateWithdrawalCodeForOrder(
      txMock as unknown as Prisma.TransactionClient,
      order
    );
    const call = txMock.withdrawalCode.findFirst.mock.calls[0];
    const serviceDayStart = new Date(order.slot.startAt);
    serviceDayStart.setHours(0, 0, 0, 0);
    const serviceDayEnd = new Date(serviceDayStart);
    serviceDayEnd.setDate(serviceDayEnd.getDate() + 1);

    if (!call) {
      throw new Error('Expected withdrawalCode.findFirst to be called');
    }

    expect(txMock.withdrawalCode.findFirst).toHaveBeenCalledTimes(2);
    expect(call[0].where).toMatchObject({
      order: {
        snackId: order.snackId,
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

  it('fails cleanly after too many active withdrawal code collisions', async () => {
    arrangeWithdrawalCodeCreation();
    txMock.withdrawalCode.findFirst.mockResolvedValue(createWithdrawalCode({ id: 'collision-id' }));

    await expect(
      service.generateWithdrawalCodeForOrder(txMock as unknown as Prisma.TransactionClient, order)
    ).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(txMock.withdrawalCode.findFirst).toHaveBeenCalledTimes(20);
    expect(txMock.withdrawalCode.create).not.toHaveBeenCalled();
  });

  it('sets expiresAt to slot endAt plus 2 hours', async () => {
    arrangeWithdrawalCodeCreation();

    await service.generateWithdrawalCodeForOrder(
      txMock as unknown as Prisma.TransactionClient,
      order
    );
    const call = txMock.withdrawalCode.create.mock.calls[0];

    if (!call) {
      throw new Error('Expected withdrawalCode.create to be called');
    }

    expect(call[0].data.expiresAt).toEqual(new Date('2026-01-01T14:15:00.000Z'));
  });
});
