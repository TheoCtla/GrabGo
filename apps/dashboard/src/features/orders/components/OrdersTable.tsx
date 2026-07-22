import { KeyboardEvent } from 'react';
import { MerchantOrder } from '../types';
import { formatOrderShortId } from '../utils/order-formatters';
import { getOrderCustomerName } from '../utils/order-filters';
import { OrderStatusBadge } from './OrderStatusBadge';

type OrdersTableProps = {
  orders: MerchantOrder[];
  selectedOrderId?: string;
  onSelectOrder: (orderId: string) => void;
};

export function OrdersTable({ orders, selectedOrderId, onSelectOrder }: OrdersTableProps) {
  function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, orderId: string) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    onSelectOrder(orderId);
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th scope="col">Commande</th>
            <th scope="col">Client</th>
            <th scope="col">Statut</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              aria-label={`Ouvrir la commande ${formatOrderShortId(order.id)} de ${getOrderCustomerName(order)}`}
              aria-pressed={order.id === selectedOrderId}
              className={`order-row${order.id === selectedOrderId ? ' is-selected' : ''}`}
              onClick={() => onSelectOrder(order.id)}
              onKeyDown={(event) => handleRowKeyDown(event, order.id)}
              role="button"
              tabIndex={0}
            >
              <td>
                <span className="order-short-id">Commande #{formatOrderShortId(order.id)}</span>
              </td>
              <td>
                <span className="table-primary-text">{getOrderCustomerName(order)}</span>
                <span className="table-secondary-text">{order.user.email}</span>
              </td>
              <td>
                <OrderStatusBadge status={order.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
