import { describe, expect, it } from 'vitest';
import { formatCents, formatSlotAvailability } from './catalog-formatters';

describe('catalog formatters', () => {
  it('formats product prices', () => {
    expect(formatCents(550)).toContain('5,50');
  });

  it('formats slot availability', () => {
    expect(formatSlotAvailability(8, 3)).toBe('5 place(s) restante(s)');
  });
});
