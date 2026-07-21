import { MerchantOrder, OrderStatus } from '../types';
import { formatOrderShortId, formatPickupWindow } from './order-formatters';

export type OrdersStatusFilter =
  | 'ALL'
  | 'CONFIRMED'
  | 'WAITING_PULL_CONFIRMATION'
  | 'PREPARING'
  | 'READY'
  | 'LATE';

export type OrdersFilters = {
  search: string;
  status: OrdersStatusFilter;
};

export type OrdersSummaryCounts = {
  total: number;
  ready: number;
  preparing: number;
  waiting: number;
};

export function getOrderCustomerName(order: MerchantOrder): string {
  return [order.user.firstName, order.user.lastName].filter(Boolean).join(' ').trim();
}

export function filterMerchantOrders(
  orders: MerchantOrder[],
  filters: OrdersFilters
): MerchantOrder[] {
  const normalizedSearch = filters.search.trim().toLocaleLowerCase('fr-FR');

  return orders.filter((order) => {
    if (filters.status !== 'ALL' && order.status !== filters.status) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    const searchableText = [
      order.customerFirstName,
      order.user.firstName,
      order.user.lastName,
      order.user.email,
      order.snack.name,
      formatPickupWindow(order.slot.startAt, order.slot.endAt),
      formatOrderShortId(order.id)
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('fr-FR');

    return searchableText.includes(normalizedSearch);
  });
}

export function getOrdersSummaryCounts(orders: MerchantOrder[]): OrdersSummaryCounts {
  return {
    total: orders.length,
    ready: countOrdersByStatus(orders, 'READY'),
    preparing: countOrdersByStatus(orders, 'PREPARING'),
    waiting:
      countOrdersByStatus(orders, 'CONFIRMED') +
      countOrdersByStatus(orders, 'WAITING_PULL_CONFIRMATION')
  };
}

function countOrdersByStatus(orders: MerchantOrder[], status: OrderStatus): number {
  return orders.filter((order) => order.status === status).length;
}
