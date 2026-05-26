"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { addPackageToCart, type PackageAddon, type PackageCartLine } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { localizedName } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";

type PackageBase = Omit<PackageCartLine, "kind" | "lineId" | "quantity" | "priceCents" | "addons">;

type AddonOption = {
  productId: string;
  nameTh: string;
  nameZh: string | null;
  nameEn: string | null;
  priceCents: number;
  image?: string;
};

type Props = {
  pkg: PackageBase;
  availableAddons: AddonOption[];
  locale: Locale;
  disabled?: boolean;
};

export function AddToCartButton({ pkg, availableAddons, locale, disabled }: Props) {
  const t = useTranslations("ProductDetail");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [addonQty, setAddonQty] = useState<Record<string, number>>({});
  const router = useRouter();

  const selectedAddons = useMemo<PackageAddon[]>(
    () =>
      availableAddons.flatMap((a) => {
        const q = addonQty[a.productId] ?? 0;
        if (q <= 0) return [];
        return [
          {
            productId: a.productId,
            nameTh: a.nameTh,
            nameZh: a.nameZh,
            nameEn: a.nameEn,
            priceCents: a.priceCents,
            quantity: q,
            image: a.image,
          },
        ];
      }),
    [availableAddons, addonQty],
  );

  const addonsTotalPerUnit = selectedAddons.reduce((s, a) => s + a.priceCents * a.quantity, 0);
  const unitPrice = pkg.basePriceCents + addonsTotalPerUnit;
  const lineTotal = unitPrice * qty;

  function bumpAddon(productId: string, delta: number) {
    setAddonQty((m) => {
      const next = Math.max(0, (m[productId] ?? 0) + delta);
      if (next === 0) {
        const { [productId]: _omit, ...rest } = m;
        return rest;
      }
      return { ...m, [productId]: next };
    });
  }

  function handleAdd() {
    addPackageToCart({ ...pkg, quantity: qty, addons: selectedAddons.length > 0 ? selectedAddons : undefined });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="space-y-4">
      {availableAddons.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("addExtras")}
            </p>
            <p className="text-xs text-slate-400">{t("sameCategoryOnly")}</p>
          </div>
          <ul className="mt-3 space-y-2">
            {availableAddons.map((a) => {
              const qty = addonQty[a.productId] ?? 0;
              return (
                <li key={a.productId} className="flex items-center gap-3">
                  {a.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.image} alt="" className="h-10 w-10 flex-shrink-0 rounded-md object-cover" />
                  ) : (
                    <div className="h-10 w-10 flex-shrink-0 rounded-md bg-slate-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-800">
                      {localizedName(a, locale)}
                    </p>
                    <p className="text-xs text-slate-500">+{formatPrice(a.priceCents)}</p>
                  </div>
                  <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => bumpAddon(a.productId, -1)}
                      disabled={qty <= 0}
                      className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-slate-800">{qty}</span>
                    <button
                      type="button"
                      onClick={() => bumpAddon(a.productId, 1)}
                      className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
        <div>
          <p className="text-xs text-slate-500">{t("unitPrice")}</p>
          <p className="text-base font-semibold text-slate-900">{formatPrice(unitPrice)}</p>
          {addonsTotalPerUnit > 0 && (
            <p className="text-[11px] text-slate-400">
              {formatPrice(pkg.basePriceCents)} + {formatPrice(addonsTotalPerUnit)}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">{t("lineTotal")}</p>
          <p className="text-lg font-bold text-blue-600">{formatPrice(lineTotal)}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
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
          {added ? t("added") : t("addToCart")}
        </button>
        <button
          type="button"
          onClick={() => {
            addPackageToCart({ ...pkg, quantity: qty, addons: selectedAddons.length > 0 ? selectedAddons : undefined });
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
