"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createPartnerInquiry } from "@/lib/api";

const TYPES = ["wholesale", "oem", "distributor", "crossborder", "other"] as const;

export default function PartnerPage() {
  const t = useTranslations("Partner");
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    contact: "",
    email: "",
    partnerType: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.companyName.trim() || !form.contactName.trim() || !form.contact.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createPartnerInquiry({
        companyName: form.companyName.trim(),
        contactName: form.contactName.trim(),
        contact: form.contact.trim(),
        email: form.email.trim() || undefined,
        partnerType: form.partnerType || undefined,
        message: form.message.trim() || undefined,
      });
      setDone(true);
    } catch {
      setError(t("error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 text-gold-600">
          <span className="h-px w-8 bg-gold-500" />
          <span className="text-xs font-semibold uppercase tracking-[0.3em]">{t("eyebrow")}</span>
          <span className="h-px w-8 bg-gold-500" />
        </div>
        <h1 className="mt-4 font-serif text-3xl font-bold text-maroon-900 sm:text-4xl">{t("title")}</h1>
        <p className="mt-3 text-sm text-stone-600">{t("subtitle")}</p>
      </div>

      {done ? (
        <div className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-12 w-12 text-emerald-600"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p className="mt-3 text-lg font-semibold text-emerald-800">{t("thanks")}</p>
          <p className="mt-1 text-sm text-emerald-700">{t("thanksHint")}</p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-4 rounded-2xl border border-cream-300 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("companyName")} required value={form.companyName} onChange={(v) => set("companyName", v)} placeholder={t("companyPlaceholder")} />
            <Field label={t("contactName")} required value={form.contactName} onChange={(v) => set("contactName", v)} placeholder={t("contactNamePlaceholder")} />
            <Field label={t("contact")} required value={form.contact} onChange={(v) => set("contact", v)} placeholder={t("contactPlaceholder")} />
            <Field label={t("email")} value={form.email} onChange={(v) => set("email", v)} placeholder={t("emailPlaceholder")} type="email" />
          </div>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">{t("type")}</span>
            <select
              value={form.partnerType}
              onChange={(e) => set("partnerType", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-stone-300 bg-cream-50 px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-maroon-600"
            >
              <option value="">{t("typePlaceholder")}</option>
              {TYPES.map((ty) => (
                <option key={ty} value={ty}>
                  {t(`type_${ty}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">{t("message")}</span>
            <textarea
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              rows={4}
              placeholder={t("messagePlaceholder")}
              className="mt-1.5 w-full resize-none rounded-xl border border-stone-300 bg-cream-50 px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-maroon-600"
            />
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !form.companyName.trim() || !form.contactName.trim() || !form.contact.trim()}
            className="w-full rounded-xl bg-maroon-800 py-3 text-sm font-semibold text-cream-100 transition hover:bg-maroon-700 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
          >
            {submitting ? t("submitting") : t("submit")}
          </button>
        </form>
      )}
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-stone-300 bg-cream-50 px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-maroon-600"
      />
    </label>
  );
}
