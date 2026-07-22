import { describe, expect, it } from 'vitest';
import { MerchantOrder } from '../types';
import { getMerchantDashboardSummary } from './order-summary';

function createMerchantOrder(overrides: Partial<MerchantOrder> = {}): MerchantOrder {
  return {
    id: 'order-id',
    userId: 'student-id',
    snackId: 'snack-id',
    slotId: 'slot-id',
    customerFirstName: 'Ada',
    status: 'CONFIRMED',
    productsTotalCents: 900,
    serviceFeeCents: 49,
    totalCents: 949,
    specialNote: null,
    pickupConfirmedAt: null,
    lateReportedAt: null,
    createdAt: '2026-07-22T08:00:00.000Z',
    updatedAt: '2026-07-22T08:00:00.000Z',
    items: [],
    payment: null,
    slot: {
      id: 'slot-id',
      snackId: 'snack-id',
      startAt: '2026-07-22T12:00:00.000Z',
      endAt: '2026-07-22T12:15:00.000Z',
      capacity: 8,
      reservedCount: 1,
      status: 'AVAILABLE',
      createdAt: '2026-07-22T08:00:00.000Z',
      updatedAt: '2026-07-22T08:00:00.000Z'
    },
    snack: {
      id: 'snack-id',
      merchantId: 'merchant-id',
      campusId: 'campus-id',
      name: 'Snack Campus',
      description: null,
      status: 'ONLINE',
      circuitBreaker: false,
      snoozedUntil: null,
      openingTime: null,
      closingTime: null,
      createdAt: '2026-07-22T08:00:00.000Z',
      updatedAt: '2026-07-22T08:00:00.000Z'
    },
    withdrawalCode: null,
    user: {
      id: 'student-id',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@grabgo.test'
    },
    ...overrides
  };
}

describe('merchant dashboard summary', () => {
  const now = new Date('2026-07-22T10:00:00.000Z');

  it('counts today orders using the pickup slot date', () => {
    const summary = getMerchantDashboardSummary(
      [
        createMerchantOrder({ id: 'today-order' }),
        createMerchantOrder({
          id: 'yesterday-order',
          slot: {
            ...createMerchantOrder().slot,
            startAt: '2026-07-21T12:00:00.000Z',
            endAt: '2026-07-21T12:15:00.000Z'
          }
        })
      ],
      'TODAY',
      now
    );

    expect(summary.ordersCount).toBe(1);
  });

  it('counts orders from the last 7 days', () => {
    const summary = getMerchantDashboardSummary(
      [
        createMerchantOrder({ id: 'today-order' }),
        createMerchantOrder({
          id: 'six-days-ago-order',
          slot: {
            ...createMerchantOrder().slot,
            startAt: '2026-07-16T12:00:00.000Z',
            endAt: '2026-07-16T12:15:00.000Z'
          }
        }),
        createMerchantOrder({
          id: 'seven-days-ago-order',
          slot: {
            ...createMerchantOrder().slot,
            startAt: '2026-07-15T12:00:00.000Z',
            endAt: '2026-07-15T12:15:00.000Z'
          }
        })
      ],
      'LAST_7_DAYS',
      now
    );

    expect(summary.ordersCount).toBe(2);
  });

  it('counts orders from the last 30 days', () => {
    const summary = getMerchantDashboardSummary(
      [
        createMerchantOrder({ id: 'today-order' }),
        createMerchantOrder({
          id: 'twenty-nine-days-ago-order',
          slot: {
            ...createMerchantOrder().slot,
            startAt: '2026-06-23T12:00:00.000Z',
            endAt: '2026-06-23T12:15:00.000Z'
          }
        }),
        createMerchantOrder({
          id: 'thirty-days-ago-order',
          slot: {
            ...createMerchantOrder().slot,
            startAt: '2026-06-22T12:00:00.000Z',
            endAt: '2026-06-22T12:15:00.000Z'
          }
        })
      ],
      'LAST_30_DAYS',
      now
    );

    expect(summary.ordersCount).toBe(2);
  });

  it('counts orders to prepare', () => {
    const summary = getMerchantDashboardSummary(
      [
        createMerchantOrder({ status: 'CONFIRMED' }),
        createMerchantOrder({ id: 'waiting', status: 'WAITING_PULL_CONFIRMATION' }),
        createMerchantOrder({ id: 'preparing', status: 'PREPARING' }),
        createMerchantOrder({ id: 'ready', status: 'READY' })
      ],
      'TODAY',
      now
    );

    expect(summary.ordersToPrepareCount).toBe(3);
  });

  it('counts ready and completed orders', () => {
    const summary = getMerchantDashboardSummary(
      [
        createMerchantOrder({ status: 'READY' }),
        createMerchantOrder({ id: 'completed', status: 'COMPLETED' }),
        createMerchantOrder({ id: 'confirmed', status: 'CONFIRMED' })
      ],
      'TODAY',
      now
    );

    expect(summary.readyOrdersCount).toBe(1);
    expect(summary.completedOrdersCount).toBe(1);
  });

  it('sums today revenue in cents', () => {
    const summary = getMerchantDashboardSummary(
      [
        createMerchantOrder({ id: 'first', totalCents: 1_200 }),
        createMerchantOrder({ id: 'second', totalCents: 2_090 }),
        createMerchantOrder({
          id: 'tomorrow',
          totalCents: 9_999,
          slot: {
            ...createMerchantOrder().slot,
            startAt: '2026-07-23T12:00:00.000Z',
            endAt: '2026-07-23T12:15:00.000Z'
          }
        })
      ],
      'TODAY',
      now
    );

    expect(summary.revenueCents).toBe(3_290);
  });

  it('finds the nearest upcoming non-terminal slot', () => {
    const summary = getMerchantDashboardSummary(
      [
        createMerchantOrder({
          id: 'later',
          slot: {
            ...createMerchantOrder().slot,
            startAt: '2026-07-22T14:00:00.000Z',
            endAt: '2026-07-22T14:15:00.000Z'
          }
        }),
        createMerchantOrder({
          id: 'nearest',
          status: 'READY',
          slot: {
            ...createMerchantOrder().slot,
            startAt: '2026-07-22T11:00:00.000Z',
            endAt: '2026-07-22T11:15:00.000Z'
          }
        }),
        createMerchantOrder({
          id: 'completed',
          status: 'COMPLETED',
          slot: {
            ...createMerchantOrder().slot,
            startAt: '2026-07-22T10:30:00.000Z',
            endAt: '2026-07-22T10:45:00.000Z'
          }
        })
      ],
      'TODAY',
      now
    );

    expect(summary.nextSlot).toEqual({
      startAt: '2026-07-22T11:00:00.000Z',
      endAt: '2026-07-22T11:15:00.000Z'
    });
  });

  it('ignores orders outside the selected period for every metric', () => {
    const summary = getMerchantDashboardSummary(
      [
        createMerchantOrder({ id: 'today-ready', status: 'READY', totalCents: 1_000 }),
        createMerchantOrder({
          id: 'old-completed',
          status: 'COMPLETED',
          totalCents: 5_000,
          slot: {
            ...createMerchantOrder().slot,
            startAt: '2026-07-21T12:00:00.000Z',
            endAt: '2026-07-21T12:15:00.000Z'
          }
        })
      ],
      'TODAY',
      now
    );

    expect(summary).toMatchObject({
      ordersCount: 1,
      readyOrdersCount: 1,
      completedOrdersCount: 0,
      revenueCents: 1_000
    });
  });

  it('returns zero values for an empty list', () => {
    expect(getMerchantDashboardSummary([], 'TODAY', now)).toEqual({
      ordersCount: 0,
      ordersToPrepareCount: 0,
      readyOrdersCount: 0,
      completedOrdersCount: 0,
      revenueCents: 0,
      nextSlot: null
    });
  });
});
