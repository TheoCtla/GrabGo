import { ChangeEvent, useId } from 'react';
import { OrdersStatusFilter } from '../utils/order-filters';

type OrdersToolbarProps = {
  resultCount: number;
  search: string;
  status: OrdersStatusFilter;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: OrdersStatusFilter) => void;
};

const STATUS_FILTER_OPTIONS: Array<{ label: string; value: OrdersStatusFilter }> = [
  { label: 'Tous', value: 'ALL' },
  { label: 'Confirmée', value: 'CONFIRMED' },
  { label: 'Attente confirmation', value: 'WAITING_PULL_CONFIRMATION' },
  { label: 'En préparation', value: 'PREPARING' },
  { label: 'Prête', value: 'READY' },
  { label: 'En retard', value: 'LATE' }
];

export function OrdersToolbar({
  onSearchChange,
  onStatusChange,
  resultCount,
  search,
  status,
  totalCount
}: OrdersToolbarProps) {
  const searchId = useId();
  const statusId = useId();

  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    onStatusChange(event.target.value as OrdersStatusFilter);
  }

  return (
    <div className="orders-toolbar">
      <div className="field orders-search">
        <label htmlFor={searchId}>Recherche commande</label>
        <input
          id={searchId}
          type="search"
          placeholder="Client, email, snack, heure, identifiant..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className="field orders-status-filter">
        <label htmlFor={statusId}>Statut</label>
        <select id={statusId} value={status} onChange={handleStatusChange}>
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <p className="filter-result" role="status" aria-live="polite">
        {resultCount} résultat(s) affiché(s) sur {totalCount} commande(s).
      </p>
    </div>
  );
}
