import { MerchantOrder, OrderStatus } from '../types';

export type DashboardSummaryPeriod = 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS';

export type MerchantDashboardSummary = {
  ordersCount: number;
  ordersToPrepareCount: number;
  readyOrdersCount: number;
  completedOrdersCount: number;
  revenueCents: number;
  nextSlot: {
    startAt: string;
    endAt: string;
  } | null;
};

const TO_PREPARE_STATUSES: OrderStatus[] = ['CONFIRMED', 'WAITING_PULL_CONFIRMATION', 'PREPARING'];

const TERMINAL_STATUSES: OrderStatus[] = ['COMPLETED', 'EXPIRED', 'CANCELLED', 'REFUNDED'];

export function getMerchantDashboardSummary(
  orders: MerchantOrder[],
  period: DashboardSummaryPeriod = 'TODAY',
  now = new Date()
): MerchantDashboardSummary {
  const periodBounds = getDashboardSummaryPeriodBounds(period, now);
  const periodOrders = orders.filter((order) =>
    isWithinPeriod(getOrderReferenceDate(order), periodBounds)
  );
  const upcomingOrders = periodOrders
    .filter((order) => !TERMINAL_STATUSES.includes(order.status))
    .filter((order) => new Date(order.slot.startAt).getTime() > now.getTime())
    .sort(
      (firstOrder, secondOrder) =>
        new Date(firstOrder.slot.startAt).getTime() - new Date(secondOrder.slot.startAt).getTime()
    );

  const nextSlotOrder = upcomingOrders[0];

  return {
    ordersCount: periodOrders.length,
    ordersToPrepareCount: periodOrders.filter((order) => TO_PREPARE_STATUSES.includes(order.status))
      .length,
    readyOrdersCount: periodOrders.filter((order) => order.status === 'READY').length,
    completedOrdersCount: periodOrders.filter((order) => order.status === 'COMPLETED').length,
    revenueCents: periodOrders.reduce((total, order) => total + order.totalCents, 0),
    nextSlot: nextSlotOrder
      ? {
          startAt: nextSlotOrder.slot.startAt,
          endAt: nextSlotOrder.slot.endAt
        }
      : null
  };
}

export function getDashboardSummaryPeriodBounds(
  period: DashboardSummaryPeriod,
  now = new Date()
): { from: Date; to: Date } {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const from = new Date(todayStart);

  if (period === 'LAST_7_DAYS') {
    from.setDate(from.getDate() - 6);
  }

  if (period === 'LAST_30_DAYS') {
    from.setDate(from.getDate() - 29);
  }

  return {
    from,
    to: todayEnd
  };
}

function getOrderReferenceDate(order: MerchantOrder): Date {
  return new Date(order.slot.startAt || order.createdAt);
}

function isWithinPeriod(date: Date, periodBounds: { from: Date; to: Date }): boolean {
  return date >= periodBounds.from && date < periodBounds.to;
}
