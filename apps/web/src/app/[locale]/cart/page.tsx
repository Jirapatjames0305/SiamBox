"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  cartLineName,
  cartTotalCents,
  removeFromCart,
  updateQuantity,
  useCart,
  useCartHydrated,
} from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

export default function CartPage() {
  const t = useTranslations("Cart");
  const locale = useLocale() as Locale;
  const cart = useCart();
  const hydrated = useCartHydrated();

  if (!hydrated) {
    return <main className="mx-auto max-w-4xl px-4 py-10" />;
  }

  const empty = cart.lines.length === 0;
  const total = cartTotalCents(cart);

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
            className="mt-5 inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-slate-900 hover:bg-blue-500 transition-colors"
          >
            {t("browseProducts")}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Items */}
          <div className="space-y-3">
            {cart.lines.map((line) => {
              const name = cartLineName(line, locale);
              return (
                <div
                  key={line.productId}
                  className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {line.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={line.image} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-slate-100" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col min-w-0">
                    <Link
                      href={`/products/${line.slug}`}
                      className="text-sm font-semibold text-slate-800 hover:text-blue-500 transition-colors line-clamp-2"
                    >
                      {name}
                    </Link>
                    <p className="mt-1 text-sm font-medium text-blue-500">
                      {formatPrice(line.priceCents)}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-300">
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.productId, line.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-slate-800">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.productId, line.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(line.productId)}
                        className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                      >
                        {t("remove")}
                      </button>
                    </div>
                  </div>
                  <div className="text-right text-sm font-bold text-slate-900 whitespace-nowrap">
                    {formatPrice(line.priceCents * line.quantity)}
                  </div>
                </div>
              );
            })}
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
            <Link
              href="/checkout"
              className="mt-5 block w-full rounded-xl bg-blue-600 py-3 text-center text-sm font-semibold text-slate-900 hover:bg-blue-500 transition-colors"
            >
              {t("checkout")} &rarr;
            </Link>
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
