import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StudentOrdersQueryDto } from '../dto/student-orders-query.dto';

export type StudentOrderListItem = Prisma.OrderGetPayload<{
  include: {
    items: true;
    payment: true;
    slot: true;
    snack: true;
    withdrawalCode: true;
  };
}>;

@Injectable()
export class StudentOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findStudentOrders(
    studentId: string,
    query: StudentOrdersQueryDto
  ): Promise<StudentOrderListItem[]> {
    const createdAtFilter = this.buildCreatedAtFilter(query);

    return this.prisma.order.findMany({
      where: {
        userId: studentId,
        status: query.status,
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {})
      },
      include: {
        items: true,
        payment: true,
        slot: true,
        snack: true,
        withdrawalCode: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  private buildCreatedAtFilter(query: StudentOrdersQueryDto): Prisma.DateTimeFilter | undefined {
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
