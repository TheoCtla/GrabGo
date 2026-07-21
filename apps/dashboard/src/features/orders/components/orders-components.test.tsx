import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from '../../../shared/components/EmptyState';
import { MerchantOrder } from '../types';
import { OrderStatusActions } from './OrderStatusActions';
import { OrdersSummary } from './OrdersSummary';
import { OrdersTable } from './OrdersTable';
import { OrdersToolbar } from './OrdersToolbar';
import { WithdrawalValidationForm } from './WithdrawalValidationForm';

function createMerchantOrder(overrides: Partial<MerchantOrder> = {}): MerchantOrder {
  return {
    id: 'order-id',
    userId: 'student-id',
    snackId: 'snack-id',
    slotId: 'slot-id',
    customerFirstName: 'Ada',
    status: 'CONFIRMED',
    productsTotalCents: 900,
    serviceFeeCents: 49,
    totalCents: 949,
    specialNote: null,
    pickupConfirmedAt: null,
    lateReportedAt: null,
    createdAt: '2026-07-21T10:00:00.000Z',
    updatedAt: '2026-07-21T10:00:00.000Z',
    items: [],
    payment: null,
    slot: {
      id: 'slot-id',
      snackId: 'snack-id',
      startAt: '2026-07-21T12:00:00.000Z',
      endAt: '2026-07-21T12:15:00.000Z',
      capacity: 8,
      reservedCount: 1,
      status: 'AVAILABLE',
      createdAt: '2026-07-21T10:00:00.000Z',
      updatedAt: '2026-07-21T10:00:00.000Z'
    },
    snack: {
      id: 'snack-id',
      merchantId: 'merchant-id',
      campusId: 'campus-id',
      name: 'Snack Campus',
      description: null,
      status: 'ONLINE',
      circuitBreaker: false,
      snoozedUntil: null,
      openingTime: null,
      closingTime: null,
      createdAt: '2026-07-21T10:00:00.000Z',
      updatedAt: '2026-07-21T10:00:00.000Z'
    },
    withdrawalCode: null,
    user: {
      id: 'student-id',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@grabgo.test'
    },
    ...overrides
  };
}

describe('orders dashboard components', () => {
  it('renders the empty state', () => {
    render(
      <EmptyState
        title="Aucune commande en cours"
        message="Les commandes confirmées apparaîtront ici."
      />
    );

    expect(screen.getByRole('heading', { name: 'Aucune commande en cours' })).toBeInTheDocument();
    expect(screen.getByText('Les commandes confirmées apparaîtront ici.')).toBeInTheDocument();
  });

  it('renders an order in the merchant table', () => {
    render(
      <OrdersTable
        orders={[createMerchantOrder()]}
        selectedOrderId="order-id"
        onSelectOrder={vi.fn()}
      />
    );

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Snack Campus' })).toBeInTheDocument();
    expect(screen.getByText('Confirmée')).toBeInTheDocument();
  });

  it('renders the orders summary counters', () => {
    render(
      <OrdersSummary
        counts={{
          total: 5,
          ready: 2,
          preparing: 1,
          waiting: 2
        }}
      />
    );

    expect(screen.getByText('Total actionnable')).toBeInTheDocument();
    expect(screen.getByText('Prêtes')).toBeInTheDocument();
    expect(screen.getByText('En préparation')).toBeInTheDocument();
  });

  it('updates toolbar search and status filters', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const onStatusChange = vi.fn();

    render(
      <OrdersToolbar
        resultCount={0}
        search=""
        status="ALL"
        totalCount={3}
        onSearchChange={onSearchChange}
        onStatusChange={onStatusChange}
      />
    );

    await user.type(screen.getByLabelText('Recherche commande'), 'Ada');
    await user.selectOptions(screen.getByLabelText('Statut'), 'READY');

    expect(onSearchChange).toHaveBeenCalled();
    expect(onStatusChange).toHaveBeenCalledWith('READY');
    expect(screen.getByText('0 résultat(s) affiché(s) sur 3 commande(s).')).toBeInTheDocument();
  });

  it('shows the expected status action for a confirmed order', async () => {
    const user = userEvent.setup();
    const onUpdateStatus = vi.fn();

    render(
      <OrderStatusActions
        isUpdating={false}
        order={createMerchantOrder({ status: 'CONFIRMED' })}
        onUpdateStatus={onUpdateStatus}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Demander confirmation' }));

    expect(onUpdateStatus).toHaveBeenCalledWith('order-id', {
      status: 'WAITING_PULL_CONFIRMATION'
    });
  });

  it('validates withdrawal code format before submit', async () => {
    const user = userEvent.setup();
    const onValidate = vi.fn();

    render(
      <WithdrawalValidationForm isSubmitting={false} snackId="snack-id" onValidate={onValidate} />
    );

    await user.type(screen.getByLabelText('Code de retrait'), '12');
    await user.click(screen.getByRole('button', { name: 'Valider le retrait' }));

    expect(
      screen.getByText('Le code de retrait doit contenir exactement 4 chiffres.')
    ).toBeInTheDocument();
    expect(onValidate).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText('Code de retrait'));
    await user.type(screen.getByLabelText('Code de retrait'), '1234');
    await user.click(screen.getByRole('button', { name: 'Valider le retrait' }));

    expect(onValidate).toHaveBeenCalledWith({
      code: '1234',
      snackId: 'snack-id'
    });
  });
});
