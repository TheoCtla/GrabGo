import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Card } from '../../../shared/components/Card';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { getMerchantOrdersForSummary } from '../../orders/api/orders.api';
import { formatCents, formatPickupWindow } from '../../orders/utils/order-formatters';
import {
  DashboardSummaryPeriod,
  getDashboardSummaryPeriodBounds,
  getMerchantDashboardSummary
} from '../../orders/utils/order-summary';

const SUMMARY_PERIOD_OPTIONS: { label: string; value: DashboardSummaryPeriod }[] = [
  { label: "Aujourd'hui", value: 'TODAY' },
  { label: '7 derniers jours', value: 'LAST_7_DAYS' },
  { label: '30 derniers jours', value: 'LAST_30_DAYS' }
];

const SUMMARY_PERIOD_SELECT_ID = 'dashboard-summary-period';

export function DashboardHomePage() {
  const [period, setPeriod] = useState<DashboardSummaryPeriod>('TODAY');
  const periodBounds = useMemo(() => getDashboardSummaryPeriodBounds(period), [period]);

  const ordersQuery = useQuery({
    queryKey: [
      'merchant-orders-summary',
      period,
      periodBounds.from.toISOString(),
      periodBounds.to.toISOString()
    ],
    queryFn: () =>
      getMerchantOrdersForSummary({
        from: periodBounds.from.toISOString(),
        to: periodBounds.to.toISOString()
      })
  });

  const orders = ordersQuery.data ?? [];
  const summary = useMemo(() => getMerchantDashboardSummary(orders, period), [orders, period]);
  const periodLabel =
    SUMMARY_PERIOD_OPTIONS.find((periodOption) => periodOption.value === period)?.label ??
    "Aujourd'hui";

  if (ordersQuery.isLoading) {
    return <LoadingState message="Chargement de la synthèse..." />;
  }

  if (ordersQuery.isError) {
    return (
      <ErrorState
        title="Synthèse indisponible"
        message="Impossible de charger la synthèse pour le moment."
      />
    );
  }

  return (
    <section className="page-section" aria-labelledby="dashboard-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Synthèse</p>
          <h2 id="dashboard-title">Pilotage du snack</h2>
        </div>
        <div className="field summary-period-filter">
          <label htmlFor={SUMMARY_PERIOD_SELECT_ID}>Période</label>
          <select
            id={SUMMARY_PERIOD_SELECT_ID}
            value={period}
            onChange={(event) => setPeriod(event.target.value as DashboardSummaryPeriod)}
          >
            {SUMMARY_PERIOD_OPTIONS.map((periodOption) => (
              <option key={periodOption.value} value={periodOption.value}>
                {periodOption.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="Aucune commande pour le moment."
          message={`Aucune commande trouvée pour la période ${periodLabel.toLowerCase()}.`}
        />
      ) : (
        <div className="summary-grid" aria-label="Statistiques commerçant">
          <MetricCard
            label="Commandes"
            value={summary.ordersCount.toString()}
            description={periodLabel.toLowerCase()}
          />
          <MetricCard
            label="À préparer"
            value={summary.ordersToPrepareCount.toString()}
            description="confirmées, attente ou préparation"
          />
          <MetricCard
            label="Prêtes"
            value={summary.readyOrdersCount.toString()}
            description="commandes à remettre"
          />
          <MetricCard
            label="Terminées"
            value={summary.completedOrdersCount.toString()}
            description="commandes déjà retirées"
          />
          <MetricCard
            label="Chiffre d'affaires"
            value={formatCents(summary.revenueCents)}
            description={`calculé sur ${periodLabel.toLowerCase()}`}
          />
          <MetricCard
            label="Prochain créneau"
            value={
              summary.nextSlot
                ? formatPickupWindow(summary.nextSlot.startAt, summary.nextSlot.endAt)
                : 'Aucun créneau à venir'
            }
            description="créneau futur le plus proche"
          />
        </div>
      )}
    </section>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  description: string;
};

function MetricCard({ label, value, description }: MetricCardProps) {
  return (
    <Card className="summary-card">
      <h3>{label}</h3>
      <p className="metric">{value}</p>
      <p className="muted">{description}</p>
    </Card>
  );
}
