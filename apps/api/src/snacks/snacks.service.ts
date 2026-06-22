import { Injectable } from '@nestjs/common';
import { Prisma, Snack } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const studentSnackWhere = {
  status: 'ONLINE',
  circuitBreaker: false
} satisfies Prisma.SnackWhereInput;

const snackInclude = {
  campus: true,
  products: {
    where: {
      isAvailable: true
    },
    include: {
      allergens: true,
      options: {
        where: {
          isAvailable: true
        }
      }
    }
  }
} satisfies Prisma.SnackInclude;

@Injectable()
export class SnacksService {
  constructor(private readonly prisma: PrismaService) {}

  findByCampus(campusId?: string): Promise<Snack[]> {
    return this.prisma.snack.findMany({
      where: {
        ...studentSnackWhere,
        ...(campusId ? { campusId } : {})
      },
      include: snackInclude,
      orderBy: { name: 'asc' }
    });
  }

  findById(id: string): Promise<Snack | null> {
    return this.prisma.snack.findFirst({
      where: {
        id,
        ...studentSnackWhere
      },
      include: snackInclude
    });
  }
}
