"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { routing, type Locale } from "@/i18n/routing";
import { cartItemCount, useCart, useCartHydrated } from "@/lib/cart";

const LOCALE_LABEL: Record<Locale, string> = {
  zh: "中",
  th: "ไทย",
  en: "EN",
};

export function Navbar() {
  const t = useTranslations("Nav");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const cart = useCart();
  const hydrated = useCartHydrated();
  const count = hydrated ? cartItemCount(cart) : 0;
  const [mobileOpen, setMobileOpen] = useState(false);

  function switchLocale(next: Locale) {
    router.replace(pathname, { locale: next });
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-0.5 font-bold text-lg tracking-tight">
          <span className="text-blue-500">Siam</span>
          <span className="text-white">Box</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5">
          <Link
            href="/products"
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            {t("products")}
          </Link>
          <Link
            href="/track"
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            {t("track")}
          </Link>

          <div className="inline-flex overflow-hidden rounded-lg border border-slate-700">
            {routing.locales.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => switchLocale(l)}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  l === locale
                    ? "bg-blue-600 text-white"
                    : "bg-transparent text-slate-400 hover:text-white"
                }`}
              >
                {LOCALE_LABEL[l]}
              </button>
            ))}
          </div>

          <Link
            href="/cart"
            className="relative inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            <CartIcon />
            {t("cart")}
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-blue-600">
                {count}
              </span>
            )}
          </Link>
        </nav>

        {/* Mobile: cart + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5"
          >
            <CartIcon />
            {count > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-slate-950">
          <div className="flex flex-col gap-1 p-4">
            <Link
              href="/products"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white"
            >
              {t("products")}
            </Link>
            <Link
              href="/track"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white"
            >
              {t("track")}
            </Link>
            <div className="mt-2 flex items-center gap-2 px-3">
              <span className="text-xs text-slate-600">{t("language")}:</span>
              <div className="inline-flex overflow-hidden rounded-lg border border-slate-700">
                {routing.locales.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => switchLocale(l)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      l === locale
                        ? "bg-blue-600 text-white"
                        : "bg-transparent text-slate-400"
                    }`}
                  >
                    {LOCALE_LABEL[l]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function CartIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
