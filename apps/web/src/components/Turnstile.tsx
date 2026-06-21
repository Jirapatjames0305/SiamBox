"use client";

import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// True when a Turnstile site key is configured. Forms use this to decide whether to
// require a CAPTCHA token before enabling submit. Unset (local dev) → CAPTCHA is skipped.
export const captchaEnabled = !!SITE_KEY;

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      remove: (id: string) => void;
    };
  }
}

// Cloudflare Turnstile widget. Calls onVerify with the token once solved, or null when
// it expires/errors. Renders nothing when no site key is configured.
export function Turnstile({ onVerify }: { onVerify: (token: string | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    function render() {
      if (cancelled || !ref.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY!,
        callback: (token) => onVerify(token),
        "expired-callback": () => onVerify(null),
        "error-callback": () => onVerify(null),
      });
    }

    if (window.turnstile) {
      render();
    } else if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = render;
      document.head.appendChild(script);
    } else {
      const iv = setInterval(() => {
        if (window.turnstile) {
          clearInterval(iv);
          render();
        }
      }, 200);
      return () => {
        cancelled = true;
        clearInterval(iv);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [onVerify]);

  if (!SITE_KEY) return null;
  return <div ref={ref} className="mt-1" />;
}
