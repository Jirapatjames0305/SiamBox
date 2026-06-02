import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export async function Footer({ logoUrl = "" }: { logoUrl?: string }) {
  const t = await getTranslations("Footer");

  const columns = [
    {
      title: t("shop"),
      links: [
        { label: t("shopProducts"), href: "/products" },
        { label: t("shopBuild"), href: "/build" },
        { label: t("shopRequest"), href: "/request-product" },
        // { label: t("shopTrack"), href: "/track" },
      ],
    },
    {
      title: t("service"),
      links: [
        // { label: t("serviceHelp"), href: "/track" },
        // { label: t("serviceShipping"), href: "/track" },
        // { label: t("serviceReturns"), href: "/track" },
        { label: t("serviceTrack"), href: "/track" },
      ],
    },
  ];

  return (
    <footer id="footer" className="scroll-mt-24 bg-maroon-950 text-cream-200">
      {/* Trust strip */}
      <div className="border-b border-gold-700/20 bg-maroon-900/40">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-6 text-sm sm:grid-cols-3">
          {[
            {
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0"><path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>,
              label: t("trustSecure"),
            },
            {
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0"><path d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/></svg>,
              label: t("trustReturns"),
            },
            {
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0"><path d="M3.75 12h.75m15.75 0h-.75M12 3.75A8.25 8.25 0 003.75 12v3.75m0 0A2.25 2.25 0 006 18H4.5A2.25 2.25 0 012.25 15.75v-1.5A2.25 2.25 0 014.5 12H6m13.5 3.75A2.25 2.25 0 0117.25 18h-1.5A2.25 2.25 0 0113.5 15.75v-1.5A2.25 2.25 0 0115.75 12H18A8.25 8.25 0 0012 3.75z"/></svg>,
              label: t("trustSupport"),
            },
          ].map((b) => (
            <div key={b.label} className="flex items-center justify-center gap-2 text-center text-cream-200/90">
              {b.icon}
              <span>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-6">
        {/* Brand */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="SIAMBOX" className="h-7 w-7 object-contain" />
            ) : (
              <svg viewBox="0 0 12 12" fill="currentColor" className="h-5 w-5 text-gold-400" aria-hidden="true"><polygon points="6,0 12,6 6,12 0,6"/></svg>
            )}
            <span className="font-serif text-xl font-bold tracking-wide text-gold-400">SIAMBOX</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream-300/70">{t("tagline")}</p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold text-gold-300">{col.title}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-cream-300/70 transition-colors hover:text-gold-300">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Contact + newsletter */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-gold-300">{t("contact")}</h3>
          <ul className="mt-3 space-y-1.5 text-sm text-cream-300/70">
            <li>Line: @siambox</li>
            <li>WeChat: Siambox</li>
            <li className="break-all">
              Email:{" "}
              <a href="mailto:Jongjongdisupport@gmail.com" className="hover:text-gold-300">
                Jongjongdisupport@gmail.com
              </a>
            </li>
          </ul>
          {/* <form className="mt-4 flex">
            <input
              type="email"
              placeholder={t("emailPlaceholder")}
              className="h-9 min-w-0 flex-1 rounded-l-md border border-gold-700/30 bg-maroon-900/60 px-3 text-sm text-cream-100 placeholder:text-cream-300/40 outline-none focus:border-gold-500"
            />
            <button
              type="submit"
              className="rounded-r-md bg-gold-500 px-3 text-sm font-semibold text-maroon-950 hover:bg-gold-400"
            >
              {t("subscribe")}
            </button>
          </form> */}
        </div>
      </div>

      <div className="border-t border-gold-700/20 py-5 text-center text-xs text-cream-300/50">
        © 2026 SIAMBOX Co., Ltd. {t("rights")}
      </div>
    </footer>
  );
}
