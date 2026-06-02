"use client";

import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/format";
import { addToCustomDraft } from "@/lib/cart";
import { showToast } from "@/lib/toast";
import type { Product } from "@/lib/api";

// Quick-add a product into the in-progress custom package (no navigation) and toast how much
// more is needed to reach the minimum order. Shared by /products cards and homepage best sellers.
export function AddToBoxButton({
  product: p,
  minCents = 0,
  className,
  label,
}: {
  product: Product;
  minCents?: number;
  className?: string;
  label?: string;
}) {
  const t = useTranslations("Products");

  function handleAdd() {
    const subtotal = addToCustomDraft({
      productId: p.id,
      nameTh: p.nameTh,
      nameZh: p.nameZh,
      nameEn: p.nameEn,
      priceCents: p.priceCents,
      image: p.images[0],
    });
    const remaining = minCents - subtotal;
    if (minCents > 0 && remaining > 0) {
      showToast(t("toastRemaining", { amount: formatPrice(remaining) }));
    } else if (minCents > 0) {
      showToast(t("toastReady"));
    } else {
      showToast(t("addedToBox"));
    }
  }

  return (
    <button type="button" onClick={handleAdd} className={className}>
      {label ?? t("addProduct")}
    </button>
  );
}
