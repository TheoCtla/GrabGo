import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MerchantOrdersQueryDto } from '../dto/merchant-orders-query.dto';

const DEFAULT_MERCHANT_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.WAITING_PULL_CONFIRMATION,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.LATE
];

export type MerchantOrderListItem = Prisma.OrderGetPayload<{
  include: {
    items: true;
    payment: true;
    slot: true;
    snack: true;
    withdrawalCode: true;
    user: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        email: true;
      };
    };
  };
}>;

@Injectable()
export class MerchantOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findMerchantOrders(
    merchantUserId: string,
    query: MerchantOrdersQueryDto
  ): Promise<MerchantOrderListItem[]> {
    const slotStartAtFilter = this.buildSlotStartAtFilter(query);

    return this.prisma.order.findMany({
      where: {
        snack: {
          id: query.snackId,
          merchant: {
            is: {
              userId: merchantUserId
            }
          }
        },
        status: this.buildStatusFilter(query),
        ...(slotStartAtFilter
          ? {
              slot: {
                startAt: slotStartAtFilter
              }
            }
          : {})
      },
      include: {
        items: true,
        payment: true,
        slot: true,
        snack: true,
        withdrawalCode: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: [
        {
          slot: {
            startAt: 'asc'
          }
        },
        {
          createdAt: 'asc'
        }
      ]
    });
  }

  private buildStatusFilter(query: MerchantOrdersQueryDto): Prisma.EnumOrderStatusFilter {
    if (query.status) {
      return {
        equals: query.status
      };
    }

    return {
      in: DEFAULT_MERCHANT_ORDER_STATUSES
    };
  }

  private buildSlotStartAtFilter(query: MerchantOrdersQueryDto): Prisma.DateTimeFilter | undefined {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;

    if (from && to && from >= to) {
      throw new BadRequestException('from must be before to');
    }

    if (!from && !to) {
      return undefined;
    }

    return {
      ...(from ? { gte: from } : {}),
      ...(to ? { lt: to } : {})
    };
  }
}
