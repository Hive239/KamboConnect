import { describe, it, expect } from 'vitest';
import { formatCurrency } from './format';

describe('formatCurrency', () => {
  it('formats USD with a dollar sign', () => {
    const out = formatCurrency(1200, 'USD', 'en-US');
    expect(out).toContain('1,200');
    expect(out).toContain('$');
  });

  it('respects a different currency', () => {
    const out = formatCurrency(50, 'EUR', 'en-US');
    expect(out).toMatch(/€|EUR/);
  });
});
