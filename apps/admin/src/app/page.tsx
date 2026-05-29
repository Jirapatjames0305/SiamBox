"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, fetchStats } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { Fireworks } from "@/components/Fireworks";
import type { Stats } from "@/lib/types";

// Order milestones — fireworks fire when a new one is crossed.
const MILESTONES = [1000, 2000, 5000, 10000, 25000, 50000, 100000];
const CELEBRATED_KEY = "siambox_celebrated_milestone";

function nextMilestone(count: number): number {
  return MILESTONES.find((m) => count < m) ?? Math.ceil((count + 1) / 100000) * 100000;
}
function prevMilestone(count: number): number {
  return [...MILESTONES].reverse().find((m) => count >= m) ?? 0;
}
function highestAchieved(count: number): number {
  return [...MILESTONES].reverse().find((m) => count >= m) ?? 0;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fireworks, setFireworks] = useState<string | null>(null);

  useEffect(() => {
    fetchStats()
      .then((s) => {
        setStats(s);
        // Celebrate only the first time we cross each milestone.
        const achieved = highestAchieved(s.totalOrders);
        const celebrated = Number(localStorage.getItem(CELEBRATED_KEY) ?? "0");
        if (achieved > celebrated) {
          localStorage.setItem(CELEBRATED_KEY, String(achieved));
          setFireworks(`ทะลุ ${achieved.toLocaleString()} ออเดอร์แล้ว!`);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : (err as Error).message);
      });
  }, []);

  const total = stats?.totalOrders ?? 0;
  const next = nextMilestone(total);
  const prev = prevMilestone(total);
  const pct = Math.min(100, Math.round(((total - prev) / (next - prev)) * 100));
  const remaining = Math.max(0, next - total);

  const cards = [
    { label: "ออเดอร์วันนี้", value: stats?.ordersToday },
    { label: "รอชำระเงิน", value: stats?.pendingPayment, href: "/orders?status=PENDING_PAYMENT" },
    { label: "กำลังแพ็ก", value: stats?.packing, href: "/orders?status=PACKING" },
    { label: "จัดส่งแล้ว", value: stats?.shipped, href: "/orders?status=SHIPPED" },
    { label: "ส่งถึงแล้ว", value: stats?.delivered, href: "/orders?status=DELIVERED" },
    {
      label: "รายได้รวม (ชำระแล้ว)",
      value: stats ? formatPrice(stats.revenueCents) : undefined,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {fireworks && <Fireworks message={fireworks} onDone={() => setFireworks(null)} />}

      <h1 className="text-2xl font-semibold tracking-tight">แดชบอร์ด</h1>
      <p className="mt-1 text-sm text-neutral-500">ภาพรวมร้านวันนี้</p>

      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Order goal */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-indigo-100">เป้าหมายออเดอร์</div>
            <div className="mt-1 text-4xl font-extrabold tracking-tight">
              {total.toLocaleString()}
              <span className="text-xl font-semibold text-indigo-200"> / {next.toLocaleString()}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFireworks(`ทะลุ ${next.toLocaleString()} ออเดอร์แล้ว!`)}
            className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/25"
          >
            🎆 ดูตัวอย่างพลุ
          </button>
        </div>

        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-300 to-yellow-400 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-indigo-100">
          <span>{pct}%</span>
          <span>อีก {remaining.toLocaleString()} ออเดอร์ถึงเป้า {next.toLocaleString()}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {MILESTONES.map((m) => {
            const done = total >= m;
            const isNext = m === next;
            return (
              <span
                key={m}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  done
                    ? "bg-amber-300 text-amber-900"
                    : isNext
                      ? "bg-white/25 text-white ring-1 ring-white/50"
                      : "bg-white/10 text-indigo-200"
                }`}
              >
                {done ? "✓ " : isNext ? "→ " : ""}
                {m.toLocaleString()}
              </span>
            );
          })}
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
