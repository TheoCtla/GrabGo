import { Button } from '../../../shared/components/Button';
import { MerchantOrder } from '../types';
import { formatCents, formatOrderShortId, formatPickupWindow } from '../utils/order-formatters';
import { getOrderCustomerName } from '../utils/order-filters';
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
            <th scope="col">Commande</th>
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
              <td>
                <span className="order-short-id">#{formatOrderShortId(order.id)}</span>
              </td>
              <td>
                <span className="table-primary-text">{getOrderCustomerName(order)}</span>
                <span className="table-secondary-text">{order.user.email}</span>
              </td>
              <td>{order.snack.name}</td>
              <td>{formatPickupWindow(order.slot.startAt, order.slot.endAt)}</td>
              <td>
                <OrderStatusBadge status={order.status} />
              </td>
              <td>{formatCents(order.totalCents)}</td>
              <td>
                <Button
                  aria-pressed={order.id === selectedOrderId}
                  aria-label={`Ouvrir la commande ${formatOrderShortId(order.id)} de ${getOrderCustomerName(order)}`}
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
