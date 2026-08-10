import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { MARKET_COOKIE, isMarket, marketForCountry } from "./lib/market";

const intlMiddleware = createMiddleware(routing);

// Resolved server-side so the first paint already carries the right catalogue — doing
// this in the browser would flash the wrong products before correcting itself.
const API_URL =
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/** Visitor's address as seen through Caddy. */
function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "";
}

export default async function middleware(req: NextRequest) {
  const response = intlMiddleware(req);

  // Only look up once per visitor. The cookie also carries a manual switch, so a
  // repeat lookup would keep overriding what the visitor picked.
  if (isMarket(req.cookies.get(MARKET_COOKIE)?.value)) return response;

  const ip = clientIp(req);
  let market: string | null = null;
  if (ip) {
    try {
      const res = await fetch(`${API_URL}/api/presence/geo?ip=${encodeURIComponent(ip)}`, {
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) {
        const json = (await res.json()) as { data?: { country?: string | null } };
        market = marketForCountry(json.data?.country);
      }
    } catch {
      // GeoIP is best-effort — a slow or failed lookup must not hold up the page.
      // Leaving the cookie unset makes the storefront ask the visitor instead.
    }
  }

  if (market) {
    response.cookies.set(MARKET_COOKIE, market, {
      path: "/",
      maxAge: 60 * 60 * 24 * 180,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  // Match all paths except api, _next, static files
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
