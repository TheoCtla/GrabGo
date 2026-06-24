import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MerchantOrdersQueryDto } from '../dto/merchant-orders-query.dto';

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
    merchantId: string,
    query: MerchantOrdersQueryDto
  ): Promise<MerchantOrderListItem[]> {
    return this.prisma.order.findMany({
      where: {
        snack: {
          id: query.snackId,
          merchant: {
            userId: merchantId
          }
        },
        status: query.status,
        slot: {
          startAt: this.buildSlotStartAtFilter(query)
        }
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

  private buildSlotStartAtFilter(query: MerchantOrdersQueryDto): Prisma.DateTimeFilter {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;

    if (from && to && from >= to) {
      throw new BadRequestException('from must be before to');
    }

    if (!from && !to) {
      const serviceDay = this.getServiceDayBounds(new Date());

      return {
        gte: serviceDay.start,
        lt: serviceDay.end
      };
    }

    return {
      ...(from ? { gte: from } : {}),
      ...(to ? { lt: to } : {})
    };
  }

  private getServiceDayBounds(date: Date): { start: Date; end: Date } {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return { start, end };
  }
}
