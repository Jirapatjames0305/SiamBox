"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchOnlineSessions } from "@/lib/api";
import type { OnlineSession } from "@/lib/types";

// Slider steps: 5s → 10min
const INTERVAL_STEPS = [5, 10, 15, 30, 60, 120, 300, 600];
const INTERVAL_KEY = "siambox.admin.presence.interval";
const DEFAULT_INTERVAL = 30;

function intervalLabel(seconds: number): string {
  return seconds < 60 ? `${seconds} วินาที` : `${seconds / 60} นาที`;
}

function flagEmoji(countryCode: string): string {
  return countryCode.replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

const countryNames = new Intl.DisplayNames(["th"], { type: "region" });

function countryLabel(code: string | null): string {
  if (!code) return "ไม่ทราบ";
  try {
    return `${flagEmoji(code)} ${countryNames.of(code) ?? code}`;
  } catch {
    return code;
  }
}

function agoLabel(ts: number, now: number): string {
  const sec = Math.max(0, Math.round((now - ts) / 1000));
  if (sec < 60) return `${sec} วิที่แล้ว`;
  return `${Math.floor(sec / 60)} นาทีที่แล้ว`;
}

export function OnlineVisitors() {
  const [sessions, setSessions] = useState<OnlineSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(INTERVAL_STEPS.indexOf(DEFAULT_INTERVAL));
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);

  // Restore saved interval once on mount
  useEffect(() => {
    const saved = Number(localStorage.getItem(INTERVAL_KEY));
    const idx = INTERVAL_STEPS.indexOf(saved);
    if (idx >= 0) setStepIndex(idx);
  }, []);

  const intervalSec = INTERVAL_STEPS[stepIndex] ?? DEFAULT_INTERVAL;

  const load = useCallback(() => {
    fetchOnlineSessions()
      .then((data) => {
        setSessions(data);
        setError(null);
        setLastFetchedAt(Date.now());
      })
      .catch((err: unknown) => setError((err as Error).message));
  }, []);

  useEffect(() => {
    load();
    const handle = setInterval(load, intervalSec * 1000);
    return () => clearInterval(handle);
  }, [load, intervalSec]);

  const byCountry = new Map<string, number>();
  for (const s of sessions) {
    const key = s.country ?? "??";
    byCountry.set(key, (byCountry.get(key) ?? 0) + 1);
  }
  const now = Date.now();

  return (
    <section className="mt-6 rounded-lg border border-neutral-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <h2 className="text-sm font-semibold">ออนไลน์ตอนนี้</h2>
          <span className="text-sm text-neutral-500">{sessions.length} คน</span>
        </div>
        <label className="flex items-center gap-2 text-xs text-neutral-500">
          รีเฟรชทุก
          <input
            type="range"
            min={0}
            max={INTERVAL_STEPS.length - 1}
            step={1}
            value={stepIndex}
            onChange={(e) => {
              const idx = Number(e.target.value);
              setStepIndex(idx);
              localStorage.setItem(INTERVAL_KEY, String(INTERVAL_STEPS[idx] ?? DEFAULT_INTERVAL));
            }}
            className="h-1.5 w-32 cursor-pointer accent-neutral-900"
          />
          <span className="w-16 font-medium text-neutral-700">{intervalLabel(intervalSec)}</span>
        </label>
      </div>

      {byCountry.size > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pt-3">
          {[...byCountry.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([code, count]) => (
              <span
                key={code}
                className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-700"
              >
                {countryLabel(code === "??" ? null : code)} · {count}
              </span>
            ))}
        </div>
      )}

      {error && <div className="px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="overflow-x-auto p-2">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-3 py-2">ประเทศ</th>
              <th className="px-3 py-2">หน้าที่กำลังดู</th>
              <th className="px-3 py-2">ภาษา</th>
              <th className="px-3 py-2">IP</th>
              <th className="px-3 py-2">ล่าสุด</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-neutral-400">
                  ยังไม่มีใครออนไลน์
                </td>
              </tr>
            ) : (
              sessions.map((s) => (
                <tr key={s.sessionId}>
                  <td className="px-3 py-2 whitespace-nowrap">{countryLabel(s.country)}</td>
                  <td className="max-w-[220px] truncate px-3 py-2 text-neutral-600">{s.path}</td>
                  <td className="px-3 py-2 text-neutral-600">{s.locale ?? "—"}</td>
                  <td className="px-3 py-2 text-neutral-500">{s.ip}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-neutral-500">
                    {agoLabel(s.lastSeenAt, now)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {lastFetchedAt && (
        <div className="border-t border-neutral-100 px-4 py-2 text-right text-xs text-neutral-400">
          อัปเดตล่าสุด {new Date(lastFetchedAt).toLocaleTimeString("th-TH")}
        </div>
      )}
    </section>
  );
}
