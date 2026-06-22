"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { lookupOrders, type OrderSummary } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

const STATUS_COLOR: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-500/15 text-amber-400",
  PAID: "bg-blue-500/15 text-blue-400",
  PROCESSING: "bg-blue-500/15 text-blue-400",
  PACKING: "bg-indigo-500/15 text-indigo-400",
  SHIPPED: "bg-purple-500/15 text-purple-400",
  DELIVERED: "bg-emerald-500/15 text-emerald-700",
  CANCELLED: "bg-red-500/15 text-red-400",
  REFUNDED: "bg-slate-100 text-slate-600",
};

export default function TrackPage() {
  const t = useTranslations("Track");
  const tStatus = useTranslations("Status");
  const locale = useLocale() as Locale;
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const results = await lookupOrders(phone.trim());
      setOrders(results);
    } catch {
      setError(t("errorMessage"));
      setOrders(null);
    } finally {
      setLoading(false);
    }
  }

  function itemLabel(item: OrderSummary["items"][number]) {
    return locale === "zh" ? item.productNameZh ?? item.productNameTh : item.productNameTh;
  }

  function statusLabel(status: string) {
    const key = status as Parameters<typeof tStatus>[0];
    return tStatus.has(key) ? tStatus(key) : status;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("title")}</h1>
      <p className="mt-2 text-sm text-slate-500">{t("subtitle")}</p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-end"
      >
        <label className="block flex-1">
          <span className="text-xs font-medium text-slate-500">{t("phoneLabel")}</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("phonePlaceholder")}
            required
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
          />
        </label>
        <button
          type="submit"
          disabled={loading || !phone.trim()}
          className="h-11 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-500 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
        >
          {loading ? t("looking") : t("lookupButton")}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-xl border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {orders !== null && !error && (
        <section className="mt-8">
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-slate-500">{t("noOrders")}</p>
              <p className="mt-2 text-xs text-slate-700">{t("noOrdersHint")}</p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-slate-500">
                {t("resultsCount", { count: orders.length })}
              </p>
              <ul className="space-y-3">
                {orders.map((o) => (
                  <li key={o.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <p className="font-mono text-sm font-semibold text-slate-800">
                          {o.orderNumber}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">{formatDate(o.placedAt)}</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          STATUS_COLOR[o.status] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {statusLabel(o.status)}
                      </span>
                    </div>

                    <ul className="mt-3 space-y-1 text-sm text-slate-500">
                      {o.items.slice(0, 3).map((item, i) => (
                        <li key={i} className="truncate">
                          {itemLabel(item)} × {item.quantity}
                        </li>
                      ))}
                      {o.items.length > 3 && (
                        <li className="text-xs text-slate-700">+{o.items.length - 3}</li>
                      )}
                    </ul>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                      <span className="font-bold text-blue-500">
                        {formatPrice(o.totalCents, o.currency)}
                      </span>
                      <Link
                        href={`/orders/${o.orderNumber}`}
                        className="text-sm font-medium text-blue-500 hover:text-blue-400 hover:underline"
                      >
                        {t("viewDetail")} →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </main>
  );
}
