import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function OrderNotFound() {
  const t = await getTranslations("Order");
  const tCart = await getTranslations("Cart");
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold">{t("notFound")}</h1>
      <Link href="/products" className="mt-6 inline-block text-sm underline">
        ← {tCart("browseProducts")}
      </Link>
    </main>
  );
}
