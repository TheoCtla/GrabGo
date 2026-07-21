import { describe, expect, it } from 'vitest';
import { MerchantOrder } from '../types';
import { filterMerchantOrders, getOrdersSummaryCounts } from './order-filters';

function createMerchantOrder(overrides: Partial<MerchantOrder> = {}): MerchantOrder {
  return {
    id: 'cmruzxxtl0001q701xdsovtng',
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
    createdAt: '2026-07-21T10:00:00.000Z',
    updatedAt: '2026-07-21T10:00:00.000Z',
    items: [],
    payment: null,
    slot: {
      id: 'slot-id',
      snackId: 'snack-id',
      startAt: '2026-07-21T12:00:00.000Z',
      endAt: '2026-07-21T12:15:00.000Z',
      capacity: 8,
      reservedCount: 1,
      status: 'AVAILABLE',
      createdAt: '2026-07-21T10:00:00.000Z',
      updatedAt: '2026-07-21T10:00:00.000Z'
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
      createdAt: '2026-07-21T10:00:00.000Z',
      updatedAt: '2026-07-21T10:00:00.000Z'
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

describe('order filters', () => {
  it('filters orders by status', () => {
    const confirmedOrder = createMerchantOrder({ id: 'confirmed-order', status: 'CONFIRMED' });
    const readyOrder = createMerchantOrder({ id: 'ready-order', status: 'READY' });

    expect(
      filterMerchantOrders([confirmedOrder, readyOrder], {
        search: '',
        status: 'READY'
      })
    ).toEqual([readyOrder]);
  });

  it('searches by customer, snack and short order id', () => {
    const adaOrder = createMerchantOrder();
    const graceOrder = createMerchantOrder({
      id: 'cmruzxxtl0001q701grace99',
      customerFirstName: null,
      snack: {
        ...createMerchantOrder().snack,
        name: 'Café Nord'
      },
      user: {
        id: 'student-2',
        firstName: 'Grace',
        lastName: 'Hopper',
        email: 'grace@grabgo.test'
      }
    });

    expect(
      filterMerchantOrders([adaOrder, graceOrder], { search: 'hopper', status: 'ALL' })
    ).toEqual([graceOrder]);
    expect(filterMerchantOrders([adaOrder, graceOrder], { search: 'Café', status: 'ALL' })).toEqual(
      [graceOrder]
    );
    expect(
      filterMerchantOrders([adaOrder, graceOrder], { search: 'grace99', status: 'ALL' })
    ).toEqual([graceOrder]);
  });

  it('counts actionable order states', () => {
    const counts = getOrdersSummaryCounts([
      createMerchantOrder({ status: 'CONFIRMED' }),
      createMerchantOrder({ id: 'waiting', status: 'WAITING_PULL_CONFIRMATION' }),
      createMerchantOrder({ id: 'preparing', status: 'PREPARING' }),
      createMerchantOrder({ id: 'ready', status: 'READY' })
    ]);

    expect(counts).toEqual({
      total: 4,
      ready: 1,
      preparing: 1,
      waiting: 2
    });
  });
});
