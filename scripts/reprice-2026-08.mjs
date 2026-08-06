#!/usr/bin/env node
//
// One-off catalogue repricing + name cleanup, August 2026.
//
//   node scripts/reprice-2026-08.mjs                 # dry run, prints the diff
//   ADMIN_TOKEN=... node scripts/reprice-2026-08.mjs --apply
//
//   API_URL defaults to https://api.siambox.shop
//
// How the new prices were derived
// -------------------------------
// Cost basis is the Thai purchase price per pack from docs/makro-china-sourcing.md,
// docs/lotus-china-sourcing.md, docs/bigc-china-sourcing.md and
// docs/7eleven_products.csv, converted at CNY_TO_THB_RATE (4.9).
//
// The old catalogue was a flat "Thai cost x 3.4" across all 152 SKUs. That over-priced
// anything a Chinese shopper can price-check on JD/Taobao, and under-priced heavy goods
// because Settings.shippingBaseCents is a flat ¥10 no matter the weight. Products fall
// into three groups, each moving in one direction only:
//
//   A  brands with a real domestic import channel in China -> only cut.
//      cost x 2.5, capped by a verified JD/Taobao price where one was found.
//   B  Thai-only goods with no Chinese substitute -> only raise, and only as far as a
//      35% gross margin once the real Thailand->China line-haul is paid
//      (¥22/kg dry, ¥35/kg cosmetics and liquids). This is the flat-¥10 shortfall.
//   C  Thai beauty brands with little recognition in China -> only cut, ceiling ¥139.
//
// 13 SKUs came out unsellable at the Chinese market price (mostly freeze-dried durian,
// which Thailand sources above what China already pays, and instant-noodle cases, which
// are too heavy to ship). Those keep their current price and are listed at the bottom of
// the dry-run output — they need a sourcing decision, not a price.

const API = process.env.API_URL ?? "https://api.siambox.shop";
const TOKEN = process.env.ADMIN_TOKEN;
const APPLY = process.argv.includes("--apply");

/** sku -> new priceCents. Comment shows the move and why. */
const PRICES = [
  // ---- tier A: cut to meet the Chinese market -------------------------------------
  { sku: "MAMA-TYK-55G-10PK", priceCents: 3200 }, //      ¥47→¥32  JD 55g x5 = ¥11.88 → ¥2.38/pack
  { sku: "MAMA-TYK-CRM-55G-10PK", priceCents: 3200 }, //  ¥47→¥32  same JD benchmark
  { sku: "MAMA-CUP-TKC-60G-6PK", priceCents: 3900 }, //   ¥52→¥39
  { sku: "MAMA-OK-CBN-85G", priceCents: 2900 }, //        ¥41→¥29
  { sku: "MAMA-OK-HKR-85G-4PK", priceCents: 2900 }, //    ¥41→¥29
  { sku: "MAMA-OK-SEG-85G-4PK", priceCents: 2900 }, //    ¥41→¥29
  { sku: "WW-BWL-ORI-70G-3PK", priceCents: 3500 }, //     ¥49→¥35
  { sku: "WW-QZC-TKL-60G-6PK", priceCents: 3800 }, //     ¥49→¥38
  { sku: "YY-FLT-SUK-55G-10PK", priceCents: 3500 }, //    ¥44→¥35
  { sku: "YY-CN-CRN-120G-6PK", priceCents: 3500 }, //     ¥40→¥35
  { sku: "NSN-KSC-60G-5PK", priceCents: 2400 }, //        ¥34→¥24
  { sku: "LAY-CHP-NOR-48G-6PK", priceCents: 4800 }, //    ¥72→¥48  Lay's CN ~¥6/bag
  { sku: "KTK-WFR-CHC-17G-24PK", priceCents: 9500 }, //   ¥99→¥95  KitKat CN ~¥3/bar
  { sku: "GLC-PKY-MNG-25G-10PK", priceCents: 6500 }, //   ¥88→¥65
  { sku: "GLC-PRZ-LARB-22G-10PK", priceCents: 4800 }, //  ¥66→¥48
  { sku: "OVT-TAB-CHC-12G-24PK", priceCents: 4800 }, //   ¥66→¥48
  { sku: "MLO-PWD-270G", priceCents: 3500 }, //           ¥48→¥35
  { sku: "TKN-SWD-CLS-26G-6PK", priceCents: 8500 }, //    ¥88→¥85  JD/Suning 32g = ¥10-15
  { sku: "TKN-SWD-CLS-3G-12PK", priceCents: 2200 }, //    ¥26→¥22
  { sku: "KHK-PNT-WSB-75G-3PK", priceCents: 2400 }, //    ¥34→¥24
  { sku: "STR-MSR-FD-40G", priceCents: 6200 }, //         ¥83→¥62
  { sku: "DNT-TPS-100G", priceCents: 7500 }, //           ¥99→¥75  Taobao ¥37-69
  { sku: "BIO-UV-AQR-50G", priceCents: 6500 }, //         ¥90→¥65
  { sku: "DWN-SFT-SRF-300ML", priceCents: 4500 }, //      ¥59→¥45
  { sku: "BRE-DET-HVB-550ML", priceCents: 5200 }, //      ¥55→¥52

  // ---- tier B: raise to cover the shipping the flat ¥10 never did -------------------
  { sku: "FNL-SFT-VLD-470ML-3PK", priceCents: 9900 }, //  ¥68→¥99   1.5kg, ค่าส่งจริง ¥52
  { sku: "PPO-JLY-MIX-12P-6PK", priceCents: 6800 }, //    ¥49→¥68   1.3kg, ค่าส่งจริง ¥29
  { sku: "FUN-CKE-CHC-40G-24PK", priceCents: 5200 }, //   ¥39→¥52   1.05kg, ค่าส่งจริง ¥23
  { sku: "DNE-DET-PPL-460ML-3PK", priceCents: 11900 }, // ¥103→¥119 1.55kg, ค่าส่งจริง ¥54
  { sku: "DSB-SOY-300ML-6PK", priceCents: 11900 }, //     ¥109→¥119 2.4kg, ค่าส่งจริง ¥53
  { sku: "GMT-SOY-200ML-2PK", priceCents: 2200 }, //      ¥20→¥22   700g, ค่าส่งจริง ¥15

  // ---- tier C: Thai beauty, cut to a price China will actually pay ------------------
  { sku: "SRJ-SUN-TINT-30G", priceCents: 13900 }, //      ¥214→¥139 ceiling for an unknown brand
  { sku: "SRJ-SUN-PURE-30G", priceCents: 13900 }, //      ¥200→¥139
  { sku: "RJK-MSK-GLD-6PK", priceCents: 9900 }, //        ¥132→¥99
  { sku: "BTL-DSC-PCH-1G", priceCents: 5200 }, //         ¥69→¥52
  { sku: "SRC-PWD-TRL-4G", priceCents: 4200 }, //         ¥55→¥42
  { sku: "GBI-STC-30ML-6PK", priceCents: 3900 }, //       ¥69→¥39   ต้นทุน ฿12/หลอด
  { sku: "GBI-STC-30ML", priceCents: 1000 }, //           ¥20→¥10
  { sku: "SPP-TNK-PWD-20G", priceCents: 1800 }, //        ¥39→¥18   ต้นทุน ฿35
];

/** nameEn was holding a slug or the Chinese name; nameTh was hyphen-joined. */
const NAMES = [
  {
    sku: "TB-PLASTER-HR-001",
    nameTh: "แผ่นแปะตราเสือ สูตรเย็น",
    nameEn: "Tiger Balm Medicated Plaster HR (Cool Formula)",
  },
  {
    sku: "POYSIAN-MARK2",
    nameTh: "ยาดมโป๊ยเซียน มาร์ค ทู",
    nameEn: "Poy-Sian Mark II Herbal Inhaler",
  },
  {
    sku: "SP-HCL-001",
    nameTh: "ยาอมสมุนไพรอังงี่เฮียง สูตรไม่เติมน้ำตาล",
    nameEn: "Siang Pure Herbal Cough Lozenges (No Sugar Added)",
  },
  {
    sku: "HT-HERB-WHITE-001",
    nameTh: "สมุนไพรตราหงส์ไทย กระปุกฝาขาว",
    nameEn: "Hong Thai Traditional Herbal Inhaler (White Jar)",
  },
  {
    sku: "TCB5-LOZ-001",
    nameTh: "ยาอมแก้ไอ ตราตะขาบ 5 ตัว",
    nameEn: "Takabb Herbal Cough Lozenge (Five Centipedes Brand)",
  },
  // trailing "🇨🇳 中文" leaked in from a translation paste
  { sku: "HYG-SAC-SKB-8G", nameEn: "Hygiene Scented Sachet Sunkiss Blooming 8 g" },
  // nameEn held the Chinese name
  { sku: "AJI-LARB-SEA-30G", nameEn: "Ajinomoto Larb Seasoning Mix 30 g" },
];

/** Priced correctly but structurally unsellable — needs a sourcing call, not a price. */
const FLAGGED = [
  ["STR-DRN-FD-50G", "ทุเรียนฟรีซดราย 50g ¥69 — จีนขาย ¥15-35, ต้นทุนไทย ฿199 สูงกว่าราคาตลาดจีน"],
  ["SWN-DRN-FD-15G-5PK", "ทุเรียนฟรีซดราย 15g x5 ¥109 — ต้นทุน ฿295 แพงเกินแข่ง"],
  ["TAR-DRN-FD-25G-4PK", "ทุเรียนฟรีซดราย 25g x4 ¥139 — ต้นทุน ฿369 แพงเกินแข่ง"],
  ["CTF-DRN-90G", "ทุเรียนอบแห้ง 90g ¥119 — ต้นทุน ฿339 แพงเกินแข่ง"],
  ["MAMA-MPK-60G-30PK", "มาม่ายกลัง 1.9kg — ค่าส่ง ¥42 ทำให้ลงไปเท่าราคา JD ไม่ได้"],
  ["YY-JMB-MPK-60G-30PK", "ยำยำยกลัง 1.9kg — เหตุผลเดียวกัน"],
  ["WW-ORI-57G-30PK", "ไวไวยกลัง 1.8kg — เหตุผลเดียวกัน"],
  ["WW-VEG-MSH-60G-30PK", "ไวไวเจยกลัง 1.9kg — เหตุผลเดียวกัน"],
  ["MAMA-BMN-CLR-55G-30PK", "มาม่าเส้นหมี่ยกลัง 1.75kg — เหตุผลเดียวกัน"],
  ["OVT-PWD-1KG", "โอวัลติน 1kg ¥79 — GM 34% หลังค่าส่ง ¥24"],
  ["DWN-SFT-PSN-23ML-24PK", "ดาวน์นี่ซอง x24 700g — GM 33%"],
  ["TKN-BGS-CLS-28G", "เถ้าแก่น้อยบิ๊กชีท 28g ¥16 — ต้นทุน ฿56/ซอง จาก 7-11, ควรซื้อ Makro แทน"],
  ["TKN-BGS-SPY-28G", "เถ้าแก่น้อยบิ๊กชีท 28g เผ็ด ¥16 — เหตุผลเดียวกัน"],
];

async function main() {
  const res = await fetch(`${API}/api/products?limit=500`);
  if (!res.ok) throw new Error(`GET /api/products -> ${res.status}`);
  const bySku = new Map((await res.json()).data.map((p) => [p.sku, p]));

  const edits = [];
  for (const { sku, priceCents } of PRICES) {
    const p = bySku.get(sku);
    if (!p) { console.warn(`  ?  ${sku} — ไม่พบใน catalog, ข้าม`); continue; }
    if (p.priceCents === priceCents) continue;
    const pct = ((priceCents - p.priceCents) / p.priceCents) * 100;
    edits.push({
      id: p.id, sku, body: { priceCents },
      label: `¥${(p.priceCents / 100).toFixed(0)} → ¥${(priceCents / 100).toFixed(0)}  (${pct > 0 ? "+" : ""}${pct.toFixed(0)}%)  ${p.nameEn}`,
    });
  }
  for (const { sku, ...fields } of NAMES) {
    const p = bySku.get(sku);
    if (!p) { console.warn(`  ?  ${sku} — ไม่พบใน catalog, ข้าม`); continue; }
    const body = Object.fromEntries(Object.entries(fields).filter(([k, v]) => p[k] !== v));
    if (!Object.keys(body).length) continue;
    edits.push({
      id: p.id, sku, body,
      label: Object.entries(body).map(([k, v]) => `${k}: ${JSON.stringify(p[k])} → ${JSON.stringify(v)}`).join("\n      "),
    });
  }

  console.log(`\n${APPLY ? "APPLY" : "DRY RUN"} — ${API}\n${edits.length} รายการที่จะแก้\n`);
  for (const e of edits) console.log(`  ${e.sku.padEnd(24)} ${e.label}`);

  console.log(`\nคงราคาเดิม รอตัดสินใจ (${FLAGGED.length}):`);
  for (const [sku, why] of FLAGGED) console.log(`  ${sku.padEnd(24)} ${why}`);

  if (!APPLY) {
    console.log("\nยังไม่ได้เขียนอะไร — ใส่ --apply พร้อม ADMIN_TOKEN เพื่อยืนยัน");
    return;
  }
  if (!TOKEN) throw new Error("ต้องตั้ง ADMIN_TOKEN ก่อนใช้ --apply");

  let ok = 0;
  for (const e of edits) {
    const r = await fetch(`${API}/api/admin/products/${e.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify(e.body),
    });
    if (!r.ok) { console.error(`  ✗ ${e.sku}: ${r.status} ${await r.text()}`); continue; }
    ok++;
  }
  console.log(`\nสำเร็จ ${ok}/${edits.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
