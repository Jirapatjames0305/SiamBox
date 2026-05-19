"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { shippingAddressSchema } from "@siambox/shared";
import { createOrder } from "@/lib/api";
import {
  cartLineName,
  cartTotalCents,
  clearCart,
  useCart,
  useCartHydrated,
} from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

type FormState = {
  recipient: string;
  phone: string;
  wechatId: string;
  province: string;
  city: string;
  district: string;
  street: string;
  postalCode: string;
  customerNote: string;
};

type PaymentMethod = "MANUAL" | "ALIPAY" | "WECHAT_PAY";

const empty: FormState = {
  recipient: "",
  phone: "",
  wechatId: "",
  province: "",
  city: "",
  district: "",
  street: "",
  postalCode: "",
  customerNote: "",
};

export default function CheckoutPage() {
  const t = useTranslations("Checkout");
  const tCart = useTranslations("Cart");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const cart = useCart();
  const hydrated = useCartHydrated();
  const [form, setForm] = useState<FormState>(empty);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("MANUAL");
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  if (!hydrated) return <main className="mx-auto max-w-5xl px-4 py-10" />;

  if (cart.lines.length === 0) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("title")}</h1>
        <p className="mt-4 text-sm text-slate-500">{t("empty")}</p>
        <Link href="/products" className="mt-4 inline-block text-sm font-medium text-blue-500 hover:underline">
          {tCart("browseProducts")} &rarr;
        </Link>
      </main>
    );
  }

  const total = cartTotalCents(cart);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const parsed = shippingAddressSchema.safeParse({
      recipient: form.recipient,
      phone: form.phone,
      wechatId: form.wechatId || undefined,
      province: form.province,
      city: form.city,
      district: form.district || undefined,
      street: form.street,
      postalCode: form.postalCode,
    });

    if (!parsed.success) {
      const map: Partial<Record<keyof FormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof FormState | undefined;
        if (k) map[k] = issue.message;
      }
      setErrors(map);
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      const order = await createOrder({
        items: cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        shippingAddress: parsed.data,
        customerNote: form.customerNote || undefined,
        paymentMethod,
      });
      clearCart();
      if (order.authorizeUri) {
        window.location.href = order.authorizeUri;
        return;
      }
      router.push(`/orders/${order.orderNumber}?placed=1`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t("submitError"));
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("title")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("guestNote")}</p>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Left: address + payment + note */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-bold text-slate-900">{t("address")}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label={t("recipient")} value={form.recipient} onChange={(v) => set("recipient", v)} error={errors.recipient} required />
              <Field label={t("phone")} value={form.phone} onChange={(v) => set("phone", v)} error={errors.phone} required />
              <Field label={t("wechat")} value={form.wechatId} onChange={(v) => set("wechatId", v)} error={errors.wechatId} />
              <Field label={t("postalCode")} value={form.postalCode} onChange={(v) => set("postalCode", v)} error={errors.postalCode} required />
              <Field label={t("province")} value={form.province} onChange={(v) => set("province", v)} error={errors.province} required />
              <Field label={t("city")} value={form.city} onChange={(v) => set("city", v)} error={errors.city} required />
              <Field label={t("district")} value={form.district} onChange={(v) => set("district", v)} error={errors.district} />
              <Field
                label={t("street")}
                value={form.street}
                onChange={(v) => set("street", v)}
                error={errors.street}
                required
                className="sm:col-span-2"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-bold text-slate-900">{t("paymentMethod")}</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <PaymentChoice value="MANUAL" selected={paymentMethod} onSelect={setPaymentMethod} label={t("payManual")} hint={t("payManualHint")} />
              <PaymentChoice value="ALIPAY" selected={paymentMethod} onSelect={setPaymentMethod} label="Alipay" hint={t("payOnlineHint")} />
              <PaymentChoice value="WECHAT_PAY" selected={paymentMethod} onSelect={setPaymentMethod} label="WeChat Pay" hint={t("payOnlineHint")} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-bold text-slate-900">{t("note")}</h2>
            <textarea
              value={form.customerNote}
              onChange={(e) => set("customerNote", e.target.value)}
              rows={3}
              placeholder={t("notePlaceholder")}
              className="mt-3 w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Right: order summary */}
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
          <h2 className="text-base font-bold text-slate-900">{t("orderSummary")}</h2>

          <ul className="mt-4 space-y-2">
            {cart.lines.map((l) => (
              <li key={l.productId} className="flex gap-3">
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {l.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.image} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex flex-1 items-start justify-between gap-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800">{cartLineName(l, locale)}</p>
                    <p className="text-xs text-slate-500">× {l.quantity}</p>
                  </div>
                  <span className="font-semibold text-slate-900 whitespace-nowrap">
                    {formatPrice(l.priceCents * l.quantity)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="my-4 border-t border-slate-200" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>{tCart("subtotal")}</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>{t("shipping")}</span>
              <span>{t("shippingTbd")}</span>
            </div>
          </div>

          <div className="my-3 border-t border-slate-200" />

          <div className="flex justify-between font-bold text-slate-900">
            <span>{t("total")}</span>
            <span className="text-blue-500">{formatPrice(total)}</span>
          </div>

          {serverError && (
            <div className="mt-4 rounded-xl border border-red-900/40 bg-red-950/30 p-3 text-sm text-red-400">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-slate-900 hover:bg-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? t("submitting") : t("placeOrder")}
          </button>
        </aside>
      </form>
    </main>
  );
}

function PaymentChoice({
  value,
  selected,
  onSelect,
  label,
  hint,
}: {
  value: PaymentMethod;
  selected: PaymentMethod;
  onSelect: (v: PaymentMethod) => void;
  label: string;
  hint: string;
}) {
  const active = selected === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`rounded-xl border p-3 text-left transition-colors ${
        active
          ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30"
          : "border-slate-300 bg-slate-100 hover:border-slate-600"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
            active ? "border-blue-500" : "border-slate-600"
          }`}
        >
          {active && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
        </span>
        <span className="text-sm font-semibold text-slate-800">{label}</span>
      </div>
      <p className="mt-1 pl-6 text-xs text-slate-500">{hint}</p>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  required,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="text-xs font-medium text-slate-500">
        {label}
        {required && <span className="ml-0.5 text-blue-500">*</span>}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1.5 w-full rounded-xl border bg-slate-100 px-3 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:ring-1 ${
          error
            ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
            : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
        }`}
      />
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  );
}
