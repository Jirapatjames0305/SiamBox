// Display-currency switching.
//
// Products are priced and charged in CNY. This module only changes what the shopper
// *sees* — the amount actually taken is always the CNY price (converted to THB by the
// payment gateway at settlement). Anything shown in a non-base currency is therefore
// marked as approximate, because a static rate is not the rate that will be charged.

export const CURRENCIES = ["CNY", "HKD", "THB", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const BASE_CURRENCY: Currency = "CNY";

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  CNY: "¥",
  HKD: "HK$",
  THB: "฿",
  USD: "$",
};

export const CURRENCY_LABEL: Record<Currency, string> = {
  CNY: "CNY ¥",
  HKD: "HKD HK$",
  THB: "THB ฿",
  USD: "USD $",
};

/**
 * Rates out of CNY. Overridden at runtime from /api/packages/config so they can be
 * corrected without a redeploy; these are only the fallback when config has not loaded.
 * Still static — see docs/payment-gateway-china.md on moving to a live rate.
 */
export const FALLBACK_RATES: Record<Currency, number> = {
  CNY: 1,
  HKD: 1.09,
  THB: 4.9,
  USD: 0.14,
};

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}

export function convert(cents: number, to: Currency, rates: Record<Currency, number>): number {
  return Math.round(cents * (rates[to] ?? 1));
}

export function formatMoney(cents: number, currency: Currency | string): string {
  const symbol = CURRENCY_SYMBOL[currency as Currency] ?? currency;
  // THB is quoted in whole baht in Thai retail; the sub-unit adds noise at these prices.
  // HKD keeps its cents — Hong Kong prices are normally shown to two places.
  const digits = currency === "THB" ? 0 : 2;
  return `${symbol}${(cents / 100).toFixed(digits)}`;
}
