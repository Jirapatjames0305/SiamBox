"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import {
  MARKETS,
  MARKET_CHOSEN_COOKIE,
  MARKET_COOKIE,
  MARKET_LABEL,
  isMarket,
  type Market,
} from "@/lib/market";
import type { Locale } from "@/i18n/routing";
import { MarketArt } from "@/components/MarketArt";

type Copy = {
  title: string;
  body: string;
  note: string;
  hint: Record<Market, string>;
};

const COPY: Record<Locale, Copy> = {
  zh: {
    title: "请选择您要浏览的市场",
    body: "中国大陆与中国香港的进口规定不同，可售商品也不同。",
    note: "选择后可随时在页面顶部切换。",
    hint: { CN: "配送至中国大陆", HK: "配送至中国香港" },
  },
  th: {
    title: "เลือกตลาดที่ต้องการดู",
    body: "จีนแผ่นดินใหญ่กับฮ่องกงมีกฎการนำเข้าต่างกัน สินค้าที่ขายได้จึงไม่เหมือนกัน",
    note: "เปลี่ยนได้ตลอดที่ด้านบนของหน้า",
    hint: { CN: "จัดส่งไปจีนแผ่นดินใหญ่", HK: "จัดส่งไปฮ่องกง" },
  },
  en: {
    title: "Choose the market you want to browse",
    body: "Mainland China and Hong Kong have different import rules, so the products available differ.",
    note: "You can switch at any time from the top of the page.",
    hint: { CN: "Delivered to mainland China", HK: "Delivered to Hong Kong" },
  },
};

function setMarketCookie(market: Market) {
  const year = 60 * 60 * 24 * 180;
  document.cookie = `${MARKET_COOKIE}=${market}; path=/; max-age=${year}; samesite=lax`;
  document.cookie = `${MARKET_CHOSEN_COOKIE}=1; path=/; max-age=${year}; samesite=lax`;
}

function readCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}

/**
 * Asks visitors outside mainland China and Hong Kong which catalogue they want.
 *
 * The middleware sets the market cookie when GeoIP recognises the country; reaching this
 * component with no cookie means it did not, so the visitor decides. Rendered from the
 * layout so it covers every page.
 */
export function MarketGate({ resolved }: { resolved: Market | null }) {
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Only ask when the market is genuinely unknown and we have not asked before.
    if (resolved) return;
    if (isMarket(readCookie(MARKET_COOKIE))) return;
    if (readCookie(MARKET_CHOSEN_COOKIE)) return;
    setOpen(true);
  }, [resolved]);

  if (!open) return null;
  const t = COPY[locale] ?? COPY.zh;

  const choose = (market: Market) => {
    setMarketCookie(market);
    // Full reload: the catalogue is rendered on the server from the cookie.
    window.location.reload();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="market-gate-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="market-gate-title" className="text-lg font-bold text-slate-900">
          {t.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.body}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {MARKETS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => choose(m)}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition-all hover:border-slate-900 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <div className="aspect-[3/2] w-full overflow-hidden bg-slate-100">
                <div className="h-full w-full transition-transform duration-200 group-hover:scale-105">
                  <MarketArt market={m} />
                </div>
              </div>
              <div className="px-4 py-3">
                <span className="block text-sm font-semibold text-slate-900">
                  {MARKET_LABEL[m][locale] ?? MARKET_LABEL[m].en}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">{t.hint[m]}</span>
              </div>
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500">{t.note}</p>
      </div>
    </div>
  );
}

/** Always-visible switcher, so a wrong GeoIP guess is one click to correct. */
export function MarketSwitcher({ current }: { current: Market }) {
  const locale = useLocale() as Locale;
  return (
    <div className="inline-flex overflow-hidden rounded border border-gold-700/40">
      {MARKETS.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => {
            setMarketCookie(m);
            window.location.reload();
          }}
          className={`px-2 py-0.5 text-xs transition-colors ${
            m === current ? "bg-gold-500 text-maroon-950" : "text-cream-200 hover:text-gold-300"
          }`}
        >
          {MARKET_LABEL[m][locale] ?? MARKET_LABEL[m].en}
        </button>
      ))}
    </div>
  );
}
