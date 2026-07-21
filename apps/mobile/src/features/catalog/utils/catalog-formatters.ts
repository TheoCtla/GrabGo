export function formatCents(amountCents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amountCents / 100);
}

export function formatSlotWindow(startAt: string, endAt: string): string {
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return `${formatter.format(new Date(startAt))} - ${formatter.format(new Date(endAt))}`;
}

export function formatSlotAvailability(capacity: number, reservedCount: number): string {
  return `${Math.max(capacity - reservedCount, 0)} place(s) restante(s)`;
}
