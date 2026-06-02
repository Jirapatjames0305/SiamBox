"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FadeInUp } from "@/components/FadeInUp";
import type { Product } from "@/lib/api";
import type { Locale } from "@/i18n/routing";
import { ProductCard } from "./ProductCard";

const OTHER = "__other__";

export function ProductSearch({
  products,
  minCents,
  initialQuery = "",
  children,
}: {
  products: Product[];
  minCents: number;
  initialQuery?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("Products");
  const tCat = useTranslations("Categories");
  const locale = useLocale() as Locale;
  const [query, setQuery] = useState(initialQuery);

  const q = query.trim().toLowerCase();
  const catLabel = (c: string | null) => {
    if (!c) return tCat.has(OTHER) ? tCat(OTHER) : "";
    return tCat.has(c) ? tCat(c) : c;
  };
  const results = q
    ? products.filter((p) =>
        [p.nameTh, p.nameZh, p.nameEn, p.sku, p.category, catLabel(p.category), ...p.tags]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    : [];

  return (
    <>
      <div className="relative mb-8">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500"
        />
      </div>

      {q ? (
        <div>
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">{t("searchResults", { q: query })}</h2>
            {results.length > 0 && (
              <span className="text-sm text-slate-500">{t("productsCount", { count: results.length })}</span>
            )}
          </div>
          {results.length === 0 ? (
            <p className="py-16 text-center text-slate-400">{t("noResults", { q: query })}</p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {results.map((p, i) => (
                <li key={p.id} className="h-full">
                  <FadeInUp delay={i * 40} className="h-full">
                    <ProductCard product={p} minCents={minCents} />
                  </FadeInUp>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        children
      )}
    </>
  );
}
