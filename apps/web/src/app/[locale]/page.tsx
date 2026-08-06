import { getTranslations, setRequestLocale } from "next-intl/server";
import { Price } from "@/components/CurrencyProvider";
import { Link } from "@/i18n/routing";
import { getBuildConfig, listBestSellers, listProducts, listReviews, type Product, type Review } from "@/lib/api";
import { TrackLookupInline } from "@/components/TrackLookupInline";
import { localizedName } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";
import { alternatesFor } from "@/lib/seo";
import { FadeInUp } from "@/components/FadeInUp";
import { AddToBoxButton } from "@/components/AddToBoxButton";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { alternates: alternatesFor("", locale as Locale) };
}

// Outline SVG icons (Heroicons stroke style, viewBox 24×24)
const BADGE_ICONS = [
  <svg key="shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>,
  <svg key="truck" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>,
  <svg key="trophy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"/></svg>,
  <svg key="chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg>,
];

// Order matches the `stats` array in messages/*.json: products, brands, categories,
// authenticity, delivery window.
const STAT_ICONS = [
  <svg key="box" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/></svg>,
  <svg key="tag" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path d="M6 6h.008v.008H6V6z"/></svg>,
  <svg key="grid" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg>,
  <svg key="shield3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>,
  <svg key="truck2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>,
];

// "How it works" — pick, we buy, we ship, you track.
const HOW_ICONS = [
  <svg key="cart" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>,
  <svg key="store" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><path d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72l1.189-1.19A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 18h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z"/></svg>,
  <svg key="plane" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>,
  <svg key="pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>,
];

const WHY_ICONS = [
  <svg key="shield2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>,
  <svg key="map" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>,
  <svg key="pkg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><path d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/></svg>,
  <svg key="headphone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><path d="M19.114 5.636a9 9 0 010 12.728M14.463 8.287a5.25 5.25 0 000 7.426M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"/></svg>,
  <svg key="card" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg>,
];

const DIAMOND_SVG = <svg viewBox="0 0 12 12" fill="currentColor" className="inline h-[0.8em] w-[0.8em]" aria-hidden="true"><polygon points="6,0 12,6 6,12 0,6"/></svg>;

function Stars({ rating = 5 }: { rating?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 20 20" fill="currentColor" className={`h-[1em] w-[1em] ${i < rating ? "" : "opacity-25"}`} aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </span>
  );
}
const BRANDS = ["DOI KHAM", "NaRaya", "ABHAIBHUBEJHR", "THIPNIYOM", "MISTINE", "SRICHAND"];

type Card = { title: string; sub: string };
type Stat = { value: string; label: string };

/**
 * Product / brand / category counts for the stats bar, as display strings.
 * Counts are rounded *down* to the nearest ten so the bar never overstates the
 * catalogue. Returns `[null, null, null]` when the API gave us nothing.
 *
 * Brand is approximated from the first tag. The convention is brand-first, but it isn't
 * enforced: plenty of rows lead with the Chinese product name instead. Those are dropped
 * (CJK, or too long to be a brand) and the survivors rounded down, so the figure lands
 * under the true brand count rather than over it.
 */
const CJK = /[　-鿿＀-￯]/;

function countCatalog(products: Product[]): (string | null)[] {
  if (products.length === 0) return [null, null, null];
  const floor10 = (n: number) => `${Math.max(10, Math.floor(n / 10) * 10)}+`;
  const brands = new Set(
    products
      .map((p) => p.tags[0]?.trim())
      .filter((b): b is string => !!b && b.length <= 20 && !CJK.test(b))
      .map((b) => b.toLowerCase()),
  );
  const categories = new Set(products.map((p) => p.category).filter(Boolean));
  return [floor10(products.length), floor10(brands.size), String(categories.size)];
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tProducts = await getTranslations("Products");

  // /api/products already comes back newest-first, so it doubles as the new-arrivals feed
  // and as the source for the catalogue counts in the stats bar.
  let products: Product[] = [];
  try {
    products = await listProducts();
  } catch {
    // skip if API down
  }

  let bestSellers: Product[] = [];
  try {
    bestSellers = await listBestSellers();
    if (bestSellers.length === 0) {
      // Fallback: if admin hasn't curated any, show the latest products.
      bestSellers = products.slice(0, 6);
    } else if (bestSellers.length > 6) {
      // More than 6 curated → show a random 6 (rotates each revalidation).
      bestSellers = [...bestSellers].sort(() => Math.random() - 0.5).slice(0, 6);
    }
  } catch {
    // skip if API down
  }

  // Don't show the same product twice on one page.
  const shown = new Set(bestSellers.map((p) => p.id));
  const newArrivals = products.filter((p) => !shown.has(p.id)).slice(0, 6);

  let heroBg = "";
  let storiesBg = "";
  let brandsBg = "";
  let partnerBg = "";
  let minCents = 0;
  let limitEnabled = true;
  try {
    const cfg = await getBuildConfig();
    heroBg = cfg.heroBgUrl;
    storiesBg = cfg.storiesBgUrl;
    brandsBg = cfg.brandsBgUrl;
    partnerBg = cfg.partnerBgUrl;
    minCents = cfg.customPackageMinCents;
    limitEnabled = cfg.purchaseLimitEnabled;
  } catch {
    // skip if API down
  }

  let reviews: Review[] = [];
  try {
    reviews = await listReviews();
  } catch {
    // skip if API down
  }

  const badges = t.raw("badges") as Card[];
  const stats = t.raw("stats") as Stat[];
  const why = t.raw("why") as Card[];
  const how = t.raw("howSteps") as Card[];

  // The first three stats are counted off the live catalogue rather than hardcoded, so
  // the bar can't drift into claiming more than the shop actually carries. Falls back to
  // the translated value when the API is down and `products` is empty.
  const counted = countCatalog(products);
  const statValue = (s: Stat, i: number) => counted[i] ?? s.value;

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-cream-100 to-cream-50">
        {heroBg && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-cream-50/5 via-cream-50/15 to-cream-50/50 sm:bg-none sm:bg-cream-50/10" />
          </>
        )}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold-300/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 sm:py-16 lg:grid-cols-2 lg:py-24">
          <div className="min-w-0 text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 text-gold-500 sm:justify-start sm:gap-3">
              <span className="h-px w-6 bg-gold-400/70 sm:w-8" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] sm:text-xs sm:tracking-[0.3em]">{t("eyebrow")}</span>
            </div>
            <h1 className="mt-4 font-serif text-xl font-bold leading-[1.25] text-maroon-800 sm:mt-5 sm:text-5xl sm:leading-[1.1] lg:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-base text-stone-500 sm:mx-0 sm:mt-5 sm:max-w-md sm:text-lg">{t("heroTagline")}</p>

            <div className="mt-6 grid grid-cols-4 gap-2 sm:mt-8 sm:gap-4">
              {badges.map((b, i) => (
                <div key={b.title} className="text-center">
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-gold-400/30 bg-white text-sm shadow-sm sm:h-10 sm:w-10 sm:text-lg">
                    {BADGE_ICONS[i]}
                  </div>
                  <p className="mt-1 text-[10px] font-semibold text-maroon-800 sm:mt-1.5 sm:text-xs">{b.title}</p>
                  <p className="hidden text-[9px] text-stone-400 sm:block sm:text-[10px]">{b.sub}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3 sm:mt-9 sm:justify-start">
              <Link
                href="/products"
                className="rounded-md bg-maroon-700 px-7 py-3 text-sm font-semibold text-cream-100 shadow-sm transition hover:bg-maroon-600"
              >
                {t("shopNow")} →
              </Link>
              {/* <Link
                href="/build"
                className="rounded-md border border-maroon-300/30 px-7 py-3 text-sm font-semibold text-maroon-700 transition hover:bg-maroon-50"
              >
                {t("discover")} →
              </Link> */}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-maroon-900 text-cream-100">
        <div className="mx-auto grid max-w-6xl grid-cols-5 gap-x-1 gap-y-0 px-2 py-6 sm:gap-x-0 sm:gap-y-8 sm:px-4 sm:py-10 sm:grid-cols-3 lg:grid-cols-5 lg:gap-0 lg:divide-x lg:divide-gold-500/15">
          {stats.map((s, i) => (
            <div key={s.label} className="flex flex-col items-center px-1 text-center sm:px-2 lg:px-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-500/40 bg-maroon-950/40 text-sm sm:h-12 sm:w-12 sm:text-xl">
                {STAT_ICONS[i]}
              </div>
              <div className="mt-1.5 font-serif text-sm font-bold leading-none text-gold-400 sm:mt-2.5 sm:text-xl">
                {statValue(s, i)}
              </div>
              <div className="mt-1 text-[9px] leading-tight text-cream-200/75 sm:mt-1.5 sm:text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why choose ── */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading title={t("whyTitle")} />
          <div className="mt-10 grid gap-4 grid-cols-2 lg:grid-cols-5">
            {why.map((w, i) => (
              <FadeInUp key={w.title} delay={i * 60}>
                <div className="h-full rounded-xl border border-cream-300 bg-white p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream-100 text-2xl">
                    {WHY_ICONS[i]}
                  </div>
                  <h3 className="mt-4 font-semibold text-maroon-900">{w.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-500">{w.sub}</p>
                </div>
              </FadeInUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Best sellers ── */}
      {bestSellers.length > 0 && (
        <section className="bg-cream-100 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex items-end justify-between">
              <SectionHeading title={t("bestSellers")} align="left" />
              <Link
                href="/products"
                className="shrink-0 rounded-md border border-gold-500 px-4 py-2 text-xs font-semibold text-maroon-800 transition hover:bg-gold-500 hover:text-maroon-950"
              >
                {t("viewAll")}
              </Link>
            </div>
            <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {bestSellers.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  index={i}
                  locale={locale as Locale}
                  badge="Best Seller"
                  badgeClass="bg-maroon-700 text-cream-100"
                  limitEnabled={limitEnabled}
                  minCents={minCents}
                  limitLabel={(max) => tProducts("limitBadge", { max })}
                  outOfStockLabel={tProducts("outOfStock")}
                />
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── New arrivals ── */}
      {newArrivals.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex items-end justify-between">
              <SectionHeading title={t("newArrivals")} align="left" />
              <Link
                href="/products"
                className="shrink-0 rounded-md border border-gold-500 px-4 py-2 text-xs font-semibold text-maroon-800 transition hover:bg-gold-500 hover:text-maroon-950"
              >
                {t("viewAll")}
              </Link>
            </div>
            <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {newArrivals.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  index={i}
                  locale={locale as Locale}
                  badge={t("newBadge")}
                  badgeClass="bg-gold-500 text-maroon-950"
                  limitEnabled={limitEnabled}
                  minCents={minCents}
                  limitLabel={(max) => tProducts("limitBadge", { max })}
                  outOfStockLabel={tProducts("outOfStock")}
                />
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── How it works + track ── */}
      <section className="bg-maroon-950 py-16 text-cream-100">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-center gap-4">
            <span className="h-px w-10 bg-gold-400" />
            <h2 className="font-serif text-2xl font-bold tracking-tight text-cream-100 sm:text-3xl">{t("howTitle")}</h2>
            <span className="h-px w-10 bg-gold-400" />
          </div>

          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {how.map((step, i) => (
              <li key={step.title} className="flex">
                <FadeInUp delay={i * 70} className="h-full w-full">
                  <div className="relative h-full rounded-xl border border-gold-500/20 bg-maroon-900/50 p-6">
                    <span
                      aria-hidden="true"
                      className="absolute right-4 top-3 font-serif text-4xl font-bold leading-none text-gold-500/20"
                    >
                      {i + 1}
                    </span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold-500/40 bg-maroon-950/60 text-gold-400">
                      {HOW_ICONS[i]}
                    </div>
                    <h3 className="mt-4 font-semibold text-cream-100">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-cream-200/70">{step.sub}</p>
                  </div>
                </FadeInUp>
              </li>
            ))}
          </ol>

          <div className="mx-auto mt-10 max-w-xl rounded-xl border border-gold-500/20 bg-maroon-900/50 p-6 text-center">
            <h3 className="font-serif text-lg font-bold text-gold-400">{t("howTrackTitle")}</h3>
            <p className="mt-1 text-xs text-cream-200/60">{t("howTrackHint")}</p>
            <div className="mt-4 text-left">
              <TrackLookupInline />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stories | Brands | Partner — full-bleed banner ── */}
      <section className="grid min-h-[220px] grid-cols-1 lg:grid-cols-3">
        {/* Thailand Stories */}
        <div className="grain relative flex flex-col justify-between overflow-hidden bg-maroon-950 px-8 py-10 text-cream-100">
          {storiesBg && <img src={storiesBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-maroon-950/80 via-maroon-900/80 to-transparent sm:from-maroon-950/10 sm:via-maroon-900/10" />
          <div className="relative">
            <h3 className="font-serif text-2xl font-bold uppercase tracking-wide text-gold-400">{t("storiesTitle")}</h3>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream-200/80">{t("storiesText")}</p>
          </div>
          <div className="relative mt-8">
            <Link
              href="/products"
              className="inline-block rounded-md border border-gold-400/70 px-6 py-2 text-xs font-bold uppercase tracking-widest text-gold-300 transition hover:bg-gold-500 hover:text-maroon-950"
            >
              {t("storiesCta")}
            </Link>
          </div>
        </div>

        {/* 500+ Brands — center column */}
        <div className="relative flex flex-col items-center justify-center overflow-hidden bg-maroon-900 px-10 py-10 text-center">
          {brandsBg && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brandsBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
            </>
          )}
          <div className="relative">
            <div className="font-serif text-5xl font-extrabold leading-none text-gold-400">{counted[1] ?? "60+"}</div>
            <div className="mt-1 text-sm font-bold uppercase tracking-[0.3em] text-cream-200">{t("brandsTitle")}</div>
            <div className="mt-1 text-xs text-cream-300/60">{t("brandsSubtitle")}</div>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {BRANDS.map((b) => (
                <span
                  key={b}
                  className="rounded-sm border border-cream-200/20 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-cream-100"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Become Our Partner */}
        <div className="grain relative flex flex-col justify-between overflow-hidden bg-stone-900 px-8 py-10 text-cream-100">
          {partnerBg && <img src={partnerBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-stone-950/80 via-stone-900/80 to-transparent sm:from-stone-950/10 sm:via-stone-900/10" />
          <div className="relative">
            <h3 className="font-serif text-2xl font-bold uppercase tracking-wide text-gold-400">{t("partnerTitle")}</h3>
            <p className="mt-1 text-xs text-cream-300/70">{t("partnerText")}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-cream-200/80">
              <li>• {t("partnerPoint1")}</li>
              <li>• {t("partnerPoint2")}</li>
              <li>• {t("partnerPoint3")}</li>
            </ul>
          </div>
          <div className="relative mt-8">
            <Link
              href="/partner"
              className="inline-block rounded-md border border-gold-400/70 px-6 py-2 text-xs font-bold uppercase tracking-widest text-gold-300 transition hover:bg-gold-500 hover:text-maroon-950"
            >
              {t("partnerCta")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading title={t("reviewsTitle")} />
          {reviews.length > 0 ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-cream-300 bg-white p-5 shadow-sm">
                  <div className="text-sm text-gold-500"><Stars rating={r.rating} /></div>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{r.comment}</p>
                  <div className="mt-4 border-t border-cream-200 pt-3">
                    <p className="text-sm font-semibold text-maroon-900">{r.authorName}</p>
                    {r.location && <p className="text-xs text-stone-400">{r.location}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-xl border border-dashed border-cream-300 bg-white/50 p-12 text-center text-sm text-stone-400">
              {t("noReviews")}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

/** Shared by the best-sellers and new-arrivals grids — same card, different badge. */
function ProductCard({
  product: p,
  index,
  locale,
  badge,
  badgeClass,
  limitEnabled,
  minCents,
  limitLabel,
  outOfStockLabel,
}: {
  product: Product;
  index: number;
  locale: Locale;
  badge: string;
  badgeClass: string;
  limitEnabled: boolean;
  minCents: number;
  limitLabel: (max: number) => string;
  outOfStockLabel: string;
}) {
  const name = localizedName(p, locale);
  const href = `/products/${p.slug}` as const;
  return (
    <li className="flex">
      <FadeInUp delay={index * 50} className="h-full w-full">
        <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-cream-300 bg-white shadow-sm transition hover:shadow-lg">
          <span
            className={`absolute left-0 top-0 z-10 rounded-br-lg px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${badgeClass}`}
          >
            {badge}
          </span>
          <Link href={href} className="block aspect-square overflow-hidden bg-cream-100">
            {p.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.images[0]}
                alt={name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-3xl text-cream-300">{DIAMOND_SVG}</div>
            )}
          </Link>
          <div className="flex flex-1 flex-col p-3">
            <Link
              href={href}
              className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-stone-800 hover:text-maroon-800"
            >
              {name}
            </Link>
            <div className="mt-1 text-xs text-gold-500"><Stars /></div>
            <p className="mt-1 font-bold text-maroon-800">{<Price cents={p.priceCents} />}</p>
            {limitEnabled && p.maxQtyPerOrder != null && (
              <p className="mt-0.5 text-[11px] font-medium text-amber-600">
                * {limitLabel(p.maxQtyPerOrder)}
              </p>
            )}
            {p.stock <= 0 ? (
              <p className="mt-auto pt-1.5 text-center text-xs text-red-500">{outOfStockLabel}</p>
            ) : (
              <AddToBoxButton
                limitEnabled={limitEnabled}
                product={p}
                minCents={minCents}
                className="mt-auto block w-full rounded-md bg-maroon-800 py-1.5 text-center text-xs font-semibold text-cream-100 transition hover:bg-maroon-700"
              />
            )}
          </div>
        </div>
      </FadeInUp>
    </li>
  );
}

function SectionHeading({ title, align = "center" }: { title: string; align?: "center" | "left" }) {
  if (align === "left") {
    return (
      <h2 className="font-serif text-2xl font-bold tracking-tight text-maroon-900 sm:text-3xl">{title}</h2>
    );
  }
  return (
    <div className="flex items-center justify-center gap-4">
      <span className="h-px w-10 bg-gold-400" />
      <h2 className="font-serif text-2xl font-bold tracking-tight text-maroon-900 sm:text-3xl">{title}</h2>
      <span className="h-px w-10 bg-gold-400" />
    </div>
  );
}
