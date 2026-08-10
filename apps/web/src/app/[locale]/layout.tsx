import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { ContactWidget } from "@/components/ContactWidget";
import { PresencePinger } from "@/components/PresencePinger";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { MarketGate } from "@/components/MarketGate";
import { getMarket } from "@/lib/market-server";
import { Toaster } from "@/components/Toaster";
import { getBuildConfig } from "@/lib/api";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("title"), template: "%s · SiamBox" },
    description: t("description"),
    keywords: t("keywords").split(","),
    openGraph: {
      siteName: "SiamBox",
      locale: locale === "zh" ? "zh_CN" : locale,
      type: "website",
    },
  };
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
  // null when GeoIP could not place the visitor — MarketGate then asks them.
  const market = await getMarket();

  let logoUrl = "";
  let contactLineUrl = "";
  let contactWechatId = "";
  let contactWechatQrUrl = "";
  let currencyRates: Record<string, number> | undefined;
  let availableMarkets: string[] = [];
  try {
    const cfg = await getBuildConfig();
    currencyRates = cfg.currencyRates;
    availableMarkets = cfg.availableMarkets ?? [];
    logoUrl = cfg.logoUrl;
    contactLineUrl = cfg.contactLineUrl;
    contactWechatId = cfg.contactWechatId;
    contactWechatQrUrl = cfg.contactWechatQrUrl;
  } catch {
    // fall back to inline SVG logo / default contact info
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <CurrencyProvider rates={currencyRates}>
      {/* Only offer a choice when there is more than one stocked market — otherwise the
          picker would send someone to an empty shop. */}
      <Navbar
        logoUrl={logoUrl}
        market={market ?? "CN"}
        showMarketSwitcher={availableMarkets.length > 1}
      />
      {availableMarkets.length > 1 && <MarketGate resolved={market} />}
      {children}
      <Footer logoUrl={logoUrl} wechatId={contactWechatId} />
      <ContactWidget lineUrl={contactLineUrl} wechatId={contactWechatId} wechatQrUrl={contactWechatQrUrl} />
      <PresencePinger />
      <Toaster />
      </CurrencyProvider>
    </NextIntlClientProvider>
  );
}
