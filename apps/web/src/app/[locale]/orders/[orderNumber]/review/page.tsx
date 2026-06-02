"use client";

import { use, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { getOrderReviewState, submitReview, type OrderReviewState } from "@/lib/api";

export default function ReviewPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = use(params);
  const t = useTranslations("Review");

  const [state, setState] = useState<OrderReviewState | null | undefined>(undefined);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOrderReviewState(orderNumber)
      .then((s) => {
        setState(s);
        if (s) setName(s.recipientName);
      })
      .catch(() => setState(null));
  }, [orderNumber]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || !name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitReview(orderNumber, { authorName: name.trim(), rating, comment: comment.trim() });
      setDone(true);
    } catch {
      setError(t("error"));
    } finally {
      setSubmitting(false);
    }
  }

  function Card({ children }: { children: React.ReactNode }) {
    return (
      <main className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-2xl border border-cream-300 bg-white p-8 text-center shadow-sm">{children}</div>
        <div className="mt-6 text-center">
          <Link href={`/orders/${orderNumber}`} className="text-sm font-medium text-maroon-700 hover:underline">
            ← {t("backToOrder")}
          </Link>
        </div>
      </main>
    );
  }

  if (state === undefined) {
    return <main className="mx-auto max-w-xl px-4 py-12 text-center text-sm text-stone-500">…</main>;
  }
  if (state === null) {
    return <Card><p className="text-stone-600">{t("notFound")}</p></Card>;
  }
  if (done || state.review) {
    return (
      <Card>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-12 w-12 text-emerald-600"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <p className="mt-3 text-lg font-semibold text-maroon-900">{done ? t("thanks") : t("alreadyReviewed")}</p>
        <p className="mt-1 text-sm text-stone-500">{t("thanksHint")}</p>
      </Card>
    );
  }
  if (!state.eligible) {
    return <Card><p className="text-stone-600">{t("notDelivered")}</p></Card>;
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <div className="text-center">
        <h1 className="font-serif text-3xl font-bold text-maroon-900">{t("title")}</h1>
        <p className="mt-2 text-sm text-stone-600">{t("subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl border border-cream-300 bg-white p-6 shadow-sm">
        <div>
          <span className="text-sm font-medium text-stone-700">{t("ratingLabel")}</span>
          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                className="text-gold-500"
                aria-label={`${n}`}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className={`h-8 w-8 transition ${n <= (hover || rating) ? "" : "opacity-25"}`}>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">{t("nameLabel")}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            maxLength={80}
            className="mt-1.5 w-full rounded-xl border border-stone-300 bg-cream-50 px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-maroon-600"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">{t("commentLabel")}</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder={t("commentPlaceholder")}
            className="mt-1.5 w-full resize-none rounded-xl border border-stone-300 bg-cream-50 px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-maroon-600"
          />
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !comment.trim() || !name.trim()}
          className="w-full rounded-xl bg-maroon-800 py-3 text-sm font-semibold text-cream-100 transition hover:bg-maroon-700 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
        >
          {submitting ? t("submitting") : t("submit")}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link href={`/orders/${orderNumber}`} className="text-sm font-medium text-maroon-700 hover:underline">
          ← {t("backToOrder")}
        </Link>
      </div>
    </main>
  );
}
