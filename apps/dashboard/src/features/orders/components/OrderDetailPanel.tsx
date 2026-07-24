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
  const withdrawalCodeState = displayedOrder.withdrawalCode
    ? formatWithdrawalCodeState(
        displayedOrder.withdrawalCode.usedAt,
        displayedOrder.withdrawalCode.expiresAt
      ).replace(/\.$/, '')
    : undefined;

  return (
    <Card className="order-detail-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Commande sélectionnée</p>
          <h3>#{formatOrderShortId(displayedOrder.id)}</h3>
          <p className="detail-customer-line">
            <strong>{customerName}</strong>
            <span>{displayedOrder.user.email}</span>
          </p>
        </div>
        <OrderStatusBadge status={displayedOrder.status} />
      </div>

      {isDetailLoading ? (
        <LoadingState message="Chargement du détail..." />
      ) : (
        <>
          <div className="detail-content">
            <div className="detail-main-column">
              <dl className="detail-grid">
                <div>
                  <dt>Créneau</dt>
                  <dd>
                    {formatPickupWindow(displayedOrder.slot.startAt, displayedOrder.slot.endAt)}
                  </dd>
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

              {displayedOrder.withdrawalCode ? (
                <section className="detail-section" aria-label="Retrait">
                  <div className="withdrawal-code-box">
                    <span>
                      Code de retrait : <strong>{displayedOrder.withdrawalCode.code}</strong>
                    </span>
                  </div>
                </section>
              ) : null}

              {displayedOrder.specialNote ? (
                <section className="detail-section" aria-labelledby="order-note-title">
                  <h4 id="order-note-title">Note client</h4>
                  <p>{displayedOrder.specialNote}</p>
                </section>
              ) : null}
            </div>

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
          </div>

          <div className="detail-section detail-actions-section">
            {withdrawalCodeState ? (
              <p className="withdrawal-validity" aria-label="Validité du code de retrait">
                {withdrawalCodeState}
              </p>
            ) : null}
            <div className="actions-stack">
              {displayedOrder.status !== 'READY' ? (
                <OrderStatusActions
                  isUpdating={isStatusUpdating}
                  order={displayedOrder}
                  onUpdateStatus={onUpdateStatus}
                />
              ) : null}
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
          </div>
        </>
      )}
    </Card>
  );
}
