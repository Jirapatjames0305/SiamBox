import { setRequestLocale } from "next-intl/server";
import { getBuildConfig, listProducts } from "@/lib/api";
import { BuildClient } from "./BuildClient";

export default async function BuildPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ add?: string }>;
}) {
  const { locale } = await params;
  const { add } = await searchParams;
  setRequestLocale(locale);

  const [products, config] = await Promise.all([listProducts(), getBuildConfig()]);

  const initialProductIds = add ? add.split(",").filter(Boolean) : [];

  return (
    <BuildClient
      products={products}
      minCents={config.customPackageMinCents}
      initialProductIds={initialProductIds}
    />
  );
}
