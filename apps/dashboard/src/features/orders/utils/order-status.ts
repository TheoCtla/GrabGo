import { MerchantTargetOrderStatus, OrderStatus, UpdateOrderStatusPayload } from '../types';

type StatusAction = {
  label: string;
  payload: UpdateOrderStatusPayload;
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Paiement en attente',
  PAID: 'Payée',
  CONFIRMED: 'Confirmée',
  WAITING_PULL_CONFIRMATION: 'Attente',
  PREPARING: 'Préparation',
  READY: 'Prête',
  COMPLETED: 'Terminée',
  LATE: 'En retard',
  EXPIRED: 'Expirée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée'
};

const NEXT_STATUS_BY_STATUS: Partial<Record<OrderStatus, StatusAction>> = {
  CONFIRMED: {
    label: 'Demander confirmation',
    payload: {
      status: 'WAITING_PULL_CONFIRMATION'
    }
  },
  WAITING_PULL_CONFIRMATION: {
    label: 'Démarrer préparation',
    payload: {
      status: 'PREPARING'
    }
  },
  PREPARING: {
    label: 'Marquer prête',
    payload: {
      status: 'READY'
    }
  }
};

export function getOrderStatusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status];
}

export function getNextMerchantStatusAction(status: OrderStatus): StatusAction | null {
  return NEXT_STATUS_BY_STATUS[status] ?? null;
}

export function isMerchantTargetOrderStatus(
  status: OrderStatus
): status is MerchantTargetOrderStatus {
  return ['WAITING_PULL_CONFIRMATION', 'PREPARING', 'READY', 'LATE'].includes(status);
}
