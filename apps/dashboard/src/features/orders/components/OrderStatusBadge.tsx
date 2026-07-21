import { getOrderStatusLabel } from '../utils/order-status';
import { OrderStatus } from '../types';

type OrderStatusBadgeProps = {
  status: OrderStatus;
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <span className="status-pill" data-status={status}>
      <span className="status-dot" aria-hidden="true" />
      {getOrderStatusLabel(status)}
    </span>
  );
}
