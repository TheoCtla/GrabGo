import { Test, TestingModule } from '@nestjs/testing';
import { Campus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CampusesService } from './campuses.service';

type CampusDelegateMock = {
  findMany: jest.Mock<Promise<Campus[]>, [unknown]>;
  findUnique: jest.Mock<Promise<Campus | null>, [unknown]>;
};

describe('CampusesService', () => {
  let service: CampusesService;
  const campus: Campus = {
    id: 'campus-id',
    name: 'Campus Centre',
    city: 'Paris',
    address: '1 rue du Campus',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z')
  };
  const prismaMock: { campus: CampusDelegateMock } = {
    campus: {
      findMany: jest.fn<Promise<Campus[]>, [unknown]>(),
      findUnique: jest.fn<Promise<Campus | null>, [unknown]>()
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampusesService,
        {
          provide: PrismaService,
          useValue: prismaMock
        }
      ]
    }).compile();

    service = module.get<CampusesService>(CampusesService);
    jest.clearAllMocks();
  });

  it('finds all campuses ordered by city and name', async () => {
    prismaMock.campus.findMany.mockResolvedValue([campus]);

    await expect(service.findAll()).resolves.toEqual([campus]);
    expect(prismaMock.campus.findMany).toHaveBeenCalledWith({
      orderBy: [{ city: 'asc' }, { name: 'asc' }]
    });
  });
});
