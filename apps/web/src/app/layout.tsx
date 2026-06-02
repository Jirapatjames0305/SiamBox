import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { getLocale } from "next-intl/server";
import { getBuildConfig } from "@/lib/api";
import "./globals.css";

const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-serif",
  display: "swap",
});

const FALLBACK_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%234E1416'/%3E%3Ctext x='50' y='72' font-family='serif' font-weight='bold' font-size='62' text-anchor='middle' fill='%23C8A24A'%3ES%3C/text%3E%3C/svg%3E";

export async function generateMetadata(): Promise<Metadata> {
  let faviconUrl = "";
  try {
    const cfg = await getBuildConfig();
    faviconUrl = cfg.faviconUrl;
  } catch {
    // use fallback
  }
  return {
    title: "SiamBox — Authentic Thai Products",
    description: "Authentic Thai products for global customers.",
    icons: { icon: faviconUrl || FALLBACK_ICON },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale === "zh" ? "zh-CN" : locale} className={serif.variable}>
      <body className="bg-cream-50 text-stone-800 antialiased">{children}</body>
    </html>
  );
}
