// lib/money.ts
// All monetary arithmetic lives here.
// Storage: String ("12500.00")
// Computation: integer cents to avoid float drift
// TODO v2: replace with PostgreSQL Decimal + prisma Decimal type

/**
 * Parse a stored money string to integer cents.
 * "12500.50" → 1250050
 */
export function toCents(value: string | number): number {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(n)) return 0;
  return Math.round(n * 100);
}

/**
 * Convert cents back to a display-safe string.
 * 1250050 → "12500.50"
 */
export function fromCents(cents: number): string {
  return (Math.round(cents) / 100).toFixed(2);
}

/**
 * Add two money strings.
 */
export function addMoney(a: string, b: string): string {
  return fromCents(toCents(a) + toCents(b));
}

/**
 * Multiply a money string by a ratio (0–1).
 * Used for businessPct: allowed = amount × (pct / 100)
 */
export function applyRatio(amount: string, ratio: number): string {
  return fromCents(Math.round(toCents(amount) * ratio));
}

/**
 * Subtract b from a.
 */
export function subtractMoney(a: string, b: string): string {
  return fromCents(toCents(a) - toCents(b));
}

/**
 * Sum an array of money strings.
 */
export function sumMoney(values: string[]): string {
  return fromCents(values.reduce((acc, v) => acc + toCents(v), 0));
}

/**
 * Parse to JS number for display/formatting only.
 * NEVER use this for arithmetic — use cent functions above.
 */
export function toNumber(value: string): number {
  return parseFloat(value) || 0;
}

/**
 * Format for display.
 */
export function formatMoney(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(n)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}
