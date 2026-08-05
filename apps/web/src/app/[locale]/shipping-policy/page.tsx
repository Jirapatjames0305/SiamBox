import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { LEGAL_DOCS } from "@/lib/legal-content";
import { routing, type Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const doc = LEGAL_DOCS.shipping[locale as Locale] ?? LEGAL_DOCS.shipping[routing.defaultLocale];
  return { title: doc.title };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalPage doc="shipping" locale={locale as Locale} />;
}
