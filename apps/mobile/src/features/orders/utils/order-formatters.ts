export function formatCents(amountCents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amountCents / 100);
}

export function formatOrderId(orderId: string): string {
  return orderId.slice(-8).toUpperCase();
}

export function formatSlotWindow(startAt: string, endAt: string): string {
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `${formatter.format(new Date(startAt))} - ${formatter.format(new Date(endAt))}`;
}

export function validateCheckout(cartItemCount: number, slotId?: string): string | undefined {
  if (cartItemCount <= 0) {
    return 'Votre panier est vide.';
  }

  if (!slotId) {
    return 'Choisissez un créneau de retrait avant de confirmer.';
  }

  return undefined;
}
