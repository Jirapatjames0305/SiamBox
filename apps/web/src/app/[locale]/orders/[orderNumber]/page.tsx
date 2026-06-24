import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getOrder } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";
import { OrderStatusPoller } from "./OrderStatusPoller";

export const dynamic = "force-dynamic";

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

export default async function OrderTrackingPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string; locale: string }>;
  searchParams: Promise<{ placed?: string; charge?: string }>;
}) {
  const { orderNumber, locale } = await params;
  const { placed, charge } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("Order");
  const tStatus = await getTranslations("Status");
  const tReview = await getTranslations("Review");

  const order = await getOrder(orderNumber);
  if (!order) notFound();

  const statusKey = order.status as Parameters<typeof tStatus>[0];
  const statusLabel = tStatus.has(statusKey) ? tStatus(statusKey) : order.status;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {charge && (
        <OrderStatusPoller
          orderNumber={order.orderNumber}
          initialStatus={order.status}
          pollingLabel={t("checkingPayment")}
        />
      )}

      {/* Placed banner */}
      {placed && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t("orderPlaced")}</span>
          </div>
          <p className="mt-2 pl-8 text-xs text-emerald-600">
            {t("savedHint")}{" "}
            <Link href="/track" className="font-semibold underline text-emerald-700">
              {t("trackHere")}
            </Link>
          </p>
        </div>
      )}

      {/* Order header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-slate-500">{t("orderNumber")}</p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">{order.orderNumber}</h1>
            <p className="mt-1 text-sm text-slate-500">{t("placedAt")} · {formatDate(order.placedAt)}</p>
          </div>
          <span className={`rounded-full px-4 py-1.5 text-xs font-semibold ${STATUS_COLOR[order.status] ?? "bg-slate-100 text-slate-600"}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Items */}
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("items")}</h2>
        <ul className="mt-4 divide-y divide-slate-200">
          {order.items.map((item) => {
            const isCustom = item.package?.active === false;
            return (
              <li key={item.id} className="py-3 text-sm">
                {isCustom ? (
                  <div className="flex justify-between">
                    <div className="min-w-0 flex-1 pr-4">
                      {item.package!.items.map((pi, i) => (
                        <div key={i} className="flex items-baseline gap-1">
                          <span className="font-medium text-slate-800">
                            {locale === "zh" ? pi.product.nameZh ?? pi.product.nameTh : pi.product.nameTh}
                          </span>
                          <span className="text-xs text-slate-500">× {pi.quantity * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <span className="font-semibold text-slate-900">{formatPrice(item.totalCents, order.currency)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="font-medium text-slate-800">
                        {locale === "zh" ? item.productNameZh ?? item.productNameTh : item.productNameTh}
                      </p>
                      <p className="text-xs text-slate-500">× {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-slate-900">{formatPrice(item.totalCents, order.currency)}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <div className="mt-4 space-y-1.5 border-t border-slate-200 pt-4 text-sm">
          <Row label={t("shipping")} value={formatPrice(order.shippingCents, order.currency)} />
          <Row label={t("total")} value={formatPrice(order.totalCents, order.currency)} strong />
        </div>
      </section>

      {/* Shipping address */}
      {order.shippingAddress && (
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("address")}</h2>
          <div className="mt-3 space-y-1 text-sm text-slate-500">
            <p className="font-medium text-slate-800">{order.shippingAddress.recipient} · {order.shippingAddress.phone}</p>
            <p>
              {order.shippingAddress.province} {order.shippingAddress.city}{" "}
              {order.shippingAddress.district ?? ""} {order.shippingAddress.street}
            </p>
            <p className="text-slate-500">{t("postal")} · {order.shippingAddress.postalCode}</p>
          </div>
        </section>
      )}

      {/* Payment instructions */}
      {order.status === "PENDING_PAYMENT" && (
        <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div className="flex-1 text-sm text-amber-800">
              <h2 className="font-bold text-amber-900">{t("payment")}</h2>
              <p className="mt-2">
                {t("paymentInstruction", {
                  amount: formatPrice(order.totalCents, order.currency),
                })}
              </p>
              <p className="mt-1 text-xs text-amber-700">{t("paymentNote", { order: order.orderNumber })}</p>
            </div>
          </div>
        </section>
      )}

      {/* Shipment (carrier + tracking number) */}
      {order.shipments.length > 0 && (
        <section className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/50 p-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700">{t("trackingNumber")}</h2>
          <div className="mt-3 space-y-3">
            {order.shipments.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500">{t("carrier")}</p>
                  <p className="text-base font-semibold text-slate-900">{s.carrier}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-500">{t("trackingNumber")}</p>
                  <p className="font-mono text-base font-bold text-blue-700 break-all">{s.trackingNumber}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tracking timeline */}
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("tracking")}</h2>
        {order.trackingLogs.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">{t("noTracking")}</p>
        ) : (
          <ol className="mt-4 space-y-0">
            {order.trackingLogs.map((log, i) => (
              <li key={log.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`mt-0.5 h-3 w-3 rounded-full ring-2 ${i === 0 ? "ring-blue-500 bg-blue-500" : "ring-slate-300 bg-slate-300"}`} />
                  {i < order.trackingLogs.length - 1 && (
                    <div className="mt-1 w-px flex-1 bg-slate-100" style={{ minHeight: "2rem" }} />
                  )}
                </div>
                <div className="pb-5">
                  <p className="text-sm font-semibold text-slate-800">{log.status}</p>
                  {log.location && <p className="text-xs text-slate-500">{log.location}</p>}
                  {log.message && <p className="text-xs text-slate-500">{log.message}</p>}
                  <p className="mt-0.5 text-xs text-slate-500">{formatDate(log.occurredAt)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Review (only once delivered) */}
      {order.status === "DELIVERED" && (
        <section className="mt-4 rounded-2xl border border-gold-300 bg-gold-50/40 p-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-maroon-700">{tReview("sectionTitle")}</h2>
          {order.review ? (
            <div className="mt-3">
              <div className="flex items-center gap-2 text-gold-500">
                <span className="inline-flex items-center gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <svg key={i} viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 ${i < order.review!.rating ? "" : "opacity-25"}`}>
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    order.review.status === "APPROVED"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {order.review.status === "APPROVED" ? tReview("approvedBadge") : tReview("pendingBadge")}
                </span>
              </div>
              <p className="mt-2 text-sm text-stone-600">{order.review.comment}</p>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-stone-600">{tReview("invite")}</p>
              <Link
                href={`/orders/${order.orderNumber}/review`}
                className="rounded-xl bg-maroon-800 px-4 py-2 text-sm font-semibold text-cream-100 hover:bg-maroon-700"
              >
                {tReview("writeReview")}
              </Link>
            </div>
          )}
        </section>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/products"
          className="text-sm font-medium text-blue-500 hover:text-blue-400 hover:underline"
        >
          &larr; {t("continueShopping")}
        </Link>
      </div>
    </main>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-bold text-slate-900" : "text-slate-500"}`}>
      <span>{label}</span>
      <span className={strong ? "text-blue-500" : ""}>{value}</span>
    </div>
  );
}
