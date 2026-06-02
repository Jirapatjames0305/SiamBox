import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { ContactWidget } from "@/components/ContactWidget";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/Toaster";
import { getBuildConfig } from "@/lib/api";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  let logoUrl = "";
  try {
    logoUrl = (await getBuildConfig()).logoUrl;
  } catch {
    // fall back to inline SVG logo
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Navbar logoUrl={logoUrl} />
      {children}
      <Footer logoUrl={logoUrl} />
      <ContactWidget />
      <Toaster />
    </NextIntlClientProvider>
  );
}
