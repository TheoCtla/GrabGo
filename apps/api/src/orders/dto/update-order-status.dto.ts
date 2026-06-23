import { OrderStatus } from '@prisma/client';
import { IsIn } from 'class-validator';

export const MERCHANT_ORDER_STATUS_VALUES = [
  OrderStatus.WAITING_PULL_CONFIRMATION,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.LATE
] as const;

export class UpdateOrderStatusDto {
  @IsIn(MERCHANT_ORDER_STATUS_VALUES)
  status!: OrderStatus;
}
