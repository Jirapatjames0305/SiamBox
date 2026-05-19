import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "SiamBox Admin",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="bg-neutral-50 text-neutral-900 antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
