import type { Locale } from "@/i18n/routing";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://siambox.shop";

// localePrefix is "as-needed": zh (default locale) has no URL prefix.
export function localeUrl(locale: Locale, path = ""): string {
  const prefix = locale === "zh" ? "" : `/${locale}`;
  return `${SITE_URL}${prefix}${path}`;
}

export function alternatesFor(path: string, locale: Locale) {
  return {
    canonical: localeUrl(locale, path),
    languages: {
      "zh-CN": localeUrl("zh", path),
      th: localeUrl("th", path),
      en: localeUrl("en", path),
      "x-default": localeUrl("zh", path),
    },
  };
}
