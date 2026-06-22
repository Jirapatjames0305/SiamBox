"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { shippingAddressSchema } from "@siambox/shared";
import { createOrder, getBuildConfig, uploadSlip } from "@/lib/api";
import { Turnstile, captchaEnabled } from "@/components/Turnstile";
import {
  cartLineName,
  cartTotalCents,
  clearCart,
  useCart,
  useCartHydrated,
  type PackageAddon,
} from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { localizedName } from "@/lib/i18n-helpers";
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
  const [storeWechatId, setStoreWechatId] = useState("");
  const [alipayQrUrl, setAlipayQrUrl] = useState("");
  const [wechatQrUrl, setWechatQrUrl] = useState("");
  const [alipayMode, setAlipayMode] = useState<"QR" | "GATEWAY">("QR");
  const [wechatMode, setWechatMode] = useState<"QR" | "GATEWAY">("QR");
  const [slipUrl, setSlipUrl] = useState("");
  const [slipUploading, setSlipUploading] = useState(false);
  const [slipError, setSlipError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [shippingMethod, setShippingMethod] = useState<"NORMAL" | "EXPRESS">("NORMAL");
  const [shipping, setShipping] = useState<{ normal: number; express: number }>({ normal: 0, express: 0 });
  // After a MANUAL order is placed we keep the user on this page and pop the WeChat contact modal.
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const slipInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    getBuildConfig()
      .then((cfg) => {
        setMethodCfg(cfg.paymentMethods);
        setStoreWechatId(cfg.storeWechatId);
        setAlipayQrUrl(cfg.alipayQrUrl);
        setWechatQrUrl(cfg.wechatQrUrl);
        setAlipayMode(cfg.alipayMode);
        setWechatMode(cfg.wechatMode);
        setShipping({ normal: cfg.shippingBaseCents, express: cfg.shippingExpressCents });
      })
      .catch(() => setMethodCfg(null));
  }, []);

  async function handleSaveImage() {
    if (!summaryRef.current) return;
    setSavingImage(true);
    try {
      const dataUrl = await toPng(summaryRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `siambox-order-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // Cross-origin images can taint the canvas; fail silently rather than block checkout.
    } finally {
      setSavingImage(false);
    }
  }

  async function copyWechatId() {
    try {
      await navigator.clipboard.writeText(storeWechatId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore clipboard permission errors
    }
  }

  async function handleSlipFile(file: File) {
    setSlipError(null);
    setSlipUploading(true);
    try {
      const url = await uploadSlip(file);
      setSlipUrl(url);
    } catch (e) {
      setSlipError(e instanceof Error ? e.message : t("slipUploadError"));
    } finally {
      setSlipUploading(false);
    }
  }

  // Once a MANUAL order is placed, auto-save the summary image (now stamped with the order
  // number) so the customer can forward it straight into the shop's WeChat chat.
  useEffect(() => {
    if (placedOrderNumber) void handleSaveImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placedOrderNumber]);

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

  // A slip belongs to the channel it was uploaded for — drop it when the customer switches method.
  useEffect(() => {
    setSlipUrl("");
    setSlipError(null);
  }, [paymentMethod]);

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

  // Flatten custom packages into per-product rows and expose package add-ons, mirroring the
  // cart page so the summary shows every item the customer actually picked.
  const summaryRows: {
    key: string;
    image?: string;
    name: string;
    addons: PackageAddon[] | null;
    unitPriceCents: number;
    quantity: number;
  }[] = cart.lines.flatMap((line) =>
    line.kind === "custom"
      ? line.products.map((p) => ({
          key: `${line.lineId}:${p.productId}`,
          image: p.image,
          name: localizedName(p, locale),
          addons: null,
          unitPriceCents: p.priceCents,
          quantity: p.quantity,
        }))
      : [
          {
            key: line.lineId,
            image: line.image,
            name: cartLineName(line, locale),
            addons: line.addons && line.addons.length > 0 ? line.addons : null,
            unitPriceCents: line.priceCents,
            quantity: line.quantity,
          },
        ],
  );

  const fullAddress = [form.street, form.district, form.city, form.province, form.postalCode]
    .filter(Boolean)
    .join(" ");
  const shippingLabel = shippingMethod === "EXPRESS" ? t("shippingExpress") : t("shippingNormal");
  const paymentLabel =
    paymentMethod === "MANUAL"
      ? t("payManual")
      : paymentMethod === "ALIPAY"
        ? "Alipay"
        : paymentMethod === "WECHAT_PAY"
          ? "WeChat Pay"
          : t("payTest");

  // Alipay / WeChat Pay run as a scan-the-QR + attach-slip flow when the admin set that channel
  // to QR mode. `qrSrc` falls back to the seeded Alipay image so the page is never blank.
  const qrChannel =
    paymentMethod === "ALIPAY" && alipayMode === "QR"
      ? { src: alipayQrUrl || "/alipay-qr.jpg" }
      : paymentMethod === "WECHAT_PAY" && wechatMode === "QR"
        ? { src: wechatQrUrl }
        : null;
  // Slip is the proof of payment for QR channels — required before the order can be placed.
  const slipRequired = qrChannel !== null;

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
        slipUrl: slipUrl || undefined,
        shippingMethod,
      }, captchaToken);
      if (order.authorizeUri) {
        clearCart();
        window.location.href = order.authorizeUri;
        return;
      }
      // Manual payment: keep the cart visible behind the WeChat contact modal until
      // the customer leaves for the order page.
      if (paymentMethod === "MANUAL") {
        setPlacedOrderNumber(order.orderNumber);
        setSubmitting(false);
        return;
      }
      clearCart();
      router.push(`/orders/${order.orderNumber}?placed=1`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t("submitError"));
      setSubmitting(false);
    }
  }

  const allChoices: { value: PaymentMethod; label: string; hint: string; badge?: string }[] = [
    { value: "MANUAL", label: t("payManual"), hint: t("payManualHint") },
    { value: "ALIPAY", label: "Alipay", hint: alipayMode === "QR" ? t("payQrHint") : t("payOnlineHint") },
    { value: "WECHAT_PAY", label: "WeChat Pay", hint: wechatMode === "QR" ? t("payQrHint") : t("payOnlineHint") },
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
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <svg viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" aria-hidden="true">
                  <path d="M8.5 4C4.91 4 2 6.46 2 9.5c0 1.74.96 3.29 2.46 4.3l-.62 1.86 2.17-1.09c.78.22 1.62.34 2.49.34.2 0 .4-.01.6-.02a4.9 4.9 0 0 1-.1-.98c0-2.9 2.86-5.16 6.2-5.16.22 0 .43.01.64.03C15.2 5.62 12.13 4 8.5 4Z"/>
                  <path d="M22 13.7c0-2.43-2.42-4.4-5.4-4.4s-5.4 1.97-5.4 4.4 2.42 4.4 5.4 4.4c.62 0 1.21-.08 1.76-.24l1.6.8-.44-1.33c1.5-.8 2.48-2.13 2.48-3.63Z"/>
                </svg>
                <p className="text-sm text-emerald-800">{t("wechatPayNote")}</p>
              </div>
            )}

            {qrChannel && (
              <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">{t("qrPayNote")}</p>
                {qrChannel.src ? (
                  <div className="mt-3 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrChannel.src}
                      alt={`${paymentLabel} QR`}
                      className="h-56 w-56 rounded-lg border border-blue-200 bg-white object-contain"
                    />
                  </div>
                ) : (
                  <p className="mt-3 text-center text-xs text-blue-700">{t("qrMissing")}</p>
                )}

                {/* Slip upload — required before the order can be placed. */}
                <div className="mt-4 border-t border-blue-200 pt-4">
                  <p className="text-sm font-semibold text-blue-900">
                    {t("slipTitle")} <span className="text-red-500">*</span>
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    {slipUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={slipUrl}
                        alt="slip"
                        className="h-20 w-20 rounded-lg border border-blue-200 bg-white object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-blue-300 text-[10px] text-blue-400">
                        {t("slipNone")}
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => slipInputRef.current?.click()}
                        disabled={slipUploading}
                        className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-sm font-medium text-blue-700 hover:border-blue-500 disabled:opacity-50 transition-colors"
                      >
                        {slipUploading ? t("slipUploading") : slipUrl ? t("slipChange") : t("slipUpload")}
                      </button>
                      {slipUrl && (
                        <button
                          type="button"
                          onClick={() => setSlipUrl("")}
                          className="text-left text-xs text-red-600 hover:underline"
                        >
                          {t("slipRemove")}
                        </button>
                      )}
                    </div>
                    <input
                      ref={slipInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleSlipFile(e.target.files[0])}
                    />
                  </div>
                  {slipError && <p className="mt-1.5 text-xs text-red-600">{slipError}</p>}
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
        <aside className="h-fit lg:sticky lg:top-24">
          {/* Everything inside this ref is what gets saved as an image. */}
          <div ref={summaryRef} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-bold text-slate-900">{t("orderSummary")}</h2>
            {placedOrderNumber && (
              <p className="mt-1 text-sm">
                <span className="text-slate-500">{t("orderNumber")}: </span>
                <span className="font-mono font-semibold text-slate-900">{placedOrderNumber}</span>
              </p>
            )}

            <ul className="mt-4 space-y-3">
              {summaryRows.map((row) => (
                <li key={row.key} className="flex gap-3">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {row.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.image} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex flex-1 items-start justify-between gap-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800">{row.name}</p>
                      <p className="text-xs text-slate-500">× {row.quantity}</p>
                      {row.addons && (
                        <ul className="mt-1 space-y-0.5">
                          {row.addons.map((a) => (
                            <li key={a.productId} className="text-xs text-slate-500">
                              + {localizedName(a, locale)} × {a.quantity}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <span className="font-semibold text-slate-900 whitespace-nowrap">
                      {formatPrice(row.unitPriceCents * row.quantity)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="my-4 border-t border-slate-200" />

            {/* Customer + delivery details, so the saved image is a complete order record. */}
            <dl className="space-y-1.5 text-sm">
              <SummaryRow label={t("recipient")} value={form.recipient} />
              <SummaryRow label={t("phone")} value={form.phone} />
              <SummaryRow label="WeChat" value={form.wechatId} />
              <SummaryRow label={t("address")} value={fullAddress} />
              <SummaryRow label={t("shippingMethodTitle")} value={shippingLabel} />
              <SummaryRow label={t("paymentMethod")} value={paymentLabel} />
              <SummaryRow label={t("note")} value={form.customerNote} />
            </dl>

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
          </div>

          <button
            type="button"
            onClick={handleSaveImage}
            disabled={savingImage}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 hover:border-slate-500 disabled:opacity-50 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path d="M10 12a1 1 0 0 1-.7-.29l-3-3a1 1 0 1 1 1.4-1.42L9 8.59V3a1 1 0 1 1 2 0v5.59l1.3-1.3a1 1 0 0 1 1.4 1.42l-3 3A1 1 0 0 1 10 12Z"/><path d="M4 14a1 1 0 0 1 1 1v1h10v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z"/></svg>
            {savingImage ? t("savingImage") : t("saveImage")}
          </button>

          {serverError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          <Turnstile onVerify={setCaptchaToken} />

          <button
            type="submit"
            disabled={submitting || (captchaEnabled && !captchaToken) || (slipRequired && !slipUrl)}
            className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? t("submitting") : t("placeOrder")}
          </button>
        </aside>
      </form>

      {placedOrderNumber && (
        <WechatModal
          orderNumber={placedOrderNumber}
          wechatId={storeWechatId}
          copied={copied}
          onCopy={copyWechatId}
          onClose={() => {
            clearCart();
            router.push(`/orders/${placedOrderNumber}?placed=1`);
          }}
          t={t}
        />
      )}
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="flex justify-between gap-3">
      <dt className="flex-shrink-0 text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function WechatModal({
  orderNumber,
  wechatId,
  copied,
  onCopy,
  onClose,
  t,
}: {
  orderNumber: string;
  wechatId: string;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-emerald-600" aria-hidden="true">
            <path d="M8.5 4C4.91 4 2 6.46 2 9.5c0 1.74.96 3.29 2.46 4.3l-.62 1.86 2.17-1.09c.78.22 1.62.34 2.49.34.2 0 .4-.01.6-.02a4.9 4.9 0 0 1-.1-.98c0-2.9 2.86-5.16 6.2-5.16.22 0 .43.01.64.03C15.2 5.62 12.13 4 8.5 4Z"/>
            <path d="M22 13.7c0-2.43-2.42-4.4-5.4-4.4s-5.4 1.97-5.4 4.4 2.42 4.4 5.4 4.4c.62 0 1.21-.08 1.76-.24l1.6.8-.44-1.33c1.5-.8 2.48-2.13 2.48-3.63Z"/>
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900">{t("wechatModalTitle")}</h3>
        <p className="mt-1.5 text-sm text-slate-500">{t("wechatModalDesc")}</p>

        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <span className="text-slate-500">{t("orderNumber")}</span>{" "}
          <span className="font-mono font-semibold text-slate-900">{orderNumber}</span>
        </div>

        {wechatId && (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3">
            <div className="min-w-0 text-left">
              <p className="text-xs text-slate-500">{t("storeWechat")}</p>
              <p className="truncate font-semibold text-slate-900">{wechatId}</p>
            </div>
            <button
              type="button"
              onClick={onCopy}
              className="flex-shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              {copied ? t("copied") : t("copy")}
            </button>
          </div>
        )}

        <a
          href="weixin://"
          className="mt-3 block w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
        >
          {t("openWechat")}
        </a>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 block w-full rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-500 transition-colors"
        >
          {t("viewMyOrder")}
        </button>
      </div>
    </div>
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
