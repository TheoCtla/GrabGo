import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ValidateWithdrawalDto } from '../dto/validate-withdrawal.dto';

const ACTIVE_WITHDRAWAL_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.WAITING_PULL_CONFIRMATION,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.LATE
];

export type WithdrawalValidatedOrder = Prisma.OrderGetPayload<{
  include: {
    items: true;
    payment: true;
    slot: true;
    snack: true;
    withdrawalCode: true;
  };
}>;

type WithdrawalCodeForValidation = Prisma.WithdrawalCodeGetPayload<{
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

@Injectable()
export class WithdrawalValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async validateWithdrawal(
    merchantId: string,
    dto: ValidateWithdrawalDto
  ): Promise<WithdrawalValidatedOrder> {
    const now = new Date();

    this.ensureWithdrawalLookupIsValid(dto);

    return this.prisma.$transaction(async (tx) => {
      const withdrawalCode = await this.findWithdrawalCodeForValidation(tx, dto, now);

      if (!withdrawalCode) {
        throw new NotFoundException('Withdrawal code not found');
      }

      this.ensureWithdrawalCanBeValidated(withdrawalCode, merchantId, now);

      const withdrawalUpdate = await tx.withdrawalCode.updateMany({
        where: {
          id: withdrawalCode.id,
          usedAt: null
        },
        data: {
          usedAt: now
        }
      });

      if (withdrawalUpdate.count !== 1) {
        throw new BadRequestException('Withdrawal code already used');
      }

      const orderUpdate = await tx.order.updateMany({
        where: {
          id: withdrawalCode.orderId,
          status: {
            in: ACTIVE_WITHDRAWAL_ORDER_STATUSES
          }
        },
        data: {
          status: OrderStatus.COMPLETED,
          pickupConfirmedAt: now
        }
      });

      if (orderUpdate.count !== 1) {
        throw new BadRequestException('Order is not validable');
      }

      const updatedOrder = await tx.order.findUnique({
        where: {
          id: withdrawalCode.orderId
        },
        include: {
          items: true,
          payment: true,
          slot: true,
          snack: true,
          withdrawalCode: true
        }
      });

      if (!updatedOrder) {
        throw new NotFoundException('Order not found');
      }

      return updatedOrder;
    });
  }

  private ensureWithdrawalLookupIsValid(dto: ValidateWithdrawalDto): void {
    if (!dto.qrToken && !dto.code) {
      throw new BadRequestException('qrToken or code is required');
    }

    if (!dto.qrToken && dto.code && !dto.snackId) {
      throw new BadRequestException('snackId is required when validating with code');
    }
  }

  private async findWithdrawalCodeForValidation(
    tx: Prisma.TransactionClient,
    dto: ValidateWithdrawalDto,
    now: Date
  ): Promise<WithdrawalCodeForValidation | null> {
    const include = {
      order: {
        include: {
          slot: true,
          snack: {
            include: {
              merchant: true
            }
          }
        }
      }
    } satisfies Prisma.WithdrawalCodeInclude;

    if (dto.qrToken) {
      return tx.withdrawalCode.findUnique({
        where: {
          qrToken: dto.qrToken
        },
        include
      });
    }

    const serviceDay = this.getServiceDayBounds(now);

    return tx.withdrawalCode.findFirst({
      where: {
        code: dto.code,
        usedAt: null,
        expiresAt: {
          gt: now
        },
        order: {
          snackId: dto.snackId,
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
      },
      include
    });
  }

  private ensureWithdrawalCanBeValidated(
    withdrawalCode: WithdrawalCodeForValidation,
    merchantId: string,
    now: Date
  ): void {
    if (withdrawalCode.usedAt) {
      throw new BadRequestException('Withdrawal code already used');
    }

    if (withdrawalCode.expiresAt && withdrawalCode.expiresAt <= now) {
      throw new BadRequestException('Withdrawal code expired');
    }

    if (withdrawalCode.order.snack.merchant.userId !== merchantId) {
      throw new ForbiddenException('Snack does not belong to the current merchant');
    }

    if (!ACTIVE_WITHDRAWAL_ORDER_STATUSES.includes(withdrawalCode.order.status)) {
      throw new BadRequestException('Order is not validable');
    }
  }

  private getServiceDayBounds(date: Date): { start: Date; end: Date } {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return { start, end };
  }
}
