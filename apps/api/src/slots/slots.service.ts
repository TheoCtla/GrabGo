import { Injectable } from '@nestjs/common';
import { Prisma, Slot, SlotStatus, SnackStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AvailableSlotsQueryDto } from './dto/available-slots-query.dto';

type SlotWithSnack = Prisma.SlotGetPayload<{
  include: {
    snack: true;
  };
}>;

const RUSH_THRESHOLD = 0.8;
const RUSH_WINDOW_MS = 30 * 60 * 1000;

@Injectable()
export class SlotsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAvailableSlots(query: AvailableSlotsQueryDto): Promise<Slot[]> {
    const now = new Date();
    const where: Prisma.SlotWhereInput = {
      snackId: query.snackId,
      status: SlotStatus.AVAILABLE,
      snack: {
        status: SnackStatus.ONLINE,
        circuitBreaker: false
      }
    };

    if (query.from || query.to) {
      where.startAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {})
      };
    }

    const slots = await this.prisma.slot.findMany({
      where,
      include: {
        snack: true
      },
      orderBy: {
        startAt: 'asc'
      }
    });

    const availableSlots = slots.filter((slot) => this.isStudentAvailable(slot, now));
    const rushSlots = slots.filter((slot) => this.isRushSlot(slot));

    return availableSlots
      .filter((slot) => !this.isHiddenByRush(slot, rushSlots))
      .map(({ snack: _snack, ...slot }) => {
        void _snack;
        return slot;
      });
  }

  private isStudentAvailable(slot: SlotWithSnack, now: Date): boolean {
    return (
      slot.status === SlotStatus.AVAILABLE &&
      slot.capacity > 0 &&
      slot.reservedCount < slot.capacity &&
      slot.snack.status === SnackStatus.ONLINE &&
      !slot.snack.circuitBreaker &&
      (!slot.snack.snoozedUntil || slot.snack.snoozedUntil <= now)
    );
  }

  private isRushSlot(slot: SlotWithSnack): boolean {
    return slot.capacity > 0 && slot.reservedCount / slot.capacity >= RUSH_THRESHOLD;
  }

  private isHiddenByRush(slot: SlotWithSnack, rushSlots: SlotWithSnack[]): boolean {
    return rushSlots.some((rushSlot) => {
      const rushWindowEnd = new Date(rushSlot.startAt.getTime() + RUSH_WINDOW_MS);
      return slot.startAt > rushSlot.startAt && slot.startAt <= rushWindowEnd;
    });
  }
}
