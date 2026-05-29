"use client";

import { useEffect, useState } from "react";
import {
  ApiError,
  deleteProductRequest,
  fetchProductRequests,
  setProductRequestStatus,
} from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { ProductRequest } from "@/lib/types";

export default function ProductRequestsPage() {
  const [rows, setRows] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchProductRequests());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const newCount = rows.filter((r) => r.status === "NEW").length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">รีเควสสินค้า</h1>
        <span className="text-sm text-neutral-500">{newCount} รายการใหม่</span>
      </div>
      <p className="mt-1 text-sm text-neutral-500">คำขอสินค้าจากลูกค้าหน้าเว็บ</p>

      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-8 text-sm text-neutral-500">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500">
          ยังไม่มีคำขอสินค้า
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className={`rounded-lg border p-4 ${
                r.status === "DONE" ? "border-neutral-200 bg-neutral-50 opacity-70" : "border-neutral-200 bg-white"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 gap-3">
                  {r.imageUrl && (
                    <a href={r.imageUrl} target="_blank" rel="noreferrer" className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={r.imageUrl}
                        alt=""
                        className="h-16 w-16 rounded-md border border-neutral-200 object-cover hover:opacity-90"
                      />
                    </a>
                  )}
                  <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-900">{r.productName}</span>
                    {r.status === "NEW" ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        ใหม่
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                        จัดการแล้ว
                      </span>
                    )}
                  </div>
                  {r.detail && <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600">{r.detail}</p>}
                  <div className="mt-1.5 flex flex-wrap gap-x-4 text-xs text-neutral-500">
                    {r.contact && <span>ติดต่อ: {r.contact}</span>}
                    <span>{formatDate(r.createdAt)}</span>
                  </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await setProductRequestStatus(r.id, r.status === "DONE" ? "NEW" : "DONE");
                      await load();
                    }}
                    className="rounded-md border border-neutral-300 px-3 py-1 text-xs text-neutral-700 hover:border-neutral-500"
                  >
                    {r.status === "DONE" ? "ทำเครื่องหมายว่ายังไม่จัดการ" : "จัดการแล้ว"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm("ลบคำขอนี้?")) return;
                      await deleteProductRequest(r.id);
                      await load();
                    }}
                    className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
