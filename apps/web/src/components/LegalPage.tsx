import { LEGAL_DOCS, type LegalDocKey } from "@/lib/legal-content";
import { COMPANY } from "@/lib/company";
import type { Locale } from "@/i18n/routing";

const OPERATED_BY: Record<Locale, string> = {
  th: "ดำเนินการโดย",
  zh: "运营方",
  en: "Operated by",
};

const UPDATED_LABEL: Record<Locale, string> = {
  th: "ปรับปรุงล่าสุด",
  zh: "最后更新",
  en: "Last updated",
};

/**
 * Shared layout for the four policy pages. Every one of them closes with the operating
 * company's registered details — payment gateway reviewers check that the entity on the
 * site matches the entity on the application, and a policy with no identifiable
 * publisher behind it does not satisfy that.
 */
export function LegalPage({ doc, locale }: { doc: LegalDocKey; locale: Locale }) {
  const content = LEGAL_DOCS[doc][locale];

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{content.title}</h1>
      <p className="mt-2 text-sm text-slate-500">
        {UPDATED_LABEL[locale]}: {content.updated}
      </p>

      {content.intro && (
        <p className="mt-6 leading-relaxed text-slate-700">{content.intro}</p>
      )}

      <div className="mt-8 space-y-8">
        {content.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-semibold text-slate-900">{section.heading}</h2>
            <ul className="mt-3 space-y-2">
              {section.body.map((line) => (
                <li key={line} className="flex gap-2 leading-relaxed text-slate-700">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-600">
        <p className="font-medium text-slate-800">
          {OPERATED_BY[locale]}:{" "}
          {locale === "th" ? COMPANY.legalNameTh : COMPANY.legalNameEn}
        </p>
        <p className="mt-1">
          {locale === "th" ? COMPANY.addressTh : COMPANY.addressEn}
        </p>
        {COMPANY.registrationNo && (
          <p className="mt-1">
            {locale === "th" ? "เลขทะเบียนนิติบุคคล" : locale === "zh" ? "公司注册号" : "Company registration no."}:{" "}
            {COMPANY.registrationNo}
          </p>
        )}
        <p className="mt-1">
          {locale === "th" ? "อีเมล" : locale === "zh" ? "邮箱" : "Email"}:{" "}
          <a href={`mailto:${COMPANY.email}`} className="underline hover:text-slate-900">
            {COMPANY.email}
          </a>
          {COMPANY.phone && (
            <>
              {" · "}
              {locale === "th" ? "โทร" : locale === "zh" ? "电话" : "Tel"}: {COMPANY.phone}
            </>
          )}
        </p>
      </footer>
    </main>
  );
}
