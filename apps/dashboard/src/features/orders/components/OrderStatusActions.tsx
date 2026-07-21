import { Button } from '../../../shared/components/Button';
import { MerchantOrder, UpdateOrderStatusPayload } from '../types';
import { getNextMerchantStatusAction } from '../utils/order-status';

type OrderStatusActionsProps = {
  isUpdating: boolean;
  order: MerchantOrder;
  onUpdateStatus: (orderId: string, payload: UpdateOrderStatusPayload) => void;
};

export function OrderStatusActions({ isUpdating, order, onUpdateStatus }: OrderStatusActionsProps) {
  const action = getNextMerchantStatusAction(order.status);

  if (!action) {
    return <p className="muted">Aucune action de statut disponible.</p>;
  }

  return (
    <Button
      isLoading={isUpdating}
      onClick={() => onUpdateStatus(order.id, action.payload)}
      variant="primary"
    >
      {action.label}
    </Button>
  );
}
