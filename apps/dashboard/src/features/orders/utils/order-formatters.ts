export function formatCents(amountCents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amountCents / 100);
}

export function formatOrderShortId(orderId: string): string {
  return orderId.slice(-8).toUpperCase();
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

export function formatPickupWindow(startAt: string, endAt: string): string {
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return `${formatter.format(new Date(startAt))} - ${formatter.format(new Date(endAt))}`;
}

export function formatWithdrawalCodeState(
  usedAt?: string | null,
  expiresAt?: string | null
): string {
  if (usedAt) {
    return `Code utilisé le ${formatDateTime(usedAt)}.`;
  }

  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
    return `Code expiré le ${formatDateTime(expiresAt)}.`;
  }

  if (expiresAt) {
    return `Code valable jusqu'au ${formatDateTime(expiresAt)}.`;
  }

  return 'Code actif.';
}
