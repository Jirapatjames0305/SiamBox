"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { addCustomToCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { localizedName } from "@/lib/i18n-helpers";
import type { Product } from "@/lib/api";
import type { Locale } from "@/i18n/routing";

type Selection = Record<string, number>;

export function BuildClient({ products, minCents }: { products: Product[]; minCents: number }) {
  const t = useTranslations("Build");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [selection, setSelection] = useState<Selection>({});
  const [added, setAdded] = useState(false);

  const items = useMemo(
    () =>
      Object.entries(selection)
        .filter(([, q]) => q > 0)
        .map(([productId, quantity]) => {
          const product = products.find((p) => p.id === productId)!;
          return { product, quantity };
        }),
    [selection, products],
  );

  const subtotalCents = items.reduce((sum, it) => sum + it.product.priceCents * it.quantity, 0);
  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);
  const belowMin = subtotalCents < minCents;
  const canAdd = items.length > 0 && !belowMin;

  function inc(productId: string) {
    setSelection((s) => ({ ...s, [productId]: (s[productId] ?? 0) + 1 }));
  }
  function dec(productId: string) {
    setSelection((s) => {
      const next = { ...s };
      const current = next[productId] ?? 0;
      if (current <= 1) delete next[productId];
      else next[productId] = current - 1;
      return next;
    });
  }

  function handleAdd() {
    addCustomToCart({
      priceCents: subtotalCents,
      products: items.map(({ product, quantity }) => ({
        productId: product.id,
        quantity,
        nameTh: product.nameTh,
        nameZh: product.nameZh,
        priceCents: product.priceCents,
        image: product.images[0],
      })),
    });
    setAdded(true);
    setTimeout(() => router.push("/cart"), 600);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Product grid */}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.map((p) => {
            const name = localizedName(p, locale);
            const qty = selection[p.id] ?? 0;
            return (
              <li
                key={p.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="aspect-square overflow-hidden bg-slate-100">
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-slate-100" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-slate-800 line-clamp-2 leading-snug">{name}</p>
                  <p className="mt-1 text-sm font-bold text-blue-600">
                    {formatPrice(p.priceCents, p.currency)}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    {qty === 0 ? (
                      <button
                        type="button"
                        onClick={() => inc(p.id)}
                        className="w-full rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                      >
                        {t("add")}
                      </button>
                    ) : (
                      <div className="flex w-full items-center justify-between rounded-lg border border-slate-300">
                        <button
                          type="button"
                          onClick={() => dec(p.id)}
                          className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50"
                        >
                          −
                        </button>
                        <span className="text-sm font-semibold text-slate-900">{qty}</span>
                        <button
                          type="button"
                          onClick={() => inc(p.id)}
                          className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Summary panel */}
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
          <h2 className="text-base font-bold text-slate-900">{t("yourPackage")}</h2>

          {items.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">{t("emptySelection")}</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {items.map(({ product, quantity }) => (
                <li key={product.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-slate-700">
                    {localizedName(product, locale)}
                  </span>
                  <span className="whitespace-nowrap text-xs text-slate-500">× {quantity}</span>
                  <span className="whitespace-nowrap text-sm font-medium text-slate-900">
                    {formatPrice(product.priceCents * quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="my-4 border-t border-slate-200" />

          <div className="flex justify-between text-sm">
            <span className="text-slate-500">{t("itemCount")}</span>
            <span className="font-medium">{itemCount}</span>
          </div>
          <div className="mt-2 flex justify-between font-bold">
            <span>{t("total")}</span>
            <span className="text-blue-600">{formatPrice(subtotalCents)}</span>
          </div>

          {minCents > 0 && (
            <div className="mt-3 text-xs">
              {belowMin ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-amber-800">
                  {t("belowMin", { min: formatPrice(minCents) })}
                </p>
              ) : (
                <p className="text-emerald-700">{t("minOk", { min: formatPrice(minCents) })}</p>
              )}
            </div>
          )}

          <button
            type="button"
            disabled={!canAdd || added}
            onClick={handleAdd}
            className={`mt-5 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
              added
                ? "bg-emerald-600 text-white"
                : canAdd
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "cursor-not-allowed bg-slate-200 text-slate-400"
            }`}
          >
            {added ? t("added") : t("addToCart")}
          </button>
        </aside>
      </div>
    </main>
  );
}
