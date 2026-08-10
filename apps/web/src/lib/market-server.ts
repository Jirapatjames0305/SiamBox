import { cookies } from "next/headers";
import { MARKET_COOKIE, isMarket, type Market } from "./market";

/**
 * Market for the current request, or null when GeoIP could not place the visitor and
 * they have not picked yet — the layout shows the picker in that case.
 *
 * Reading cookies opts the page out of static rendering, which is what we want: the
 * catalogue differs per visitor, so a shared cached copy would leak the wrong one.
 */
export async function getMarket(): Promise<Market | null> {
  const value = (await cookies()).get(MARKET_COOKIE)?.value;
  return isMarket(value) ? value : null;
}

/** Market to query the catalogue with. Unknown falls back to CN, the primary market. */
export async function getMarketOrDefault(): Promise<Market> {
  return (await getMarket()) ?? "CN";
}
