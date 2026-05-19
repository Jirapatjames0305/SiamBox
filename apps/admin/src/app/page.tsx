"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, fetchStats } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { Stats } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : (err as Error).message);
      });
  }, []);

  const cards = [
    { label: "ออเดอร์วันนี้", value: stats?.ordersToday },
    { label: "รอชำระเงิน", value: stats?.pendingPayment, href: "/orders?status=PENDING_PAYMENT" },
    { label: "กำลังแพ็ก", value: stats?.packing, href: "/orders?status=PACKING" },
    { label: "จัดส่งแล้ว", value: stats?.shipped, href: "/orders?status=SHIPPED" },
    { label: "ส่งถึงแล้ว", value: stats?.delivered, href: "/orders?status=DELIVERED" },
    {
      label: "รายได้รวม (ชำระแล้ว)",
      value: stats ? formatPrice(stats.revenueCents) : undefined,
      isMoney: true,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">แดชบอร์ด</h1>
      <p className="mt-1 text-sm text-neutral-500">ภาพรวมร้านวันนี้</p>

      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const inner = (
            <div className="rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-neutral-400">
              <div className="text-sm text-neutral-500">{card.label}</div>
              <div className="mt-1 text-2xl font-semibold">
                {card.value === undefined ? "—" : card.value}
              </div>
            </div>
          );
          return card.href ? (
            <Link key={card.label} href={card.href}>
              {inner}
            </Link>
          ) : (
            <div key={card.label}>{inner}</div>
          );
        })}
      </section>
    </div>
  );
}
