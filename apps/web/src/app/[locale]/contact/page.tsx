import type { Metadata } from "next";
import { COMPANY } from "@/lib/company";
import type { Locale } from "@/i18n/routing";

// The page a payment gateway's compliance team opens first: it has to name the legal
// entity behind the shop, its registration number and registered address, plus a way
// to reach a human. Everything here comes from lib/company.ts so there is one place
// to keep it in step with the company certificate.
const COPY = {
  th: {
    title: "ติดต่อเรา",
    lead: "มีคำถามเกี่ยวกับคำสั่งซื้อ การจัดส่ง หรือการคืนเงิน ติดต่อได้ทุกช่องทางด้านล่าง เราตอบกลับภายใน 1 วันทำการ",
    channels: "ช่องทางติดต่อ",
    company: "ข้อมูลนิติบุคคล",
    legalName: "ชื่อนิติบุคคล",
    regNo: "เลขทะเบียนนิติบุคคล / เลขประจำตัวผู้เสียภาษี",
    address: "ที่อยู่จดทะเบียน",
    phone: "โทรศัพท์",
    hours: "เวลาทำการ",
    hoursValue: "จันทร์–ศุกร์ 09:00–18:00 น. (เวลาประเทศไทย, GMT+7)",
    brandNote: `${COMPANY.brand} เป็นแบรนด์ร้านค้าออนไลน์ภายใต้การดำเนินงานของบริษัทข้างต้น`,
  },
  zh: {
    title: "联系我们",
    lead: "关于订单、配送或退款的任何问题，欢迎通过以下方式联系我们，我们将在 1 个工作日内回复。",
    channels: "联系方式",
    company: "公司信息",
    legalName: "公司名称",
    regNo: "公司注册号 / 纳税人识别号",
    address: "注册地址",
    phone: "电话",
    hours: "工作时间",
    hoursValue: "周一至周五 09:00–18:00（泰国时间 GMT+7）",
    brandNote: `${COMPANY.brand} 是上述公司运营的网络零售品牌。`,
  },
  en: {
    title: "Contact Us",
    lead: "Questions about an order, delivery or a refund — reach us on any channel below. We reply within one business day.",
    channels: "Contact channels",
    company: "Company details",
    legalName: "Registered name",
    regNo: "Company registration / Tax ID",
    address: "Registered address",
    phone: "Phone",
    hours: "Business hours",
    hoursValue: "Monday–Friday, 09:00–18:00 (Thailand time, GMT+7)",
    brandNote: `${COMPANY.brand} is an online retail brand operated by the company above.`,
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: (COPY[locale as Locale] ?? COPY.zh).title };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-3 last:border-0 sm:grid-cols-[220px_1fr] sm:gap-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-slate-800">{children}</dd>
    </div>
  );
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = (locale as Locale) in COPY ? (locale as Locale) : "zh";
  const t = COPY[loc];

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t.title}</h1>
      <p className="mt-3 leading-relaxed text-slate-600">{t.lead}</p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">{t.channels}</h2>
        <dl className="mt-3">
          <Row label="Email">
            <a href={`mailto:${COMPANY.email}`} className="underline hover:text-slate-950">
              {COMPANY.email}
            </a>
          </Row>
          <Row label={t.phone}>{COMPANY.phone}</Row>
          <Row label="LINE">{COMPANY.line}</Row>
          <Row label="WeChat">{COMPANY.wechat}</Row>
          <Row label={t.hours}>{t.hoursValue}</Row>
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">{t.company}</h2>
        <dl className="mt-3">
          <Row label={t.legalName}>
            {loc === "th" ? COMPANY.legalNameTh : COMPANY.legalNameEn}
            {loc !== "th" && (
              <span className="block text-sm text-slate-500">{COMPANY.legalNameTh}</span>
            )}
          </Row>
          <Row label={t.regNo}>{COMPANY.registrationNo}</Row>
          <Row label={t.address}>
            {loc === "th" ? COMPANY.addressTh : COMPANY.addressEn}
          </Row>
        </dl>
        <p className="mt-4 text-sm text-slate-500">{t.brandNote}</p>
      </section>
    </main>
  );
}
