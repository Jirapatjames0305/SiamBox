import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getPackageBySlug } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { localizedDescription, localizedName } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";
import { AddToCartButton } from "./AddToCartButton";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const tProducts = await getTranslations("Products");

  const pkg = await getPackageBySlug(slug);
  if (!pkg) notFound();

  const name = localizedName(pkg, locale as Locale);
  const description = localizedDescription(pkg, locale as Locale);
  // Package is in-stock if every contained product has enough stock for at least 1 package
  const inStock = pkg.items.every((it) => it.product.stock >= it.quantity);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/products" className="hover:text-blue-600 transition-colors">
          {tProducts("title")}
        </Link>
        <span>/</span>
        <span className="text-slate-800 line-clamp-1">{name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        {/* Image */}
        <div className="overflow-hidden rounded-2xl bg-slate-100 shadow-sm border border-slate-200">
          <div className="aspect-square w-full">
            {pkg.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pkg.images[0]} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-300">
                <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <span className="text-sm">{tProducts("noImage")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{name}</h1>

          <div className="mt-4 text-4xl font-black text-blue-600">
            {formatPrice(pkg.priceCents, pkg.currency)}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${inStock ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-emerald-500" : "bg-red-400"}`} />
              {inStock ? "พร้อมส่ง" : tProducts("outOfStock")}
            </span>
          </div>

          <div className="my-6 border-t border-slate-200" />

          {/* Package contents */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              สินค้าในแพ็กเกจ
            </p>
            <ul className="space-y-2">
              {pkg.items.map((it) => {
                const itemName = localizedName(it.product, locale as Locale);
                return (
                  <li key={it.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{itemName}</span>
                    <span className="font-medium text-slate-900">× {it.quantity}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <AddToCartButton
            pkg={{
              packageId: pkg.id,
              slug: pkg.slug,
              nameTh: pkg.nameTh,
              nameZh: pkg.nameZh,
              nameEn: pkg.nameEn,
              priceCents: pkg.priceCents,
              image: pkg.images[0],
            }}
            disabled={!inStock}
          />

          {description && (
            <div className="mt-8 rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{description}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
