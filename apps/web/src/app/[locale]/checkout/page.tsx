"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { shippingAddressSchema } from "@siambox/shared";
import { createOrder, getBuildConfig, uploadSlip } from "@/lib/api";
import {
  cartLineImage,
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

type PaymentMethod = "MANUAL" | "ALIPAY" | "WECHAT_PAY" | "TEST";

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
  // Per-method visibility set by admin (null = not loaded yet).
  const [methodCfg, setMethodCfg] = useState<Record<
    PaymentMethod,
    { hidden: boolean; disabled: boolean }
  > | null>(null);
  const [bank, setBank] = useState<{ qrUrl: string; name: string; number: string } | null>(null);
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [slipUploading, setSlipUploading] = useState(false);
  const [slipError, setSlipError] = useState<string | null>(null);
  const [shippingMethod, setShippingMethod] = useState<"NORMAL" | "EXPRESS">("NORMAL");
  const [shipping, setShipping] = useState<{ normal: number; express: number }>({ normal: 0, express: 0 });

  useEffect(() => {
    getBuildConfig()
      .then((cfg) => {
        setMethodCfg(cfg.paymentMethods);
        setBank({ qrUrl: cfg.bankQrUrl, name: cfg.bankAccountName, number: cfg.bankAccountNumber });
        setShipping({ normal: cfg.shippingBaseCents, express: cfg.shippingExpressCents });
      })
      .catch(() => setMethodCfg(null));
  }, []);

  async function handleSlip(file: File) {
    setSlipError(null);
    setSlipUploading(true);
    try {
      setSlipUrl(await uploadSlip(file));
    } catch {
      setSlipError(t("slipUploadError"));
    } finally {
      setSlipUploading(false);
    }
  }

  // If the selected method becomes hidden/disabled, fall back to the first selectable one.
  useEffect(() => {
    if (!methodCfg) return;
    const order: PaymentMethod[] = ["MANUAL", "ALIPAY", "WECHAT_PAY", "TEST"];
    const selectable = (m: PaymentMethod) => !methodCfg[m].hidden && !methodCfg[m].disabled;
    if (!selectable(paymentMethod)) {
      const first = order.find(selectable);
      if (first) setPaymentMethod(first);
    }
  }, [methodCfg, paymentMethod]);

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
  const shippingCents = shippingMethod === "EXPRESS" ? shipping.express : shipping.normal;
  const grandTotal = total + shippingCents;

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

    // Manual bank transfer requires a payment slip.
    if (paymentMethod === "MANUAL" && !slipUrl) {
      setServerError(t("slipRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({
        items: cart.lines.map((l) =>
          l.kind === "package"
            ? {
                kind: "package" as const,
                packageId: l.packageId,
                quantity: l.quantity,
                addons: l.addons?.map((a) => ({ productId: a.productId, quantity: a.quantity })),
              }
            : {
                kind: "custom" as const,
                quantity: l.quantity,
                products: l.products.map((p) => ({ productId: p.productId, quantity: p.quantity })),
              },
        ),
        shippingAddress: parsed.data,
        customerNote: form.customerNote || undefined,
        paymentMethod,
        slipUrl: paymentMethod === "MANUAL" ? slipUrl ?? undefined : undefined,
        shippingMethod,
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

  const allChoices: { value: PaymentMethod; label: string; hint: string; badge?: string }[] = [
    { value: "MANUAL", label: t("payManual"), hint: t("payManualHint") },
    { value: "ALIPAY", label: "Alipay", hint: t("payOnlineHint") },
    { value: "WECHAT_PAY", label: "WeChat Pay", hint: t("payOnlineHint") },
    { value: "TEST", label: t("payTest"), hint: t("payTestHint"), badge: "TEST" },
  ];
  // Drop hidden methods entirely; disabled ones stay visible but greyed-out / not selectable.
  const paymentChoices = allChoices
    .filter((c) => !methodCfg?.[c.value]?.hidden)
    .map((c) => ({ ...c, disabled: methodCfg?.[c.value]?.disabled ?? false }));

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
            <h2 className="text-base font-bold text-slate-900">{t("shippingMethodTitle")}</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <ShippingChoice
                value="NORMAL"
                selected={shippingMethod}
                onSelect={setShippingMethod}
                label={t("shippingNormal")}
                hint={t("daysNormal")}
                price={shipping.normal}
              />
              <ShippingChoice
                value="EXPRESS"
                selected={shippingMethod}
                onSelect={setShippingMethod}
                label={t("shippingExpress")}
                hint={t("daysExpress")}
                price={shipping.express}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-bold text-slate-900">{t("paymentMethod")}</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {paymentChoices.map((c) => (
                <PaymentChoice
                  key={c.value}
                  value={c.value}
                  selected={paymentMethod}
                  onSelect={setPaymentMethod}
                  label={c.label}
                  hint={c.hint}
                  badge={c.badge}
                  disabled={c.disabled}
                />
              ))}
            </div>

            {paymentMethod === "MANUAL" && (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">{t("bankTransferTitle")}</h3>
                {bank?.qrUrl && (
                  <div className="mt-3 flex flex-col items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={bank.qrUrl} alt="QR" className="h-48 w-48 rounded-lg border border-slate-200 object-contain bg-white" />
                    <p className="mt-1.5 text-xs text-slate-500">{t("scanQr")}</p>
                  </div>
                )}
                {(bank?.name || bank?.number) && (
                  <dl className="mt-3 space-y-1 text-sm">
                    {bank?.name && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">{t("accountName")}</dt>
                        <dd className="font-medium text-slate-800">{bank.name}</dd>
                      </div>
                    )}
                    {bank?.number && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">{t("accountNumber")}</dt>
                        <dd className="font-mono font-medium text-slate-800">{bank.number}</dd>
                      </div>
                    )}
                  </dl>
                )}

                <div className="mt-4">
                  <label className="text-sm font-medium text-slate-700">
                    {t("attachSlip")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => e.target.files?.[0] && handleSlip(e.target.files[0])}
                    className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-300"
                  />
                  {slipUploading && <p className="mt-2 text-xs text-slate-500">{t("uploadingSlip")}</p>}
                  {slipError && <p className="mt-2 text-xs text-red-500">{slipError}</p>}
                  {slipUrl && !slipUploading && (
                    <div className="mt-2 flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={slipUrl} alt="slip" className="h-16 w-16 rounded-md border border-slate-200 object-cover" />
                      <span className="text-xs font-medium text-emerald-600">✓ {t("slipUploaded")}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
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
            {cart.lines.map((l) => {
              const img = cartLineImage(l);
              return (
              <li key={l.lineId} className="flex gap-3">
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" className="h-full w-full object-cover" />
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
              );
            })}
          </ul>

          <div className="my-4 border-t border-slate-200" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>{tCart("subtotal")}</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>{t("shipping")}</span>
              <span>{formatPrice(shippingCents)}</span>
            </div>
          </div>

          <div className="my-3 border-t border-slate-200" />

          <div className="flex justify-between font-bold text-slate-900">
            <span>{t("total")}</span>
            <span className="text-blue-500">{formatPrice(grandTotal)}</span>
          </div>

          {serverError && (
            <div className="mt-4 rounded-xl border border-red-900/40 bg-red-950/30 p-3 text-sm text-red-400">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || slipUploading || (paymentMethod === "MANUAL" && !slipUrl)}
            className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-slate-900 hover:bg-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? t("submitting") : t("placeOrder")}
          </button>
          {paymentMethod === "MANUAL" && !slipUrl && (
            <p className="mt-2 text-center text-xs text-slate-500">{t("slipRequired")}</p>
          )}
        </aside>
      </form>
    </main>
  );
}

function ShippingChoice({
  value,
  selected,
  onSelect,
  label,
  hint,
  price,
}: {
  value: "NORMAL" | "EXPRESS";
  selected: "NORMAL" | "EXPRESS";
  onSelect: (v: "NORMAL" | "EXPRESS") => void;
  label: string;
  hint: string;
  price: number;
}) {
  const active = selected === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`flex items-start justify-between gap-2 rounded-xl border p-3 text-left transition-colors ${
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
        <span>
          <span className="block text-sm font-semibold text-slate-800">{label}</span>
          <span className="block text-xs text-slate-500">{hint}</span>
        </span>
      </div>
      <span className="text-sm font-semibold text-slate-700">{formatPrice(price)}</span>
    </button>
  );
}

function PaymentChoice({
  value,
  selected,
  onSelect,
  label,
  hint,
  badge,
  disabled,
}: {
  value: PaymentMethod;
  selected: PaymentMethod;
  onSelect: (v: PaymentMethod) => void;
  label: string;
  hint: string;
  /** Optional pill (e.g. "TEST") shown next to the label for non-production options. */
  badge?: string;
  /** Shown greyed-out and not selectable (admin disabled this channel). */
  disabled?: boolean;
}) {
  const active = selected === value;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(value)}
      className={`rounded-xl border p-3 text-left transition-colors ${
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-50"
          : active
            ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30"
            : "border-slate-300 bg-slate-100 hover:border-slate-600"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
            active && !disabled ? "border-blue-500" : "border-slate-600"
          }`}
        >
          {active && !disabled && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
        </span>
        <span className="text-sm font-semibold text-slate-800">{label}</span>
        {badge && (
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
            {badge}
          </span>
        )}
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
        className={`mt-1.5 w-full rounded-xl border bg-slate-100 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:ring-1 ${
          error
            ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
            : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
        }`}
      />
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  );
}
