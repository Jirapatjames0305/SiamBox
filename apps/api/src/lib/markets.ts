// Which catalogue a visitor sees.
//
// Mainland China and Hong Kong have different import regimes — Hong Kong is a free port
// with no positive list, while proprietary Chinese medicines need registration there that
// they do not need for a mainland parcel. See docs/market-hongkong.md. A product carries
// the set of markets it may be listed in, and listings filter on it.

export const MARKETS = ["CN", "HK"] as const;
export type Market = (typeof MARKETS)[number];

export const DEFAULT_MARKET: Market = "CN";

export function isMarket(value: unknown): value is Market {
  return typeof value === "string" && (MARKETS as readonly string[]).includes(value);
}

/**
 * Market implied by a visitor's country, or null when the country maps to neither —
 * those visitors pick for themselves.
 */
export function marketForCountry(country: string | null | undefined): Market | null {
  if (country === "CN") return "CN";
  if (country === "HK") return "HK";
  return null;
}

/**
 * Prisma filter for a listing. An absent or unrecognised market returns an empty filter
 * so admin tooling and older clients keep seeing everything.
 */
export function marketFilter(market: unknown): { markets?: { has: Market } } {
  return isMarket(market) ? { markets: { has: market } } : {};
}
