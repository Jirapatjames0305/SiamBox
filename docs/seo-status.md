# SEO Status — SiamBox (siambox.shop)

อัปเดตล่าสุด: 2026-07-10

## สถานะโดยรวม

On-site SEO ในโค้ดทำเสร็จแล้วทั้งหมด รอ deploy
งานฝั่ง submit search engine **ติดบล็อกที่การสมัคร Baidu Webmaster** (ดูด้านล่าง)

---

## ✅ เสร็จแล้ว (ในโค้ด)

| รายการ | ไฟล์ |
|---|---|
| Metadata จีน/ไทย/อังกฤษ ต่อ locale + meta keywords (Baidu ยังใช้) | `apps/web/src/app/[locale]/layout.tsx`, `apps/web/messages/*.json` (namespace `Meta`) |
| hreflang (`zh-CN`/`th`/`en`/`x-default`) + canonical | `apps/web/src/lib/seo.ts` — ใช้ในหน้า home, products, product detail |
| Title/description/OG จีนต่อสินค้า + JSON-LD Product schema (ราคา, สต็อก, รูป, SKU) | `apps/web/src/app/[locale]/products/[slug]/page.tsx` |
| Sitemap รวมสินค้า+แพ็กเกจ active ทุกภาษา (~468 URLs, refresh รายชั่วโมง) | `apps/web/src/app/sitemap.ts` |
| robots.txt (block cart/checkout/orders + ชี้ sitemap) | `apps/web/src/app/robots.ts` |

หลัง deploy เช็ก: `siambox.shop/sitemap.xml`, `siambox.shop/robots.txt`, view-source หน้าแรกต้องเห็น title จีน

---

## ❌ ติดบล็อก: สมัคร Baidu Webmaster (ziyuan.baidu.com)

**ปัญหา:** สมัครบัญชี Baidu ไม่ผ่าน — การ verify บัญชีต้องใช้เบอร์โทรจีนแผ่นดินใหญ่ (เบอร์ไทยรับ SMS ยืนยันไม่ได้/ไม่ผ่าน)

**ผลกระทบ:** ยัง submit sitemap และเปิด 主动推送 (Active Push API) กับ Baidu ไม่ได้ → Baidu จะ index เว็บช้ามาก (host อยู่นอกจีน crawl เองไม่บ่อย)

**ทางแก้ที่เป็นไปได้ (เลือกอย่างใดอย่างหนึ่ง):**
1. ใช้เบอร์จีนของ partner / คนรู้จักในจีน สมัครและ verify ให้ (บัญชีผูกเบอร์ แต่โอนสิทธิ์จัดการเว็บได้ภายหลัง)
2. ซื้อ SIM จีนแบบเติมเงิน (China Unicom/Mobile มีขายแบบรับ SMS roaming ได้) — ใช้ครั้งเดียวตอน verify
3. จ้าง agency จีนสมัคร/ดูแล Baidu Webmaster ให้ (มีบริการรับทำทั่วไป)
4. ข้ามไปก่อน — Baidu ยัง index เว็บได้เองแบบช้า และลูกค้าจีนส่วนใหญ่ discover สินค้าผ่าน 小红书/Douyin/WeChat มากกว่า search engine อยู่แล้ว

---

## ⏳ ยังไม่ได้ทำ (ไม่ติดบล็อก ทำได้เลย)

- [ ] **Deploy** โค้ด SEO ขึ้น production
- [ ] **Bing Webmaster Tools** (bing.com/webmasters) — สมัครด้วยบัญชี Microsoft ธรรมดา ไม่ต้องใช้เบอร์จีน, Bing ใช้ได้ในจีน → submit sitemap
- [ ] **Google Search Console** — สำหรับลูกค้าจีนนอกจีน → submit sitemap
- [ ] **Baidu Tongji** (tongji.baidu.com) — analytics ที่ใช้ได้ในจีน (ติดปัญหาเบอร์จีนเหมือน ziyuan — แก้พร้อมกันได้; ระหว่างนี้ใช้ Umami self-host แทนได้)
- [ ] เปิดบัญชี **小红书** ทำ content ลิงก์กลับเว็บ — ช่องทาง discovery หลักของลูกค้าจีน
- [ ] เขียน description สินค้าภาษาจีนให้ยาวขึ้น มี keyword ธรรมชาติ (หลายตัวยังเป็น template สั้น)

## ⏳ งานโค้ดที่ค้าง (ทำเมื่อปลดบล็อก/พร้อม)

- [ ] Baidu Active Push อัตโนมัติตอนเพิ่มสินค้าใหม่ — **รอ token จาก ziyuan.baidu.com**
- [ ] ใส่ verification meta tag ของ Baidu/Bing/Google — **รอ tag จากการสมัครแต่ละเจ้า**
- [ ] ย้ายรูปสินค้า Supabase → Alibaba OSS (HK) — จากจีนเข้า Supabase ไม่เสถียร กระทบทั้งลูกค้าและ crawler
