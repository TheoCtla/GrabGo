import { useQuery } from '@tanstack/react-query';
import { ApiError } from '../../../shared/api/api-error';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { getMerchantOrders } from '../api/orders.api';

function formatCents(amountCents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amountCents / 100);
}

function formatPickupTime(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

export function MerchantOrdersPage() {
  const ordersQuery = useQuery({
    queryKey: ['merchant-orders'],
    queryFn: getMerchantOrders
  });

  if (ordersQuery.isLoading) {
    return <LoadingState message="Chargement des commandes..." />;
  }

  if (ordersQuery.isError) {
    const errorMessage =
      ordersQuery.error instanceof ApiError
        ? ordersQuery.error.message
        : 'Impossible de charger les commandes commerçant pour le moment.';

    return <ErrorState title="Commandes indisponibles" message={errorMessage} />;
  }

  const orders = ordersQuery.data ?? [];

  return (
    <section className="page-section" aria-labelledby="orders-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Opérations</p>
          <h2 id="orders-title">Commandes commerçant</h2>
        </div>
        <p className="muted">{orders.length} commande(s) actionnable(s)</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="Aucune commande en cours"
          message="Les nouvelles commandes confirmées apparaîtront ici automatiquement après connexion à l'API."
        />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th scope="col">Client</th>
                <th scope="col">Snack</th>
                <th scope="col">Retrait</th>
                <th scope="col">Statut</th>
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.customerFirstName ?? order.user.firstName}</td>
                  <td>{order.snack.name}</td>
                  <td>{formatPickupTime(order.slot.startAt)}</td>
                  <td>
                    <span className="status-pill">{order.status}</span>
                  </td>
                  <td>{formatCents(order.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
