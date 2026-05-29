"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ApiError, fetchOrders } from "@/lib/api";
import { ORDER_STATUSES, STATUS_LABEL_TH, formatDate, formatPrice, statusBadgeClass } from "@/lib/format";
import type { Order } from "@/lib/types";

export default function OrdersPage() {
  const params = useSearchParams();
  const status = params.get("status") ?? "";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchOrders(status || undefined)
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : (err as Error).message);
        setLoading(false);
      });
  }, [status]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">ออเดอร์</h1>
        <span className="text-sm text-neutral-500">{orders.length} รายการ</span>
      </div>

      <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-amber-300 bg-amber-100" /> ส่งด่วน (3-5 วัน)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-neutral-300 bg-white" /> ธรรมดา (7-15 วัน)
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <FilterLink href="/orders" active={!status}>
          ทั้งหมด
        </FilterLink>
        {ORDER_STATUSES.map((s) => (
          <FilterLink key={s} href={`/orders?status=${s}`} active={status === s}>
            {STATUS_LABEL_TH[s]}
          </FilterLink>
        ))}
      </div>

      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">เลขออเดอร์</th>
              <th className="px-4 py-3">วันที่สั่ง</th>
              <th className="px-4 py-3">ผู้รับ</th>
              <th className="px-4 py-3">รายการ</th>
              <th className="px-4 py-3">ยอดรวม</th>
              <th className="px-4 py-3">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-neutral-500">
                  Loading…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-neutral-500">
                  ไม่มีออเดอร์
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr
                  key={o.id}
                  className={
                    o.shippingMethod === "EXPRESS"
                      ? "bg-amber-50 hover:bg-amber-100"
                      : "hover:bg-neutral-50"
                  }
                >
                  <td className="px-4 py-3">
                    <Link href={`/orders/${o.orderNumber}`} className="font-medium underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{formatDate(o.placedAt)}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {o.shippingAddress?.recipient ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{o.items.length}</td>
                  <td className="px-4 py-3 font-medium">{formatPrice(o.totalCents, o.currency)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(o.status)}`}
                    >
                      {STATUS_LABEL_TH[o.status as keyof typeof STATUS_LABEL_TH] ?? o.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 ${
        active
          ? "border-neutral-900 bg-neutral-900 text-white"
          : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
      }`}
    >
      {children}
    </Link>
  );
}
