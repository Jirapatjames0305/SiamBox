"use client";

import { useEffect, useState } from "react";
import { ApiError, deleteReview, fetchReviews, setReviewStatus } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Review } from "@/lib/types";
import { useDialog } from "@/components/Dialog";

const STATUS_BADGE: Record<Review["status"], { label: string; className: string }> = {
  PENDING: { label: "รออนุมัติ", className: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "เผยแพร่แล้ว", className: "bg-emerald-100 text-emerald-800" },
  REJECTED: { label: "ปฏิเสธ", className: "bg-red-100 text-red-700" },
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 ${i < rating ? "" : "opacity-25"}`}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const { confirm } = useDialog();
  const [rows, setRows] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchReviews());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const pendingCount = rows.filter((r) => r.status === "PENDING").length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">รีวิว</h1>
        <span className="text-sm text-neutral-500">{pendingCount} รออนุมัติ</span>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        รีวิวจากลูกค้าที่ได้รับสินค้าแล้ว — อนุมัติเพื่อแสดงบนหน้าแรกของเว็บ
      </p>

      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="mt-8 text-sm text-neutral-500">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500">
          ยังไม่มีรีวิว
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((r) => {
            const badge = STATUS_BADGE[r.status];
            return (
              <li
                key={r.id}
                className={`rounded-lg border p-4 ${
                  r.status === "APPROVED" ? "border-neutral-200 bg-white" : "border-neutral-200 bg-neutral-50"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars rating={r.rating} />
                      <span className="font-medium text-neutral-900">{r.authorName}</span>
                      {r.location && <span className="text-xs text-neutral-500">· {r.location}</span>}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-600">{r.comment}</p>
                    <div className="mt-1.5 text-xs text-neutral-400">
                      {r.order.orderNumber} · {formatDate(r.createdAt)}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {r.status !== "APPROVED" && (
                      <button
                        type="button"
                        onClick={async () => {
                          await setReviewStatus(r.id, "APPROVED");
                          await load();
                        }}
                        className="rounded-md border border-emerald-300 px-3 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                      >
                        อนุมัติ
                      </button>
                    )}
                    {r.status !== "REJECTED" && (
                      <button
                        type="button"
                        onClick={async () => {
                          await setReviewStatus(r.id, r.status === "APPROVED" ? "PENDING" : "REJECTED");
                          await load();
                        }}
                        className="rounded-md border border-neutral-300 px-3 py-1 text-xs text-neutral-700 hover:border-neutral-500"
                      >
                        {r.status === "APPROVED" ? "ซ่อน" : "ปฏิเสธ"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        if (!(await confirm({ message: "ลบรีวิวนี้?", danger: true, confirmText: "ลบ" }))) return;
                        await deleteReview(r.id);
                        await load();
                      }}
                      className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
