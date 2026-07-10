"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const SESSION_KEY = "siambox.presence.session";
const PING_INTERVAL_MS = 30_000;

function getSessionId(): string {
  let id = window.sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function PresencePinger() {
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    const ping = () => {
      fetch(`${API_URL}/api/presence/ping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId(), path: pathname, locale }),
        keepalive: true,
      }).catch(() => {
        // presence is best-effort
      });
    };
    ping();
    const interval = setInterval(ping, PING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [pathname, locale]);

  return null;
}
