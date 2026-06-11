"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { routing, type Locale } from "@/i18n/routing";
import { cartItemCount, useCart, useCartHydrated } from "@/lib/cart";

const LOCALE_LABEL: Record<Locale, string> = { zh: "中文", th: "ไทย", en: "EN" };

const NAV = [
  { href: "/", key: "home" },
  { href: "/products", key: "products" },
  // { href: "/build", key: "build" },
  { href: "/request-product", key: "requestProduct" },
  { href: "/track", key: "track" },
] as const;

export function Navbar({ logoUrl = "" }: { logoUrl?: string }) {
  const t = useTranslations("Nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const cart = useCart();
  const hydrated = useCartHydrated();
  const count = hydrated ? cartItemCount(cart) : 0;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");

  // /build and /products have their own in-page product search, so hide the navbar search there.
  const hideSearch = pathname.startsWith("/build") || pathname.startsWith("/products");

  function search(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 shadow-lg shadow-maroon-950/20">
      {/* Top utility bar */}
      <div className="hidden bg-maroon-950 text-cream-200 md:block">
        <div className="mx-auto flex h-9 max-w-6xl items-center justify-between px-4 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-gold-400">●</span>
            <span>{t("serviceNote")}</span>
            <span className="text-cream-300/40">·</span>
            <button
              type="button"
              onClick={() => document.getElementById("footer")?.scrollIntoView({ behavior: "smooth" })}
              className="hover:text-gold-300"
            >
              {t("help")}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-cream-300">CNY ¥</span>
            <div className="inline-flex overflow-hidden rounded border border-gold-700/40">
              {routing.locales.map((l) => (
                <Link
                  key={l}
                  href={pathname}
                  locale={l}
                  className={`px-2 py-0.5 transition-colors ${
                    l === locale ? "bg-gold-500 text-maroon-950" : "text-cream-200 hover:text-gold-300"
                  }`}
                >
                  {LOCALE_LABEL[l]}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="bg-gradient-to-b from-maroon-800 to-maroon-900">
        <div className="mx-auto flex h-20 max-w-6xl items-center gap-4 px-4">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="SIAMBOX" className="h-8 w-8 object-contain" />
            ) : (
              <svg viewBox="0 0 12 12" fill="currentColor" className="h-6 w-6 text-gold-400" aria-hidden="true"><polygon points="6,0 12,6 6,12 0,6"/></svg>
            )}
            <span className="leading-tight">
              <span className="block font-serif text-xl font-bold tracking-wide text-gold-400 sm:text-2xl">SIAMBOX</span>
              <span className="hidden text-[10px] uppercase tracking-[0.25em] text-cream-300/70 sm:block">
                Authentic Thai Products
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="ml-6 hidden flex-1 items-center gap-6 lg:flex">
            {NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative whitespace-nowrap text-sm font-medium transition-colors ${
                    active ? "text-gold-300" : "text-cream-100 hover:text-gold-300"
                  }`}
                >
                  {t(item.key)}
                  {active && <span className="absolute -bottom-1.5 left-0 h-0.5 w-full bg-gold-400" />}
                </Link>
              );
            })}
          </nav>

          {/* Search (desktop) */}
          {!hideSearch && (
            <form onSubmit={search} className="ml-auto hidden items-center md:flex">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="h-9 w-40 rounded-l-md border border-gold-700/40 bg-maroon-950/40 px-3 text-sm text-cream-100 placeholder:text-cream-300/50 outline-none focus:border-gold-500 lg:w-52"
              />
              <button
                type="submit"
                className="flex h-9 items-center rounded-r-md bg-gold-500 px-3 text-maroon-950 hover:bg-gold-400"
                aria-label="Search"
              >
                <SearchIcon />
              </button>
            </form>
          )}

          {/* Cart */}
          <Link
            href="/cart"
            className="relative ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-cream-100 hover:bg-white/10 md:ml-0"
          >
            <CartIcon />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gold-500 px-1 text-xs font-bold text-maroon-950">
                {count}
              </span>
            )}
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-cream-100 hover:bg-white/10 lg:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-gold-700/30 bg-maroon-900 lg:hidden">
          <div className="flex flex-col gap-1 p-4">
            {!hideSearch && (
              <form onSubmit={search} className="mb-2 flex">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="h-10 flex-1 rounded-l-md border border-gold-700/40 bg-maroon-950/40 px-3 text-sm text-cream-100 placeholder:text-cream-300/50 outline-none"
                />
                <button type="submit" className="rounded-r-md bg-gold-500 px-3 text-maroon-950">
                  <SearchIcon />
                </button>
              </form>
            )}
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-cream-100 hover:bg-white/10 hover:text-gold-300"
              >
                {t(item.key)}
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-2 px-3">
              <span className="text-xs text-cream-300/60">{t("language")}:</span>
              <div className="inline-flex overflow-hidden rounded border border-gold-700/40">
                {routing.locales.map((l) => (
                  <Link
                    key={l}
                    href={pathname}
                    locale={l}
                    onClick={() => setMobileOpen(false)}
                    className={`px-3 py-1 text-xs ${
                      l === locale ? "bg-gold-500 text-maroon-950" : "text-cream-200"
                    }`}
                  >
                    {LOCALE_LABEL[l]}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
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
