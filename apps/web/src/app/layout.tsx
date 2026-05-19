import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SiamBox",
  description: "Cross-border ecommerce from Thailand to China.",
};

// html/body live in [locale]/layout.tsx so next-intl can set the lang attribute
// per locale. Next.js shows a dev warning about this but the app renders correctly.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children as React.ReactElement;
}
