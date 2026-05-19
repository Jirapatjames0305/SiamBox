export function formatCents(cents: number, currency = "CNY"): string {
  const value = (cents / 100).toFixed(2);
  return `${currency} ${value}`;
}

export function toCents(amount: number | string): number {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return Math.round(n * 100);
}
