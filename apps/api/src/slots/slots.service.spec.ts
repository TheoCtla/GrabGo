import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, Slot, SlotStatus, Snack, SnackStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SlotsService } from './slots.service';

type SlotWithSnack = Slot & {
  snack: Snack;
};

type SlotDelegateMock = {
  findMany: jest.Mock<Promise<SlotWithSnack[]>, [Prisma.SlotFindManyArgs]>;
};

describe('SlotsService', () => {
  let service: SlotsService;
  const now = new Date('2026-01-01T10:00:00.000Z');
  const onlineSnack: Snack = {
    id: 'snack-id',
    merchantId: 'merchant-id',
    campusId: 'campus-id',
    name: 'Snack Campus',
    description: null,
    status: SnackStatus.ONLINE,
    circuitBreaker: false,
    snoozedUntil: null,
    openingTime: null,
    closingTime: null,
    createdAt: now,
    updatedAt: now
  };
  const prismaMock: { slot: SlotDelegateMock } = {
    slot: {
      findMany: jest.fn<Promise<SlotWithSnack[]>, [Prisma.SlotFindManyArgs]>()
    }
  };

  function createSlot(overrides: Partial<SlotWithSnack> = {}): SlotWithSnack {
    return {
      id: 'slot-id',
      snackId: onlineSnack.id,
      startAt: new Date('2026-01-01T12:00:00.000Z'),
      endAt: new Date('2026-01-01T12:15:00.000Z'),
      capacity: 10,
      reservedCount: 3,
      status: SlotStatus.AVAILABLE,
      createdAt: now,
      updatedAt: now,
      snack: onlineSnack,
      ...overrides
    };
  }

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(now);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlotsService,
        {
          provide: PrismaService,
          useValue: prismaMock
        }
      ]
    }).compile();

    service = module.get<SlotsService>(SlotsService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns available slots when capacity is not reached', async () => {
    const slot = createSlot();
    prismaMock.slot.findMany.mockResolvedValue([slot]);

    await expect(service.findAvailableSlots({ snackId: 'snack-id' })).resolves.toEqual([
      expect.objectContaining({
        id: slot.id,
        reservedCount: 3,
        capacity: 10
      })
    ]);
  });

  it('excludes full slots', async () => {
    prismaMock.slot.findMany.mockResolvedValue([
      createSlot({
        reservedCount: 10,
        capacity: 10
      })
    ]);

    await expect(service.findAvailableSlots({ snackId: 'snack-id' })).resolves.toEqual([]);
  });

  it('excludes slots with a status different from AVAILABLE', async () => {
    prismaMock.slot.findMany.mockResolvedValue([
      createSlot({
        status: SlotStatus.CLOSED
      })
    ]);

    await expect(service.findAvailableSlots({ snackId: 'snack-id' })).resolves.toEqual([]);
  });

  it('excludes slots if the snack is offline', async () => {
    prismaMock.slot.findMany.mockResolvedValue([
      createSlot({
        snack: {
          ...onlineSnack,
          status: SnackStatus.OFFLINE
        }
      })
    ]);

    await expect(service.findAvailableSlots({ snackId: 'snack-id' })).resolves.toEqual([]);
  });

  it('excludes slots if circuitBreaker is active', async () => {
    prismaMock.slot.findMany.mockResolvedValue([
      createSlot({
        snack: {
          ...onlineSnack,
          circuitBreaker: true
        }
      })
    ]);

    await expect(service.findAvailableSlots({ snackId: 'snack-id' })).resolves.toEqual([]);
  });

  it('excludes slots if snoozedUntil is in the future', async () => {
    prismaMock.slot.findMany.mockResolvedValue([
      createSlot({
        snack: {
          ...onlineSnack,
          snoozedUntil: new Date('2026-01-01T10:15:00.000Z')
        }
      })
    ]);

    await expect(service.findAvailableSlots({ snackId: 'snack-id' })).resolves.toEqual([]);
  });

  it('applies from and to filters', async () => {
    prismaMock.slot.findMany.mockResolvedValue([createSlot()]);

    await service.findAvailableSlots({
      snackId: 'snack-id',
      from: '2026-01-01T12:00:00.000Z',
      to: '2026-01-01T13:00:00.000Z'
    });
    const call = prismaMock.slot.findMany.mock.calls[0];

    if (!call) {
      throw new Error('Expected slot.findMany to be called');
    }

    expect(call[0].where).toMatchObject({
      snackId: 'snack-id',
      startAt: {
        gte: new Date('2026-01-01T12:00:00.000Z'),
        lte: new Date('2026-01-01T13:00:00.000Z')
      }
    });
  });

  it('applies the rush rule for the next 30 minutes', async () => {
    const rushSlot = createSlot({
      id: 'rush-slot',
      startAt: new Date('2026-01-01T12:00:00.000Z'),
      reservedCount: 8,
      capacity: 10
    });
    const hiddenSlot = createSlot({
      id: 'hidden-slot',
      startAt: new Date('2026-01-01T12:15:00.000Z')
    });
    const visibleSlot = createSlot({
      id: 'visible-slot',
      startAt: new Date('2026-01-01T12:45:00.000Z')
    });
    prismaMock.slot.findMany.mockResolvedValue([rushSlot, hiddenSlot, visibleSlot]);

    await expect(service.findAvailableSlots({ snackId: 'snack-id' })).resolves.toEqual([
      expect.objectContaining({ id: 'rush-slot' }),
      expect.objectContaining({ id: 'visible-slot' })
    ]);
  });

  it('does not consider capacity 0 slots as available', async () => {
    prismaMock.slot.findMany.mockResolvedValue([
      createSlot({
        capacity: 0,
        reservedCount: 0
      })
    ]);

    await expect(service.findAvailableSlots({ snackId: 'snack-id' })).resolves.toEqual([]);
  });
});
