import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SiamBox",
  description: "Cross-border ecommerce from Thailand to China.",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232563EB'/%3E%3Ctext x='50' y='75' font-family='sans-serif' font-weight='bold' font-size='60' text-anchor='middle' fill='white'%3EJ%3C/text%3E%3Ccircle cx='72' cy='28' r='12' fill='%23F59E0B' stroke='white' stroke-width='3'/%3E%3C/svg%3E",
  },
};

// html/body live in [locale]/layout.tsx so next-intl can set the lang attribute
// per locale. Next.js shows a dev warning about this but the app renders correctly.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children as React.ReactElement;
}
