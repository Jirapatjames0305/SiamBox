"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createProductRequest, uploadProductRequestImage } from "@/lib/api";

export default function RequestProductPage() {
  const t = useTranslations("RequestProduct");
  const [productName, setProductName] = useState("");
  const [detail, setDetail] = useState("");
  const [contact, setContact] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImage(file: File) {
    setError(null);
    setUploading(true);
    try {
      setImageUrl(await uploadProductRequestImage(file));
    } catch {
      setError(t("uploadError"));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createProductRequest(
        {
          productName: productName.trim(),
          detail: detail.trim() || undefined,
          contact: contact.trim() || undefined,
          imageUrl: imageUrl ?? undefined,
        },
      );
      setDone(true);
    } catch {
      setError(t("error"));
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setProductName("");
    setDetail("");
    setContact("");
    setImageUrl(null);
    setDone(false);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("title")}</h1>
      <p className="mt-2 text-sm text-slate-500">{t("subtitle")}</p>

      {done ? (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-12 w-12 text-emerald-600"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p className="mt-3 text-lg font-semibold text-emerald-800">{t("thanks")}</p>
          <p className="mt-1 text-sm text-emerald-700">{t("thanksHint")}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-5 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
          >
            {t("again")}
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
        >
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              {t("productName")} <span className="text-red-500">*</span>
            </span>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder={t("productNamePlaceholder")}
              required
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">{t("detail")}</span>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={4}
              placeholder={t("detailPlaceholder")}
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-300 bg-slate-100 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">{t("contact")}</span>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t("contactPlaceholder")}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            />
          </label>

          <div>
            <span className="text-sm font-medium text-slate-700">{t("image")}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
              className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-300"
            />
            {uploading && <p className="mt-2 text-xs text-slate-500">{t("uploading")}</p>}
            {imageUrl && !uploading && (
              <div className="mt-2 flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="h-20 w-20 rounded-md border border-slate-200 object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="text-xs text-red-500 hover:underline"
                >
                  {t("removeImage")}
                </button>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting || uploading || !productName.trim()}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {submitting ? t("submitting") : t("submit")}
          </button>
        </form>
      )}
    </main>
  );
}
