export function formatPrice(cents: number, currency = "CNY"): string {
  const value = (cents / 100).toFixed(2);
  const symbol = currency === "CNY" ? "¥" : currency === "THB" ? "฿" : currency === "USD" ? "$" : currency;
  return `${symbol}${value}`;
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
