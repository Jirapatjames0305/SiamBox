"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  cartLineName,
  cartTotalCents,
  removeCustomProduct,
  removeFromCart,
  setCustomProductQty,
  updateQuantity,
  useCart,
  useCartHydrated,
} from "@/lib/cart";
import { getBuildConfig } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { localizedName } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";

export default function CartPage() {
  const t = useTranslations("Cart");
  const locale = useLocale() as Locale;
  const cart = useCart();
  const hydrated = useCartHydrated();
  const [minCents, setMinCents] = useState(0);

  useEffect(() => {
    getBuildConfig()
      .then((c) => setMinCents(c.customPackageMinCents))
      .catch(() => {});
  }, []);

  if (!hydrated) {
    return <main className="mx-auto max-w-4xl px-4 py-10" />;
  }

  const empty = cart.lines.length === 0;
  const total = cartTotalCents(cart);
  const hasCustom = cart.lines.some((l) => l.kind === "custom");
  const customBelowMin = minCents > 0 && cart.lines.some((l) => l.kind === "custom" && l.priceCents < minCents);
  const canCheckout = !empty && !customBelowMin;

  // Flatten each custom package into individual product rows; pre-made packages stay one row.
  const rows = cart.lines.flatMap((line) => {
    if (line.kind === "custom") {
      return line.products.map((p) => ({
        key: `${line.lineId}:${p.productId}`,
        image: p.image,
        name: localizedName(p, locale),
        href: null as string | null,
        addons: null as null,
        unitPriceCents: p.priceCents,
        quantity: p.quantity,
        onDec: () => setCustomProductQty(line.lineId, p.productId, p.quantity - 1),
        onInc: () => setCustomProductQty(line.lineId, p.productId, p.quantity + 1),
        onRemove: () => removeCustomProduct(line.lineId, p.productId),
      }));
    }
    return [
      {
        key: line.lineId,
        image: line.image,
        name: cartLineName(line, locale),
        href: `/products/${line.slug}` as string | null,
        addons: line.addons && line.addons.length > 0 ? line.addons : null,
        unitPriceCents: line.priceCents,
        quantity: line.quantity,
        onDec: () => updateQuantity(line.lineId, line.quantity - 1),
        onInc: () => updateQuantity(line.lineId, line.quantity + 1),
        onRemove: () => removeFromCart(line.lineId),
      },
    ];
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("title")}</h1>

      {empty ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <svg className="h-16 w-16 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="mt-4 text-slate-500">{t("empty")}</p>
          <Link
            href="/products"
            className="mt-5 inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            {t("browseProducts")}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Items — every product on its own row */}
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.key} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {row.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.image} alt={row.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-slate-100" />
                  )}
                </div>
                <div className="flex flex-1 flex-col min-w-0">
                  {row.href ? (
                    <Link
                      href={row.href}
                      className="text-sm font-semibold text-slate-800 hover:text-blue-500 transition-colors line-clamp-2"
                    >
                      {row.name}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-slate-800 line-clamp-2">{row.name}</span>
                  )}
                  {row.addons && (
                    <ul className="mt-1.5 space-y-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                      {row.addons.map((a) => (
                        <li key={a.productId} className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate">
                            + {localizedName(a, locale)} × {a.quantity}
                          </span>
                          <span className="whitespace-nowrap text-slate-400">
                            {formatPrice(a.priceCents * a.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-1 text-sm font-medium text-blue-500">{formatPrice(row.unitPriceCents)}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-300">
                      <button
                        type="button"
                        onClick={row.onDec}
                        className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-slate-800">{row.quantity}</span>
                      <button
                        type="button"
                        onClick={row.onInc}
                        className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={row.onRemove}
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-100"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      {t("remove")}
                    </button>
                  </div>
                </div>
                <div className="text-right text-sm font-bold text-slate-900 whitespace-nowrap">
                  {formatPrice(row.unitPriceCents * row.quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-bold text-slate-900">{t("subtotal")}</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>{t("subtotal")}</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>{t("shippingLater")}</span>
                <span>{t("tbd")}</span>
              </div>
            </div>
            <div className="my-4 border-t border-slate-200" />
            <div className="flex justify-between font-bold text-slate-900">
              <span>{t("total")}</span>
              <span className="text-blue-500">{formatPrice(total)}</span>
            </div>

            {hasCustom && minCents > 0 && (
              <div className="mt-3 text-xs">
                {customBelowMin ? (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-amber-800">
                    {t("belowMin", { min: formatPrice(minCents) })}
                  </p>
                ) : (
                  <p className="text-emerald-700">{t("minOk", { min: formatPrice(minCents) })}</p>
                )}
              </div>
            )}

            {canCheckout ? (
              <Link
                href="/checkout"
                className="mt-5 block w-full rounded-xl bg-blue-600 py-3 text-center text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
              >
                {t("checkout")} &rarr;
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="mt-5 block w-full cursor-not-allowed rounded-xl bg-slate-200 py-3 text-center text-sm font-semibold text-slate-400"
              >
                {t("checkout")} &rarr;
              </button>
            )}
            <Link
              href="/products"
              className="mt-2 block w-full rounded-xl py-2.5 text-center text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-500 transition-colors"
            >
              {t("browseProducts")}
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
