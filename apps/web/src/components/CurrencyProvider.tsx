"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  BASE_CURRENCY,
  CURRENCIES,
  FALLBACK_RATES,
  convert,
  formatMoney,
  isCurrency,
  type Currency,
} from "@/lib/currency";

const STORAGE_KEY = "siambox.currency";

type Ctx = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** Formats a CNY amount in the shopper's chosen currency. */
  format: (cents: number) => string;
  /** True when the displayed figure is a conversion, not the amount charged. */
  isConverted: boolean;
};

const CurrencyContext = createContext<Ctx | null>(null);

export function CurrencyProvider({
  children,
  rates,
}: {
  children: React.ReactNode;
  /** Rates out of CNY, from /api/packages/config. Falls back to the static table. */
  rates?: Partial<Record<Currency, number>>;
}) {
  // Always start on the base currency so the server-rendered markup and the first
  // client render agree; the stored preference is applied after mount.
  const [currency, setCurrencyState] = useState<Currency>(BASE_CURRENCY);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && isCurrency(saved)) setCurrencyState(saved);
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    window.localStorage.setItem(STORAGE_KEY, c);
  }, []);

  const resolved = useMemo(
    () => ({ ...FALLBACK_RATES, ...(rates ?? {}) }) as Record<Currency, number>,
    [rates],
  );

  const value = useMemo<Ctx>(
    () => ({
      currency,
      setCurrency,
      isConverted: currency !== BASE_CURRENCY,
      format: (cents: number) =>
        formatMoney(
          currency === BASE_CURRENCY ? cents : convert(cents, currency, resolved),
          currency,
        ),
    }),
    [currency, setCurrency, resolved],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): Ctx {
  const ctx = useContext(CurrencyContext);
  if (ctx) return ctx;
  // Rendered outside the provider (e.g. an isolated test) — behave as base currency.
  return {
    currency: BASE_CURRENCY,
    setCurrency: () => {},
    isConverted: false,
    format: (cents: number) => formatMoney(cents, BASE_CURRENCY),
  };
}

/**
 * A price in the shopper's chosen currency.
 *
 * `fixedCurrency` pins the amount to a currency that must not be converted — order
 * records show what was actually charged, and re-quoting those at today's rate would
 * misstate the transaction.
 */
export function Price({
  cents,
  fixedCurrency,
  className,
}: {
  cents: number;
  fixedCurrency?: string;
  className?: string;
}) {
  const { format, isConverted } = useCurrency();
  if (fixedCurrency) {
    return <span className={className}>{formatMoney(cents, fixedCurrency)}</span>;
  }
  // No "≈" marker on the figure itself — the tooltip carries the caveat instead, so a
  // shopper who checks still learns the charge is taken in CNY at the gateway's rate.
  return (
    <span className={className} title={isConverted ? "ตัดเงินจริงเป็น CNY" : undefined}>
      {format(cents)}
    </span>
  );
}

export function CurrencySwitcher({ className = "" }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {CURRENCIES.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setCurrency(c)}
          aria-pressed={c === currency}
          className={`rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${
            c === currency
              ? "bg-gold-500 text-maroon-950"
              : "text-cream-200 hover:text-gold-300"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
