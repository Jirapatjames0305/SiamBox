import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { listPackages } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { localizedName } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";
import { FadeInUp } from "@/components/FadeInUp";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Products" });
  return { title: `${t("title")} · SiamBox` };
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Products");

  let packages = [] as Awaited<ReturnType<typeof listPackages>>;
  let error: string | null = null;
  try {
    packages = await listPackages();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed";
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <FadeInUp>
        <div className="flex items-baseline justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("title")}</h1>
          {packages.length > 0 && (
            <span className="text-sm text-slate-500">{t("productsCount", { count: packages.length })}</span>
          )}
        </div>
      </FadeInUp>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {t("errorLoading")} · {error}
        </div>
      )}

      {!error && packages.length === 0 && (
        <div className="mt-16 text-center">
          <p className="text-slate-400">{t("noProducts")}</p>
        </div>
      )}

      <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {packages.map((p, i) => {
          const name = localizedName(p, locale as Locale);
          const itemCount = p.items.reduce((sum, it) => sum + it.quantity, 0);
          return (
            <li key={p.id} className="h-full">
              <FadeInUp delay={i * 50} className="h-full">
                <Link
                  href={`/products/${p.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm transition hover:shadow-md hover:border-blue-200"
                >
                  <div className="aspect-square shrink-0 overflow-hidden bg-slate-100">
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0]}
                        alt={name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-300">
                        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        <span className="text-xs">{t("noImage")}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <p className="text-sm font-medium text-slate-800 line-clamp-2 leading-snug">{name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{itemCount} ชิ้น</p>
                    <div className="mt-auto pt-2 flex items-center justify-between">
                      <p className="text-base font-bold text-blue-600">
                        {formatPrice(p.priceCents, p.currency)}
                      </p>
                    </div>
                  </div>
                </Link>
              </FadeInUp>
            </li>
          );
        })}
        <li className="h-full">
          <FadeInUp delay={packages.length * 50} className="h-full">
            <Link
              href="/build"
              className="group flex h-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-blue-400 hover:bg-blue-50/40"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 transition group-hover:border-blue-300 group-hover:text-blue-600">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700">
                  {t("buildOwnTitle")}
                </p>
                <p className="mt-1 text-xs text-slate-500">{t("buildOwnSubtitle")}</p>
              </div>
            </Link>
          </FadeInUp>
        </li>
      </ul>
    </main>
  );
}
