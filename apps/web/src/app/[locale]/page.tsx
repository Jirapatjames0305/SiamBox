import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getBuildConfig, listProducts, listReviews, type Review } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { localizedName } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";
import { FadeInUp } from "@/components/FadeInUp";
import { AddToBoxButton } from "@/components/AddToBoxButton";

// Outline SVG icons (Heroicons stroke style, viewBox 24×24)
const BADGE_ICONS = [
  <svg key="shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>,
  <svg key="truck" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>,
  <svg key="trophy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"/></svg>,
  <svg key="chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg>,
];

const STAT_ICONS = [
  <svg key="users" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>,
  <svg key="tag" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path d="M6 6h.008v.008H6V6z"/></svg>,
  <svg key="box" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/></svg>,
  <svg key="globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/></svg>,
  <svg key="truck2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>,
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

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tProducts = await getTranslations("Products");

  let bestSellers: Awaited<ReturnType<typeof listProducts>> = [];
  try {
    bestSellers = (await listProducts()).slice(0, 6);
  } catch {
    // skip if API down
  }

  let heroBg = "";
  let storiesBg = "";
  let brandsBg = "";
  let partnerBg = "";
  let minCents = 0;
  try {
    const cfg = await getBuildConfig();
    heroBg = cfg.heroBgUrl;
    storiesBg = cfg.storiesBgUrl;
    brandsBg = cfg.brandsBgUrl;
    partnerBg = cfg.partnerBgUrl;
    minCents = cfg.customPackageMinCents;
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

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-cream-100 to-cream-50">
        {heroBg && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-cream-50/80" />
          </>
        )}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold-300/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <div className="flex items-center gap-3 text-gold-600">
              <span className="h-px w-8 bg-gold-500" />
              <span className="text-xs font-semibold uppercase tracking-[0.3em]">{t("eyebrow")}</span>
            </div>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-[1.1] text-maroon-900 sm:text-5xl lg:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-5 max-w-md text-lg text-stone-600">{t("heroTagline")}</p>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {badges.map((b, i) => (
                <div key={b.title} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold-400/50 bg-white text-xl shadow-sm">
                    {BADGE_ICONS[i]}
                  </div>
                  <p className="mt-2 text-xs font-semibold text-maroon-900">{b.title}</p>
                  <p className="text-[11px] text-stone-500">{b.sub}</p>
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="rounded-md bg-maroon-800 px-7 py-3 text-sm font-semibold text-cream-100 shadow-md transition hover:bg-maroon-700"
              >
                {t("shopNow")} →
              </Link>
              <Link
                href="/build"
                className="rounded-md border border-maroon-300/40 px-7 py-3 text-sm font-semibold text-maroon-800 transition hover:bg-maroon-50"
              >
                {t("discover")} →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-maroon-900 text-cream-100">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-4 py-10 sm:grid-cols-3 lg:grid-cols-5 lg:gap-0 lg:divide-x lg:divide-gold-500/15">
          {stats.map((s, i) => (
            <div key={s.label} className="flex flex-col items-center px-2 text-center lg:px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold-500/40 bg-maroon-950/40 text-xl">
                {STAT_ICONS[i]}
              </div>
              {/* <div className="mt-2.5 font-serif text-2xl font-bold text-gold-400 sm:text-3xl">{s.value}</div> */}
              <div className="mt-2.5 text-xs text-cream-200/75">{s.label}</div>
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
              {bestSellers.map((p, i) => {
                const name = localizedName(p, locale as Locale);
                return (
                  <li key={p.id} className="flex">
                    <FadeInUp delay={i * 50} className="h-full w-full">
                      <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-cream-300 bg-white shadow-sm transition hover:shadow-lg">
                        <span className="absolute left-0 top-0 z-10 rounded-br-lg bg-maroon-700 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-cream-100">
                          Best Seller
                        </span>
                        <Link href="/products" className="block aspect-square overflow-hidden bg-cream-100">
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
                            href="/products"
                            className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-stone-800 hover:text-maroon-800"
                          >
                            {name}
                          </Link>
                          <div className="mt-1 text-xs text-gold-500"><Stars /></div>
                          <p className="mt-1 font-bold text-maroon-800">{formatPrice(p.priceCents, p.currency)}</p>
                          {p.stock <= 0 ? (
                            <p className="mt-auto pt-1.5 text-center text-xs text-red-500">{tProducts("outOfStock")}</p>
                          ) : (
                            <AddToBoxButton
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
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ── Stories | Brands | Partner — full-bleed banner ── */}
      <section className="grid min-h-[220px] grid-cols-1 lg:grid-cols-3">
        {/* Thailand Stories */}
        <div className="grain relative flex flex-col justify-between overflow-hidden bg-maroon-950 px-8 py-10 text-cream-100">
          {storiesBg && <img src={storiesBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-maroon-950/95 via-maroon-900/80 to-transparent" />
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
              <img src={brandsBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
            </>
          )}
          <div className="relative">
            <div className="font-serif text-5xl font-extrabold leading-none text-gold-400">500+</div>
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
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-stone-950/95 via-stone-900/80 to-transparent" />
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
