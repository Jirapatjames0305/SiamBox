import type { Locale } from "@/i18n/routing";
import type { Product } from "@/lib/api";

type Named = {
  nameTh: string;
  nameZh: string | null;
  nameEn: string | null;
};

export function localizedName<T extends Named>(item: T, locale: Locale): string {
  if (locale === "zh") return item.nameZh ?? item.nameTh;
  if (locale === "en") return item.nameEn ?? item.nameZh ?? item.nameTh;
  return item.nameTh;
}

export function localizedDescription(product: Product, locale: Locale): string {
  if (locale === "zh") return product.descriptionZh ?? product.descriptionTh ?? "";
  if (locale === "en")
    return product.descriptionEn ?? product.descriptionZh ?? product.descriptionTh ?? "";
  return product.descriptionTh ?? "";
}
