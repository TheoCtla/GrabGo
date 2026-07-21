import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../../shared/api/api-error';
import { Button } from '../../../shared/components/Button';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import {
  getMerchantOrders,
  getOrderDetail,
  updateMerchantOrderStatus,
  validateWithdrawal
} from '../api/orders.api';
import { OrderDetailPanel } from '../components/OrderDetailPanel';
import { OrdersSummary } from '../components/OrdersSummary';
import { OrdersTable } from '../components/OrdersTable';
import { OrdersToolbar } from '../components/OrdersToolbar';
import { UpdateOrderStatusPayload, ValidateWithdrawalPayload } from '../types';
import {
  OrdersStatusFilter,
  filterMerchantOrders,
  getOrdersSummaryCounts
} from '../utils/order-filters';

const MERCHANT_ORDERS_QUERY_KEY = ['merchant-orders'] as const;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function MerchantOrdersPage() {
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();
  const [feedbackMessage, setFeedbackMessage] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrdersStatusFilter>('ALL');

  const ordersQuery = useQuery({
    queryKey: MERCHANT_ORDERS_QUERY_KEY,
    queryFn: getMerchantOrders
  });

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const filteredOrders = useMemo(
    () => filterMerchantOrders(orders, { search, status: statusFilter }),
    [orders, search, statusFilter]
  );
  const summaryCounts = useMemo(() => getOrdersSummaryCounts(orders), [orders]);
  const selectedOrder =
    filteredOrders.find((order) => order.id === selectedOrderId) ?? filteredOrders[0];

  useEffect(() => {
    if (!selectedOrderId && filteredOrders[0]) {
      setSelectedOrderId(filteredOrders[0].id);
    }

    if (
      selectedOrderId &&
      filteredOrders.length > 0 &&
      !filteredOrders.some((order) => order.id === selectedOrderId)
    ) {
      setSelectedOrderId(filteredOrders[0]?.id);
    }
  }, [filteredOrders, selectedOrderId]);

  const orderDetailQuery = useQuery({
    queryKey: ['order-detail', selectedOrder?.id],
    queryFn: () => {
      if (!selectedOrder) {
        throw new Error('Aucune commande sélectionnée');
      }

      return getOrderDetail(selectedOrder.id);
    },
    enabled: Boolean(selectedOrder)
  });

  const statusMutation = useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: UpdateOrderStatusPayload }) =>
      updateMerchantOrderStatus(orderId, payload),
    onSuccess: async (_, variables) => {
      setFeedbackMessage('Statut de commande mis à jour.');
      await queryClient.invalidateQueries({ queryKey: MERCHANT_ORDERS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ['order-detail', variables.orderId] });
    }
  });

  const withdrawalMutation = useMutation({
    mutationFn: (payload: ValidateWithdrawalPayload) => validateWithdrawal(payload),
    onSuccess: async () => {
      setFeedbackMessage('Retrait validé. La commande est terminée.');
      await queryClient.invalidateQueries({ queryKey: MERCHANT_ORDERS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ['order-detail', selectedOrder?.id] });
    }
  });

  if (ordersQuery.isLoading) {
    return <LoadingState message="Chargement des commandes..." />;
  }

  if (ordersQuery.isError) {
    const errorMessage = getErrorMessage(
      ordersQuery.error,
      'Impossible de charger les commandes commerçant pour le moment.'
    );

    return <ErrorState title="Commandes indisponibles" message={errorMessage} />;
  }

  return (
    <section className="page-section" aria-labelledby="orders-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Opérations</p>
          <h2 id="orders-title">Commandes commerçant</h2>
        </div>
        <div className="page-actions">
          <p className="muted">{orders.length} commande(s) actionnable(s)</p>
          <Button
            isLoading={ordersQuery.isFetching}
            onClick={() => {
              setFeedbackMessage(undefined);
              void ordersQuery.refetch();
            }}
            variant="secondary"
          >
            Rafraîchir
          </Button>
        </div>
      </div>

      {feedbackMessage ? (
        <p className="feedback-message" role="status">
          {feedbackMessage}
        </p>
      ) : null}

      {orders.length === 0 ? (
        <EmptyState
          title="Aucune commande en cours"
          message="Les nouvelles commandes confirmées apparaîtront ici automatiquement après connexion à l'API."
        />
      ) : (
        <>
          <OrdersSummary counts={summaryCounts} />
          <OrdersToolbar
            resultCount={filteredOrders.length}
            search={search}
            status={statusFilter}
            totalCount={orders.length}
            onSearchChange={(value) => {
              setSearch(value);
              setFeedbackMessage(undefined);
            }}
            onStatusChange={(value) => {
              setStatusFilter(value);
              setFeedbackMessage(undefined);
            }}
          />

          {filteredOrders.length === 0 ? (
            <EmptyState
              title="Aucun résultat"
              message="Aucune commande ne correspond à votre recherche ou au statut sélectionné."
            />
          ) : (
            <div className="orders-workspace">
              <OrdersTable
                orders={filteredOrders}
                selectedOrderId={selectedOrder?.id}
                onSelectOrder={(orderId) => {
                  setFeedbackMessage(undefined);
                  setSelectedOrderId(orderId);
                }}
              />

              {selectedOrder ? (
                <OrderDetailPanel
                  detail={orderDetailQuery.data}
                  isDetailLoading={orderDetailQuery.isLoading}
                  isStatusUpdating={statusMutation.isPending}
                  isWithdrawalSubmitting={withdrawalMutation.isPending}
                  order={selectedOrder}
                  statusError={
                    statusMutation.isError
                      ? getErrorMessage(
                          statusMutation.error,
                          'Impossible de mettre à jour le statut.'
                        )
                      : undefined
                  }
                  withdrawalError={
                    withdrawalMutation.isError
                      ? getErrorMessage(
                          withdrawalMutation.error,
                          'Impossible de valider le retrait.'
                        )
                      : undefined
                  }
                  onUpdateStatus={(orderId, payload) => {
                    setFeedbackMessage(undefined);
                    statusMutation.mutate({ orderId, payload });
                  }}
                  onValidateWithdrawal={(payload) => {
                    setFeedbackMessage(undefined);
                    withdrawalMutation.mutate(payload);
                  }}
                />
              ) : null}
            </div>
          )}
        </>
      )}
    </section>
  );
}
