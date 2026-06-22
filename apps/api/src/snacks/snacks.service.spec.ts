import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, Snack, SnackStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SnacksService } from './snacks.service';

type SnackDelegateMock = {
  findMany: jest.Mock<Promise<Snack[]>, [Prisma.SnackFindManyArgs]>;
  findFirst: jest.Mock<Promise<Snack | null>, [Prisma.SnackFindFirstArgs]>;
};

describe('SnacksService', () => {
  let service: SnacksService;
  const snack: Snack = {
    id: 'snack-id',
    merchantId: 'merchant-id',
    campusId: 'campus-id',
    name: 'Snack Campus',
    description: 'Sandwichs et boissons',
    status: SnackStatus.ONLINE,
    circuitBreaker: false,
    snoozedUntil: null,
    openingTime: '11:00',
    closingTime: '14:00',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z')
  };
  const prismaMock: { snack: SnackDelegateMock } = {
    snack: {
      findMany: jest.fn<Promise<Snack[]>, [Prisma.SnackFindManyArgs]>(),
      findFirst: jest.fn<Promise<Snack | null>, [Prisma.SnackFindFirstArgs]>()
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnacksService,
        {
          provide: PrismaService,
          useValue: prismaMock
        }
      ]
    }).compile();

    service = module.get<SnacksService>(SnacksService);
    jest.clearAllMocks();
  });

  it('finds student-visible snacks by campus', async () => {
    prismaMock.snack.findMany.mockResolvedValue([snack]);

    await expect(service.findByCampus('campus-id')).resolves.toEqual([snack]);
    const call = prismaMock.snack.findMany.mock.calls[0];

    if (!call) {
      throw new Error('Expected snack.findMany to be called');
    }

    expect(call[0].where).toMatchObject({
      campusId: 'campus-id',
      status: SnackStatus.ONLINE,
      circuitBreaker: false
    });
  });

  it('excludes offline or circuit-breaker snacks from student lists', async () => {
    prismaMock.snack.findMany.mockResolvedValue([snack]);

    await service.findByCampus();
    const call = prismaMock.snack.findMany.mock.calls[0];

    if (!call) {
      throw new Error('Expected snack.findMany to be called');
    }

    expect(call[0].where).toMatchObject({
      status: SnackStatus.ONLINE,
      circuitBreaker: false
    });
  });
});
