import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Prisma, WithdrawalCode } from '@prisma/client';
import { randomInt, randomUUID } from 'crypto';
import { ACTIVE_WITHDRAWAL_ORDER_STATUSES } from '../constants/order-status.constants';

const WITHDRAWAL_CODE_ATTEMPTS = 20;
const WITHDRAWAL_EXPIRATION_DELAY_MS = 2 * 60 * 60 * 1000;

export type WithdrawalCodeOrderData = {
  id: string;
  snackId: string;
  slot: {
    startAt: Date;
    endAt: Date;
  };
};

@Injectable()
export class WithdrawalCodeService {
  async generateWithdrawalCodeForOrder(
    tx: Prisma.TransactionClient,
    order: WithdrawalCodeOrderData
  ): Promise<WithdrawalCode> {
    const existingWithdrawalCode = await tx.withdrawalCode.findUnique({
      where: {
        orderId: order.id
      }
    });

    if (existingWithdrawalCode) {
      return existingWithdrawalCode;
    }

    const serviceDay = this.getServiceDayBounds(order.slot.startAt);

    for (let attempt = 0; attempt < WITHDRAWAL_CODE_ATTEMPTS; attempt += 1) {
      const code = this.generateFourDigitWithdrawalCode();
      const activeCollision = await tx.withdrawalCode.findFirst({
        where: {
          code,
          order: {
            snackId: order.snackId,
            status: {
              in: ACTIVE_WITHDRAWAL_ORDER_STATUSES
            },
            slot: {
              startAt: {
                gte: serviceDay.start,
                lt: serviceDay.end
              }
            }
          }
        }
      });

      if (!activeCollision) {
        return tx.withdrawalCode.create({
          data: {
            orderId: order.id,
            code,
            qrToken: randomUUID(),
            expiresAt: this.getWithdrawalExpiresAt(order.slot.endAt)
          }
        });
      }
    }

    throw new InternalServerErrorException('Unable to generate a withdrawal code');
  }

  private generateFourDigitWithdrawalCode(): string {
    return randomInt(0, 10_000).toString().padStart(4, '0');
  }

  private getWithdrawalExpiresAt(slotEndAt: Date): Date {
    return new Date(slotEndAt.getTime() + WITHDRAWAL_EXPIRATION_DELAY_MS);
  }

  private getServiceDayBounds(date: Date): { start: Date; end: Date } {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return { start, end };
  }
}
