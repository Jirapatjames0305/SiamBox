"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, fetchCustomers } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";
import type { Customer } from "@/lib/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | "ACTIVE" | "BLACKLISTED">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      fetchCustomers({ q: q || undefined, status: status || undefined })
        .then((data) => {
          setCustomers(data);
          setError(null);
        })
        .catch((err) => setError(err instanceof ApiError ? err.message : (err as Error).message))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(handle);
  }, [q, status]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">ลูกค้า</h1>
        <span className="text-sm text-neutral-500">{customers.length} ราย</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหา ชื่อ / เบอร์โทร / WeChat"
          className="h-9 flex-1 min-w-[200px] rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-500"
        />
        <div className="flex gap-2 text-sm">
          <FilterButton active={status === ""} onClick={() => setStatus("")}>ทั้งหมด</FilterButton>
          <FilterButton active={status === "ACTIVE"} onClick={() => setStatus("ACTIVE")}>ปกติ</FilterButton>
          <FilterButton active={status === "BLACKLISTED"} onClick={() => setStatus("BLACKLISTED")}>Blacklist</FilterButton>
        </div>
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
              <th className="px-4 py-3">ชื่อ</th>
              <th className="px-4 py-3">เบอร์โทร</th>
              <th className="px-4 py-3">WeChat</th>
              <th className="px-4 py-3">ออเดอร์</th>
              <th className="px-4 py-3">ออเดอร์ล่าสุด</th>
              <th className="px-4 py-3">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-neutral-500">Loading…</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-neutral-500">ไม่พบลูกค้า</td></tr>
            ) : (
              customers.map((c) => {
                const last = c.orders?.[0];
                return (
                  <tr key={c.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link href={`/customers/${c.id}`} className="font-medium underline">
                        {c.name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{c.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-600">{c.wechatId ?? "—"}</td>
                    <td className="px-4 py-3 font-medium">{c._count?.orders ?? 0}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {last ? (
                        <>
                          {formatDate(last.placedAt)}
                          <span className="ml-2 text-xs text-neutral-400">
                            {formatPrice(last.totalCents, last.currency)}
                          </span>
                        </>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                          c.status === "BLACKLISTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-900"
                        }`}
                      >
                        {c.status === "BLACKLISTED" ? "Blacklist" : "ปกติ"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 ${
        active ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
      }`}
    >
      {children}
    </button>
  );
}
