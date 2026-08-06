"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";

/**
 * Homepage shortcut into /track. Keeps no results of its own — it hands the phone
 * number to the track page, which does the lookup.
 */
export function TrackLookupInline() {
  const t = useTranslations("Track");
  const router = useRouter();
  const [phone, setPhone] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = phone.trim();
        if (v) router.push(`/track?phone=${encodeURIComponent(v)}`);
      }}
      className="flex flex-col gap-2 sm:flex-row"
    >
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder={t("phonePlaceholder")}
        aria-label={t("phoneLabel")}
        className="min-w-0 flex-1 rounded-md border border-cream-300 bg-white px-3.5 py-2.5 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
      />
      <button
        type="submit"
        disabled={!phone.trim()}
        className="shrink-0 rounded-md bg-maroon-700 px-6 py-2.5 text-sm font-semibold text-cream-100 transition hover:bg-maroon-600 disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        {t("lookupButton")}
      </button>
    </form>
  );
}
