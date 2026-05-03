/**
 * Format a number in Indian currency notation.
 * < 1 Lakh   → ₹X,XXX
 * 1L – 1Cr   → ₹X.X L
 * ≥ 1Cr      → ₹X.XX Cr
 */
export function formatINR(value: number | null | undefined): string {
  if (value == null) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 10_000_000) return `${sign}₹${(abs / 10_000_000).toFixed(2)} Cr`;
  if (abs >= 100_000)    return `${sign}₹${(abs / 100_000).toFixed(1)} L`;
  return `${sign}₹${abs.toLocaleString('en-IN')}`;
}

/** Short label for chart axis ticks (omits ₹ symbol and keeps compact) */
export function formatINRShort(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10_000_000) return `${(value / 10_000_000).toFixed(1)}Cr`;
  if (abs >= 100_000)    return `${(value / 100_000).toFixed(0)}L`;
  return value.toLocaleString('en-IN');
}

/** "2025-04" → "Apr'25" */
export function formatMonth(yyyyMm: string): string {
  const [year, month] = yyyyMm.split('-');
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${names[+month - 1]}'${year.slice(2)}`;
}

/** "2025-04" → "Apr 2025" */
export function formatMonthLong(yyyyMm: string): string {
  const [year, month] = yyyyMm.split('-');
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${names[+month - 1]} ${year}`;
}
