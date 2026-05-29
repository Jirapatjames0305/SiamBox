"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  orderNumber: string;
  initialStatus: string;
  /** Translated copy from server */
  pollingLabel: string;
};

const POLL_MS = 4000;
const MAX_POLLS = 30; // ~2 minutes

export function OrderStatusPoller({ orderNumber, initialStatus, pollingLabel }: Props) {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (initialStatus !== "PENDING_PAYMENT") return;
    let cancelled = false;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

    async function tick() {
      if (cancelled) return;
      attemptsRef.current += 1;
      try {
        // POST /refresh-payment syncs from ChillPay + returns latest status
        const res = await fetch(`${apiUrl}/api/orders/${orderNumber}/refresh-payment`, {
          method: "POST",
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          const status = json?.data?.status;
          if (status && status !== "PENDING_PAYMENT") {
            setDone(true);
            router.refresh();
            return;
          }
        }
      } catch {
        // ignore network errors, retry
      }
      if (attemptsRef.current < MAX_POLLS && !cancelled) {
        setTimeout(tick, POLL_MS);
      } else {
        setDone(true);
      }
    }

    // Kick off immediately on mount (don't wait POLL_MS), then poll
    const handle = setTimeout(tick, 500);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [orderNumber, initialStatus, router]);

  if (initialStatus !== "PENDING_PAYMENT" || done) return null;

  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
      <svg className="h-5 w-5 flex-shrink-0 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span>{pollingLabel}</span>
    </div>
  );
}
