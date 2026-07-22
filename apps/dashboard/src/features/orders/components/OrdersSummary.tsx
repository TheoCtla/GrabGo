import { OrdersSummaryCounts } from '../utils/order-filters';

type OrdersSummaryProps = {
  counts: OrdersSummaryCounts;
};

export function OrdersSummary({ counts }: OrdersSummaryProps) {
  return (
    <div className="orders-summary" aria-label="Synthèse des commandes">
      <div className="summary-tile">
        <span>Total actionnable</span>
        <strong>{counts.total}</strong>
      </div>
      <div className="summary-tile">
        <span>Prêtes</span>
        <strong>{counts.ready}</strong>
      </div>
      <div className="summary-tile">
        <span>Préparation</span>
        <strong>{counts.preparing}</strong>
      </div>
      <div className="summary-tile">
        <span>En attente</span>
        <strong>{counts.waiting}</strong>
      </div>
    </div>
  );
}
