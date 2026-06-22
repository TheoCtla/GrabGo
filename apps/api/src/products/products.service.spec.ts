import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, Product, ProductType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';

type ProductDelegateMock = {
  findMany: jest.Mock<Promise<Product[]>, [Prisma.ProductFindManyArgs]>;
  findFirst: jest.Mock<Promise<Product | null>, [Prisma.ProductFindFirstArgs]>;
};

describe('ProductsService', () => {
  let service: ProductsService;
  const product: Product = {
    id: 'product-id',
    snackId: 'snack-id',
    name: 'Sandwich',
    description: 'Sandwich fromage',
    type: ProductType.SANDWICH,
    priceCents: 450,
    stock: 12,
    isAvailable: true,
    allergensVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z')
  };
  const prismaMock: { product: ProductDelegateMock } = {
    product: {
      findMany: jest.fn<Promise<Product[]>, [Prisma.ProductFindManyArgs]>(),
      findFirst: jest.fn<Promise<Product | null>, [Prisma.ProductFindFirstArgs]>()
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: prismaMock
        }
      ]
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  it('finds student-visible products by snack', async () => {
    prismaMock.product.findMany.mockResolvedValue([product]);

    await expect(service.findBySnack('snack-id')).resolves.toEqual([product]);
    const call = prismaMock.product.findMany.mock.calls[0];

    if (!call) {
      throw new Error('Expected product.findMany to be called');
    }

    expect(call[0].where).toMatchObject({
      snackId: 'snack-id',
      isAvailable: true
    });
    expect(call[0].include).toMatchObject({
      allergens: true,
      options: {
        where: { isAvailable: true }
      }
    });
  });

  it('excludes unavailable products from student lists', async () => {
    prismaMock.product.findMany.mockResolvedValue([product]);

    await service.findBySnack('snack-id');
    const call = prismaMock.product.findMany.mock.calls[0];

    if (!call) {
      throw new Error('Expected product.findMany to be called');
    }

    expect(call[0].where).toMatchObject({
      snackId: 'snack-id',
      isAvailable: true
    });
  });
});
