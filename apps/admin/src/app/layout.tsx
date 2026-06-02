import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "SiamBox Admin",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%234E1416'/%3E%3Cpolygon points='50,14 72,36 50,58 28,36' fill='%23C8A24A'/%3E%3Ctext x='50' y='88' font-family='sans-serif' font-weight='bold' font-size='28' text-anchor='middle' fill='%23C8A24A' letter-spacing='2'%3EADMIN%3C/text%3E%3C/svg%3E",
  },
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
