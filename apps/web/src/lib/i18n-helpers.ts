import type { Locale } from "@/i18n/routing";

type Named = {
  nameTh: string;
  nameZh: string | null;
  nameEn: string | null;
};

type Described = {
  descriptionTh: string | null;
  descriptionZh: string | null;
  descriptionEn: string | null;
};

export function localizedName<T extends Named>(item: T, locale: Locale): string {
  if (locale === "zh") return item.nameZh ?? item.nameTh;
  if (locale === "en") return item.nameEn ?? item.nameZh ?? item.nameTh;
  return item.nameTh;
}

export function localizedDescription<T extends Described>(item: T, locale: Locale): string {
  if (locale === "zh") return item.descriptionZh ?? item.descriptionTh ?? "";
  if (locale === "en")
    return item.descriptionEn ?? item.descriptionZh ?? item.descriptionTh ?? "";
  return item.descriptionTh ?? "";
}
