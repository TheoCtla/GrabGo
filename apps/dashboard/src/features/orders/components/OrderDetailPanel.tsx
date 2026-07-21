import { Card } from '../../../shared/components/Card';
import { LoadingState } from '../../../shared/components/LoadingState';
import {
  MerchantOrder,
  OrderDetail,
  UpdateOrderStatusPayload,
  ValidateWithdrawalPayload
} from '../types';
import { formatCents, formatDateTime, formatPickupWindow } from '../utils/order-formatters';
import { OrderStatusActions } from './OrderStatusActions';
import { OrderStatusBadge } from './OrderStatusBadge';
import { WithdrawalValidationForm } from './WithdrawalValidationForm';

type OrderDetailPanelProps = {
  detail?: OrderDetail;
  isDetailLoading: boolean;
  isStatusUpdating: boolean;
  isWithdrawalSubmitting: boolean;
  order: MerchantOrder;
  statusError?: string;
  withdrawalError?: string;
  onUpdateStatus: (orderId: string, payload: UpdateOrderStatusPayload) => void;
  onValidateWithdrawal: (payload: ValidateWithdrawalPayload) => void;
};

export function OrderDetailPanel({
  detail,
  isDetailLoading,
  isStatusUpdating,
  isWithdrawalSubmitting,
  order,
  statusError,
  withdrawalError,
  onUpdateStatus,
  onValidateWithdrawal
}: OrderDetailPanelProps) {
  const displayedOrder = detail ?? order;
  const customerName = displayedOrder.customerFirstName ?? displayedOrder.user.firstName;

  return (
    <Card className="order-detail-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Commande sélectionnée</p>
          <h3>{customerName}</h3>
        </div>
        <OrderStatusBadge status={displayedOrder.status} />
      </div>

      {isDetailLoading ? (
        <LoadingState message="Chargement du détail..." />
      ) : (
        <>
          <dl className="detail-grid">
            <div>
              <dt>Client</dt>
              <dd>
                {displayedOrder.user.firstName} {displayedOrder.user.lastName}
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{displayedOrder.user.email}</dd>
            </div>
            <div>
              <dt>Snack</dt>
              <dd>{displayedOrder.snack.name}</dd>
            </div>
            <div>
              <dt>Créneau</dt>
              <dd>{formatPickupWindow(displayedOrder.slot.startAt, displayedOrder.slot.endAt)}</dd>
            </div>
            <div>
              <dt>Créée le</dt>
              <dd>{formatDateTime(displayedOrder.createdAt)}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{formatCents(displayedOrder.totalCents)}</dd>
            </div>
          </dl>

          <section className="detail-section" aria-labelledby="order-items-title">
            <h4 id="order-items-title">Produits commandés</h4>
            {displayedOrder.items.length === 0 ? (
              <p className="muted">Aucun produit détaillé sur cette commande.</p>
            ) : (
              <ul className="order-items">
                {displayedOrder.items.map((item) => (
                  <li key={item.id}>
                    <span>
                      {item.quantity} x {item.productName}
                    </span>
                    <strong>{formatCents(item.totalPriceCents)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {displayedOrder.specialNote ? (
            <section className="detail-section" aria-labelledby="order-note-title">
              <h4 id="order-note-title">Note client</h4>
              <p>{displayedOrder.specialNote}</p>
            </section>
          ) : null}

          <section className="detail-section" aria-labelledby="order-actions-title">
            <h4 id="order-actions-title">Actions</h4>
            <div className="actions-stack">
              <OrderStatusActions
                isUpdating={isStatusUpdating}
                order={displayedOrder}
                onUpdateStatus={onUpdateStatus}
              />
              {statusError ? (
                <p className="form-error" role="alert">
                  {statusError}
                </p>
              ) : null}

              {displayedOrder.status === 'READY' ? (
                <WithdrawalValidationForm
                  apiError={withdrawalError}
                  isSubmitting={isWithdrawalSubmitting}
                  snackId={displayedOrder.snackId}
                  onValidate={onValidateWithdrawal}
                />
              ) : null}
            </div>
          </section>
        </>
      )}
    </Card>
  );
}
