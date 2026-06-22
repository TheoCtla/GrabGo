import { Injectable } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const studentProductWhere = {
  isAvailable: true
} satisfies Prisma.ProductWhereInput;

const productInclude = {
  allergens: true,
  options: {
    where: {
      isAvailable: true
    }
  }
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findBySnack(snackId: string): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        ...studentProductWhere,
        snackId
      },
      include: productInclude,
      orderBy: { name: 'asc' }
    });
  }

  findById(id: string): Promise<Product | null> {
    return this.prisma.product.findFirst({
      where: {
        id,
        ...studentProductWhere
      },
      include: productInclude
    });
  }
}
