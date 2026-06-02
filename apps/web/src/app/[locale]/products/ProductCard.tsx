"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { formatPrice } from "@/lib/format";
import { localizedName } from "@/lib/i18n-helpers";
import { AddToBoxButton } from "@/components/AddToBoxButton";
import type { Product } from "@/lib/api";
import type { Locale } from "@/i18n/routing";

export function ProductCard({ product: p, minCents = 0 }: { product: Product; minCents?: number }) {
  const t = useTranslations("Products");
  const locale = useLocale() as Locale;
  const name = localizedName(p, locale);

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <Link href={`/products/${p.slug}`} className="block aspect-square shrink-0 overflow-hidden bg-slate-100">
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
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <Link
          href={`/products/${p.slug}`}
          className="line-clamp-2 text-sm font-medium leading-snug text-slate-800 hover:text-blue-600"
        >
          {name}
        </Link>
        <p className="mt-1 text-base font-bold text-blue-600">{formatPrice(p.priceCents, p.currency)}</p>
        {p.stock <= 0 ? (
          <p className="mt-auto pt-2 text-xs text-red-500">{t("outOfStock")}</p>
        ) : (
          <AddToBoxButton
            product={p}
            minCents={minCents}
            className="mt-auto block w-full rounded-lg bg-blue-600 py-1.5 text-center text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          />
        )}
      </div>
    </div>
  );
}
