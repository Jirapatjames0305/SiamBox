import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getBuildConfig, listProducts } from "@/lib/api";
import { FadeInUp } from "@/components/FadeInUp";
import { ProductCard } from "./ProductCard";
import { CategoryCarousel } from "./CategoryCarousel";
import { ProductSearch } from "./ProductSearch";

// Sentinel category key for products without a category.
const OTHER = "__other__";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Products" });
  return { title: `${t("title")} · SiamBox` };
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { locale } = await params;
  const { category, q } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("Products");
  const tCat = await getTranslations("Categories");

  let products = [] as Awaited<ReturnType<typeof listProducts>>;
  let minCents = 0;
  let error: string | null = null;
  try {
    products = await listProducts();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed";
  }
  try {
    minCents = (await getBuildConfig()).customPackageMinCents;
  } catch {
    // no minimum if config unavailable
  }

  const keyOf = (c: string | null) => c ?? OTHER;
  const labelOf = (k: string) => {
    if (k === OTHER) return t("uncategorized");
    return tCat.has(k) ? tCat(k) : k;
  };

  // Distinct category keys, preserving first-seen order.
  const categoryKeys: string[] = [];
  for (const p of products) {
    const k = keyOf(p.category);
    if (!categoryKeys.includes(k)) categoryKeys.push(k);
  }

  // ── Filtered view: a single category as a full grid ──
  let view: React.ReactNode;
  if (category) {
    const filtered =
      category === OTHER ? products.filter((p) => !p.category) : products.filter((p) => p.category === category);
    view = (
      <>
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{labelOf(category)}</h2>
          <Link href="/products" className="text-sm font-medium text-blue-600 hover:underline">
            ← {t("allCategories")}
          </Link>
        </div>
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-slate-400">{t("noProducts")}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p, i) => (
              <li key={p.id} className="h-full">
                <FadeInUp delay={i * 50} className="h-full">
                  <ProductCard product={p} minCents={minCents} />
                </FadeInUp>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  } else {
    // ── Default view: a carousel per category ──
    view = (
      <div className="space-y-12">
        {categoryKeys.map((k) => {
          const items = products.filter((p) => keyOf(p.category) === k);
          return (
            <section key={k}>
              <div className="mb-4 flex items-baseline justify-between gap-2">
                <h2 className="text-lg font-bold text-slate-900">{labelOf(k)}</h2>
                <Link
                  href={`/products?category=${encodeURIComponent(k)}`}
                  className="shrink-0 text-sm font-medium text-blue-600 hover:underline"
                >
                  {t("viewAll")} →
                </Link>
              </div>
              <CategoryCarousel products={items} minCents={minCents} />
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <FadeInUp>
        <div className="mb-6 flex items-baseline justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("title")}</h1>
          {products.length > 0 && (
            <span className="text-sm text-slate-500">{t("productsCount", { count: products.length })}</span>
          )}
        </div>
      </FadeInUp>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {t("errorLoading")} · {error}
        </div>
      )}

      {!error && products.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-slate-400">{t("noProducts")}</p>
        </div>
      ) : (
        <ProductSearch products={products} minCents={minCents} initialQuery={q?.trim() ?? ""}>
          {view}
        </ProductSearch>
      )}
    </main>
  );
}
