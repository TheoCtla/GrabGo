import { describe, expect, it } from 'vitest';
import { formatCents, validateCheckout } from './order-formatters';
import { getOrderStatusLabel } from './order-status';

describe('order formatters', () => {
  it('formats amounts in euros', () => {
    expect(formatCents(749)).toContain('7,49');
  });

  it('formats order statuses with readable labels', () => {
    expect(getOrderStatusLabel('WAITING_PULL_CONFIRMATION')).toBe(
      'Confirmation de retrait attendue'
    );
  });

  it('refuses checkout without items or selected slot', () => {
    expect(validateCheckout(0, 'slot-1')).toBe('Votre panier est vide.');
    expect(validateCheckout(2)).toBe('Choisissez un créneau de retrait avant de confirmer.');
    expect(validateCheckout(2, 'slot-1')).toBeUndefined();
  });
});
