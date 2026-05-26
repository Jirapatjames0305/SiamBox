import { setRequestLocale } from "next-intl/server";
import { getBuildConfig, listProducts } from "@/lib/api";
import { BuildClient } from "./BuildClient";

export default async function BuildPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [products, config] = await Promise.all([listProducts(), getBuildConfig()]);

  return <BuildClient products={products} minCents={config.customPackageMinCents} />;
}
