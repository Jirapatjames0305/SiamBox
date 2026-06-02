"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ApiError,
  addBestSeller,
  fetchBestSellers,
  fetchProducts,
  randomizeBestSellers,
  removeBestSeller,
} from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { BestSeller, Product } from "@/lib/types";

export default function BestSellersPage() {
  const [rows, setRows] = useState<BestSeller[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pick, setPick] = useState("");

  async function load() {
    setError(null);
    try {
      const [bs, ps] = await Promise.all([fetchBestSellers(), fetchProducts()]);
      setRows(bs);
      setProducts(ps);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const featuredIds = useMemo(() => new Set(rows.map((r) => r.productId)), [rows]);
  const addable = products.filter((p) => !featuredIds.has(p.id));

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">สินค้าขายดี</h1>
        <span className="text-sm text-neutral-500">{rows.length} รายการ</span>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        เลือกสินค้าที่จะโปรโมทในเซกชัน “สินค้าขายดี” บนหน้าแรกของเว็บ — เพิ่มได้ไม่จำกัด
        หากเกิน 6 ชิ้น หน้าเว็บจะสุ่มแสดง 6 ชิ้นจากรายการนี้
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => randomizeBestSellers(6))}
          className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          สุ่มสินค้า (6 ชิ้น)
        </button>

        {addable.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={pick}
              onChange={(e) => setPick(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            >
              <option value="">เพิ่มสินค้า…</option>
              {addable.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameTh}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={busy || !pick}
              onClick={() =>
                run(async () => {
                  await addBestSeller(pick);
                  setPick("");
                })
              }
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:border-neutral-500 disabled:opacity-50"
            >
              เพิ่ม
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="mt-8 text-sm text-neutral-500">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500">
          ยังไม่มีสินค้าขายดี — กด “สุ่มสินค้า” หรือเพิ่มเอง
        </div>
      ) : (
        <table className="mt-6 w-full border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-neutral-400">
              <th className="px-3 py-1 font-medium">#</th>
              <th className="px-3 py-1 font-medium">สินค้า</th>
              <th className="px-3 py-1 font-medium">ราคา</th>
              <th className="px-3 py-1" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="bg-white">
                <td className="rounded-l-lg border border-r-0 border-neutral-200 px-3 py-2 text-neutral-500">{i + 1}</td>
                <td className="border-y border-neutral-200 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                      {r.product.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.product.images[0]} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-neutral-900">{r.product.nameTh}</div>
                      <div className="text-xs text-neutral-400">{r.product.sku}</div>
                    </div>
                  </div>
                </td>
                <td className="border-y border-neutral-200 px-3 py-2 text-neutral-700">
                  {formatPrice(r.product.priceCents, r.product.currency)}
                </td>
                <td className="rounded-r-lg border border-l-0 border-neutral-200 px-3 py-2 text-right">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => removeBestSeller(r.productId))}
                    className="rounded-md border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
