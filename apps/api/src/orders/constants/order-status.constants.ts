import { OrderStatus } from '@prisma/client';

export const ACTIVE_WITHDRAWAL_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.WAITING_PULL_CONFIRMATION,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.LATE
];
