import { Card } from '../../../shared/components/Card';
import { LoadingState } from '../../../shared/components/LoadingState';
import {
  MerchantOrder,
  OrderDetail,
  UpdateOrderStatusPayload,
  ValidateWithdrawalPayload
} from '../types';
import {
  formatCents,
  formatDateTime,
  formatOrderShortId,
  formatPickupWindow,
  formatWithdrawalCodeState
} from '../utils/order-formatters';
import { getOrderCustomerName } from '../utils/order-filters';
import { getNextMerchantStatusAction } from '../utils/order-status';
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
  const customerName = getOrderCustomerName(displayedOrder);
  const nextAction = getNextMerchantStatusAction(displayedOrder.status);

  return (
    <Card className="order-detail-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Commande sélectionnée</p>
          <h3>#{formatOrderShortId(displayedOrder.id)}</h3>
          <p className="muted">{customerName}</p>
        </div>
        <OrderStatusBadge status={displayedOrder.status} />
      </div>

      {isDetailLoading ? (
        <LoadingState message="Chargement du détail..." />
      ) : (
        <>
          <dl className="detail-grid">
            <div>
              <dt>Identifiant</dt>
              <dd>#{formatOrderShortId(displayedOrder.id)}</dd>
            </div>
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
            <div>
              <dt>Action suivante</dt>
              <dd>{nextAction?.label ?? 'Aucune action disponible'}</dd>
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
                    <span className="order-item-name">{item.productName}</span>
                    <span>
                      {item.quantity} x {formatCents(item.unitPriceCents)}
                    </span>
                    <strong>{formatCents(item.totalPriceCents)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {displayedOrder.withdrawalCode ? (
            <section className="detail-section" aria-labelledby="withdrawal-code-title">
              <h4 id="withdrawal-code-title">Retrait</h4>
              <div className="withdrawal-code-box">
                <span>Code de retrait</span>
                <strong>{displayedOrder.withdrawalCode.code}</strong>
                <p>
                  {formatWithdrawalCodeState(
                    displayedOrder.withdrawalCode.usedAt,
                    displayedOrder.withdrawalCode.expiresAt
                  )}
                </p>
              </div>
            </section>
          ) : null}

          {displayedOrder.specialNote ? (
            <section className="detail-section" aria-labelledby="order-note-title">
              <h4 id="order-note-title">Note client</h4>
              <p>{displayedOrder.specialNote}</p>
            </section>
          ) : null}

          <section className="detail-section" aria-labelledby="order-actions-title">
            <h4 id="order-actions-title">Actions</h4>
            <p className="muted">
              {nextAction
                ? `Action recommandée : ${nextAction.label}.`
                : displayedOrder.status === 'READY'
                  ? 'La commande est prête : validez le retrait avec le code étudiant.'
                  : 'Aucune action commerçant n’est disponible pour ce statut.'}
            </p>
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
