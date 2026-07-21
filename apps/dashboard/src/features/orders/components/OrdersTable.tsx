import { Button } from '../../../shared/components/Button';
import { MerchantOrder } from '../types';
import { formatCents, formatPickupWindow } from '../utils/order-formatters';
import { OrderStatusBadge } from './OrderStatusBadge';

type OrdersTableProps = {
  orders: MerchantOrder[];
  selectedOrderId?: string;
  onSelectOrder: (orderId: string) => void;
};

export function OrdersTable({ orders, selectedOrderId, onSelectOrder }: OrdersTableProps) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th scope="col">Client</th>
            <th scope="col">Snack</th>
            <th scope="col">Retrait</th>
            <th scope="col">Statut</th>
            <th scope="col">Total</th>
            <th scope="col">Détail</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className={order.id === selectedOrderId ? 'is-selected' : undefined}>
              <td>{order.customerFirstName ?? order.user.firstName}</td>
              <td>{order.snack.name}</td>
              <td>{formatPickupWindow(order.slot.startAt, order.slot.endAt)}</td>
              <td>
                <OrderStatusBadge status={order.status} />
              </td>
              <td>{formatCents(order.totalCents)}</td>
              <td>
                <Button
                  aria-pressed={order.id === selectedOrderId}
                  onClick={() => onSelectOrder(order.id)}
                  variant="secondary"
                >
                  Ouvrir
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
