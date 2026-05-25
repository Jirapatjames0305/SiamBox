"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { addPackageToCart, type PackageCartLine } from "@/lib/cart";

type Props = {
  pkg: Omit<PackageCartLine, "kind" | "lineId" | "quantity">;
  disabled?: boolean;
};

export function AddToCartButton({ pkg, disabled }: Props) {
  const t = useTranslations("ProductDetail");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const router = useRouter();

  function handleAdd() {
    addPackageToCart({ ...pkg, quantity: qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {/* Quantity stepper */}
        <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-11 w-11 items-center justify-center text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 transition-colors"
            disabled={disabled || qty <= 1}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          </button>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            className="h-11 w-12 border-x border-slate-200 bg-white text-center text-sm font-medium text-slate-900 outline-none"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="flex h-11 w-11 items-center justify-center text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 transition-colors"
            disabled={disabled}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled}
          className={`h-11 flex-1 rounded-xl px-6 text-sm font-semibold transition-all ${
            added
              ? "bg-emerald-600 text-white"
              : "bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          }`}
        >
          {added ? t("added") : t("addPackageToCart")}
        </button>
        <button
          type="button"
          onClick={() => {
            addPackageToCart({ ...pkg, quantity: qty });
            router.push("/cart");
          }}
          disabled={disabled}
          className="h-11 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:text-slate-400 transition-colors"
        >
          {t("buyNow")}
        </button>
      </div>
    </div>
  );
}
