// The catalogue a visitor sees, decided once per visit and kept in a cookie.
//
// Mainland China and Hong Kong take different products (docs/market-hongkong.md), so the
// storefront cannot show one list to both. Country comes from a GeoIP lookup on the
// visitor's address; anyone outside those two picks for themselves.

export const MARKETS = ["CN", "HK"] as const;
export type Market = (typeof MARKETS)[number];

/** Cookie holding the resolved market. Readable by server components on every request. */
export const MARKET_COOKIE = "sb_market";
/** Set once the visitor has been asked, so the picker does not reappear every page. */
export const MARKET_CHOSEN_COOKIE = "sb_market_chosen";

export const MARKET_LABEL: Record<Market, { zh: string; th: string; en: string }> = {
  CN: { zh: "中国大陆", th: "จีนแผ่นดินใหญ่", en: "Mainland China" },
  HK: { zh: "中国香港", th: "ฮ่องกง", en: "Hong Kong" },
};

export function isMarket(value: unknown): value is Market {
  return typeof value === "string" && (MARKETS as readonly string[]).includes(value);
}

/**
 * Market implied by a country code, or null when the visitor is somewhere else and
 * should be asked. GeoIP is country-accurate at best and a VPN defeats it entirely —
 * that is accepted here; the switcher in the header is the escape hatch.
 */
export function marketForCountry(country: string | null | undefined): Market | null {
  if (country === "CN") return "CN";
  if (country === "HK") return "HK";
  return null;
}
