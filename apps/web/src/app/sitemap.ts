import type { MetadataRoute } from "next";
import { listPackages, listProducts } from "@/lib/api";
import { routing } from "@/i18n/routing";
import { localeUrl } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ["", "/products", "/build", "/partner"];

  let productPaths: string[] = [];
  try {
    const [products, packages] = await Promise.all([listProducts(), listPackages()]);
    productPaths = [
      ...products.filter((p) => p.active).map((p) => `/products/${p.slug}`),
      ...packages.filter((p) => p.active).map((p) => `/products/${p.slug}`),
    ];
  } catch {
    // API unavailable — still emit static pages
  }

  const entries: MetadataRoute.Sitemap = [];
  for (const path of [...staticPaths, ...productPaths]) {
    for (const locale of routing.locales) {
      entries.push({
        url: localeUrl(locale, path),
        changeFrequency: path.startsWith("/products/") ? "weekly" : "daily",
        priority: path === "" ? 1 : path.startsWith("/products/") ? 0.8 : 0.6,
      });
    }
  }
  return entries;
}
