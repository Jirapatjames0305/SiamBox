import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { listPackages } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { localizedName } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";
import { FadeInUp } from "@/components/FadeInUp";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");

  let featured: Awaited<ReturnType<typeof listPackages>> = [];
  try {
    const all = await listPackages();
    featured = all.slice(0, 4);
  } catch {
    // silently skip if API is down
  }

  return (
    <>
      {/* ── Cinematic Hero (dark) ── */}
      <section className="grain relative flex min-h-[92vh] items-center justify-center overflow-hidden bg-slate-950">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 left-1/2 h-[55vh] w-[90vw] max-w-3xl -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(37,99,235,0.28)_0%,transparent_70%)]" />
          <div className="absolute -top-40 right-[-10%] h-[500px] w-[500px] bg-[radial-gradient(ellipse,rgba(37,99,235,0.07)_0%,transparent_70%)]" />
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,#fff 2px,#fff 3px)", backgroundSize: "100% 3px" }}
        />

        <div className="relative z-10 px-4 text-center">
          <p className="animate-fade-up delay-1 mb-6 text-[10px] font-semibold uppercase tracking-[0.45em] text-blue-400/80">
            {t("eyebrow")}
          </p>
          <h1 className="animate-fade-up delay-2 text-[clamp(4.5rem,14vw,10rem)] font-black leading-none tracking-tighter text-white">
            Siam<span className="text-blue-500">Box</span>
          </h1>
          <p className="animate-fade-up delay-3 mx-auto mt-6 max-w-md text-base leading-relaxed text-slate-400 sm:text-lg">
            {t("tagline")}
          </p>
          <p className="animate-fade-up delay-3 mt-1 text-xs text-slate-600">
            {t("subtitle")}
          </p>
          <div className="animate-fade-up delay-4 mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/products"
              className="rounded-full bg-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-[0_0_40px_rgba(37,99,235,0.4)] transition hover:bg-blue-500 hover:shadow-[0_0_60px_rgba(37,99,235,0.55)]"
            >
              {t("browse")}
            </Link>
            <Link
              href="/track"
              className="rounded-full border border-white/15 px-8 py-3.5 text-sm font-medium text-slate-300 transition hover:border-white/30 hover:text-white"
            >
              {t("trackOrder")}
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </section>

      {/* ── Trust badges (white) ── */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-5xl grid-cols-3 divide-x divide-slate-200 px-4">
          {[
            { icon: <ShipIcon />, title: t("badge1Title"), sub: t("badge1Sub") },
            { icon: <ShieldIcon />, title: t("badge2Title"), sub: t("badge2Sub") },
            { icon: <TrackIcon />, title: t("badge3Title"), sub: t("badge3Sub") },
          ].map((b) => (
            <FadeInUp key={b.title}>
              <div className="py-6 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  {b.icon}
                </div>
                <p className="text-xs font-semibold text-slate-800">{b.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{b.sub}</p>
              </div>
            </FadeInUp>
          ))}
        </div>
      </section>

      {/* ── Featured products (light) ── */}
      {featured.length > 0 && (
        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <FadeInUp>
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t("featured")}</h2>
                <Link href="/products" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  {t("viewAll")} &rarr;
                </Link>
              </div>
            </FadeInUp>

            <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {featured.map((p, i) => {
                const name = localizedName(p, locale as Locale);
                return (
                  <li key={p.id}>
                    <FadeInUp delay={i * 80}>
                      <Link
                        href={`/products/${p.slug}`}
                        className="group block overflow-hidden rounded-xl bg-white shadow-sm border border-slate-200 transition hover:shadow-md hover:border-blue-200"
                      >
                        <div className="aspect-square overflow-hidden bg-slate-100">
                          {p.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.images[0]}
                              alt={name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-slate-300">
                              <BoxIcon />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-medium text-slate-800 line-clamp-2 leading-snug">{name}</p>
                          <p className="mt-1.5 text-sm font-bold text-blue-600">
                            {formatPrice(p.priceCents, p.currency)}
                          </p>
                        </div>
                      </Link>
                    </FadeInUp>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ── Bottom CTA (dark) ── */}
      <section className="relative overflow-hidden bg-slate-950 py-20 text-center">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-72 w-[600px] bg-[radial-gradient(ellipse,rgba(37,99,235,0.18)_0%,transparent_70%)]" />
        </div>
        <FadeInUp>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-blue-400/70">{t("ctaEyebrow")}</p>
          <p className="mx-auto mt-4 max-w-sm text-2xl font-bold text-white">
            {t("ctaTitle")}
          </p>
          <Link
            href="/products"
            className="mt-7 inline-block rounded-full bg-blue-600 px-9 py-3.5 text-sm font-bold text-white shadow-[0_0_40px_rgba(37,99,235,0.3)] transition hover:bg-blue-500"
          >
            {t("browse")}
          </Link>
        </FadeInUp>
      </section>
    </>
  );
}

function ShipIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}
function TrackIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}
function BoxIcon() {
  return (
    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}
