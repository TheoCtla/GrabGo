import { OrderStatus } from '../types';

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Paiement en attente',
  PAID: 'Payée',
  CONFIRMED: 'Confirmée',
  WAITING_PULL_CONFIRMATION: 'Confirmation de retrait attendue',
  PREPARING: 'En préparation',
  READY: 'Prête',
  COMPLETED: 'Retirée',
  LATE: 'Retard signalé',
  EXPIRED: 'Expirée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée'
};

export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status];
}
