/**
 * Locale/currency/timezone-aware formatting helpers (used by marketplace,
 * scheduling, and i18n). Backed by the Intl API — no deps.
 */
export function formatCurrency(amount: number, currency = 'USD', locale?: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export function formatDate(
  date: string | number | Date,
  opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
  locale?: string,
): string {
  try {
    return new Intl.DateTimeFormat(locale, opts).format(new Date(date));
  } catch {
    return String(date);
  }
}
