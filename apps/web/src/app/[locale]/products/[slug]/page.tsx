import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getBuildConfig, getPackageBySlug, getProductBySlug, listProducts } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { localizedDescription, localizedName } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";
import { AddToBoxButton } from "@/components/AddToBoxButton";
import { CategoryCarousel } from "../CategoryCarousel";
import { AddToCartButton } from "./AddToCartButton";
import { ImageGallery } from "./ImageGallery";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  setRequestLocale(locale);

  const product = await getProductBySlug(slug);
  if (product) return <ProductView product={product} locale={locale as Locale} />;

  // Fallback: legacy package detail (kept so existing package links still resolve).
  return <PackageView slug={slug} locale={locale as Locale} />;
}

async function ProductView({
  product,
  locale,
}: {
  product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;
  locale: Locale;
}) {
  const tProducts = await getTranslations("Products");
  const tDetail = await getTranslations("ProductDetail");
  const tCat = await getTranslations("Categories");

  const name = localizedName(product, locale);
  const description = localizedDescription(product, locale);
  const inStock = product.stock > 0;

  let minCents = 0;
  try {
    minCents = (await getBuildConfig()).customPackageMinCents;
  } catch {
    // no minimum
  }

  const related =
    product.category && product.active
      ? (await listProducts())
          .filter((p) => p.category === product.category && p.id !== product.id)
          .slice(0, 8)
      : [];

  const catLabel = product.category
    ? tCat.has(product.category)
      ? tCat(product.category)
      : product.category
    : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/products" className="transition-colors hover:text-blue-600">
          {tProducts("title")}
        </Link>
        {catLabel && product.category && (
          <>
            <span>/</span>
            <Link
              href={`/products?category=${encodeURIComponent(product.category)}`}
              className="transition-colors hover:text-blue-600"
            >
              {catLabel}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="line-clamp-1 text-slate-800">{name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <ImageGallery images={product.images} alt={name} fallbackLabel={tProducts("noImage")} />

        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{name}</h1>

          <div className="mt-4 text-4xl font-black text-blue-600">
            {formatPrice(product.priceCents, product.currency)}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                inStock ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-emerald-500" : "bg-red-400"}`} />
              {inStock ? tDetail("inStock") : tProducts("outOfStock")}
            </span>
            {inStock && (
              <span className="text-slate-500">
                {tDetail("stock")}: {tDetail("stockCount", { count: product.stock })}
              </span>
            )}
            {product.weightGrams ? (
              <span className="text-slate-500">
                {tDetail("weight")}: {product.weightGrams} g
              </span>
            ) : null}
          </div>

          <div className="my-6 border-t border-slate-200" />

          {inStock ? (
            <AddToBoxButton
              product={product}
              minCents={minCents}
              className="block w-full rounded-xl bg-blue-600 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            />
          ) : (
            <button
              type="button"
              disabled
              className="block w-full cursor-not-allowed rounded-xl bg-slate-200 py-3 text-center text-sm font-semibold text-slate-400"
            >
              {tProducts("outOfStock")}
            </button>
          )}

          {description && (
            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{description}</p>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-lg font-bold text-slate-900">{tDetail("relatedTitle")}</h2>
          <CategoryCarousel products={related} minCents={minCents} />
        </section>
      )}
    </main>
  );
}

async function PackageView({ slug, locale }: { slug: string; locale: Locale }) {
  const tProducts = await getTranslations("Products");
  const tDetail = await getTranslations("ProductDetail");

  const pkg = await getPackageBySlug(slug);
  if (!pkg) notFound();

  const name = localizedName(pkg, locale);
  const description = localizedDescription(pkg, locale);
  const inStock = pkg.items.every((it) => it.product.stock >= it.quantity);

  const pkgCategories = new Set(
    pkg.items.map((it) => it.product.category).filter((c): c is string => !!c),
  );
  const pkgProductIds = new Set(pkg.items.map((it) => it.productId));
  const availableAddons =
    pkgCategories.size > 0
      ? (await listProducts())
          .filter((p) => p.category && pkgCategories.has(p.category))
          .filter((p) => !pkgProductIds.has(p.id) && p.stock > 0)
          .map((p) => ({
            productId: p.id,
            nameTh: p.nameTh,
            nameZh: p.nameZh,
            nameEn: p.nameEn,
            priceCents: p.priceCents,
            image: p.images[0],
          }))
      : [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/products" className="transition-colors hover:text-blue-600">
          {tProducts("title")}
        </Link>
        <span>/</span>
        <span className="line-clamp-1 text-slate-800">{name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <ImageGallery images={pkg.images} alt={name} fallbackLabel={tProducts("noImage")} />

        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{name}</h1>

          <div className="mt-4 text-4xl font-black text-blue-600">
            {formatPrice(pkg.priceCents, pkg.currency)}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                inStock ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-emerald-500" : "bg-red-400"}`} />
              {inStock ? tDetail("inStock") : tProducts("outOfStock")}
            </span>
          </div>

          <div className="my-6 border-t border-slate-200" />

          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {tDetail("packageContents")}
            </p>
            <ul className="space-y-2">
              {pkg.items.map((it) => (
                <li key={it.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{localizedName(it.product, locale)}</span>
                  <span className="font-medium text-slate-900">× {it.quantity}</span>
                </li>
              ))}
            </ul>
          </div>

          <AddToCartButton
            pkg={{
              packageId: pkg.id,
              slug: pkg.slug,
              nameTh: pkg.nameTh,
              nameZh: pkg.nameZh,
              nameEn: pkg.nameEn,
              basePriceCents: pkg.priceCents,
              image: pkg.images[0],
            }}
            availableAddons={availableAddons}
            locale={locale}
            disabled={!inStock}
          />

          {description && (
            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{description}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
