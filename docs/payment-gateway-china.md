# Payment Gateway สำหรับขายเข้าจีน (SiamBox)

ธุรกิจ: ขายสินค้าจากไทย → ส่งให้ลูกค้าที่อยู่ในจีน (cross-border e-commerce)
ความต้องการ: รับชำระผ่าน **Alipay / WeChat Pay แบบ cross-border online** (ลูกค้าอยู่ในจีน ไม่ใช่นักท่องเที่ยวในไทย)

> **สถานะ (ก.ค. 2026):** Beam Checkout ถูกถอดออกจากโปรเจคแล้ว — เลือกใช้ตอนแรกเพราะสมัคร
> ในนามบุคคลธรรมดาได้ ตอนนี้มีนิติบุคคลแล้วจึงไม่จำเป็น
>
> โค้ดตอนนี้รองรับ **เจ้าไทย 3 เจ้า** สลับด้วย env `PAYMENT_PROVIDER` เดียว — ดูหัวข้อ
> [สถานะการ implement](#สถานะการ-implement-ในโปรเจค) ท้ายไฟล์

---

## ⚠️ ข้อควรรู้: Alipay/WeChat Pay มี 2 แบบ

| แบบ | ใช้กับ | เหมาะกับ SiamBox |
|---|---|---|
| In-store / Barcode | นักท่องเที่ยวจีนสแกนจ่ายในไทย | ❌ ไม่ใช่ |
| **Cross-border / Online (Global)** | ลูกค้าอยู่ในจีนจ่ายผ่านเว็บ | ✅ ต้องใช้อันนี้ |

PSP ไทยหลายเจ้าที่โฆษณาว่า "รับ Alipay/WeChat" หมายถึงแบบแรก — **ต้องถามยืนยันทุกครั้ง**

---

## 🇹🇭 เจ้าไทย 3 เจ้าที่เลือกใช้ (ตรวจแล้ว ก.ค. 2026)

> **ข้อควรระวังร่วมกันของทั้ง 3 เจ้า:** ไม่มีเจ้าไหนประกาศ public ชัดเจนว่า
> "รองรับผู้จ่ายที่อยู่ในจีนแผ่นดินใหญ่" — เอกสารทุกเจ้าเขียนรวม ๆ ว่ารับ Alipay/WeChat
> **ต้องยิงคำถามยืนยันตามเทมเพลตท้ายไฟล์ก่อนเซ็นสัญญาทุกเจ้า**
>
> และ **ไม่มีเจ้าไหนมี public pricing เลย** ทั้งสามเจ้าต้องขอราคาจาก sales

### 🥇 Ksher (เคเชอร์) — เจ้าไทยที่เกิดมาเพื่อเคสนี้โดยตรง

- บริษัทจดทะเบียนในไทย ตั้งขึ้นมาเพื่อ**แก้ปัญหา China cross-border payment โดยเฉพาะ** — ตรงกับ SiamBox ที่สุดในบรรดาเจ้าไทย
- **เอกสาร dev ยืนยันชัด:** merchant ไทยได้ทั้ง **Alipay + WeChat Pay** (บวก VISA/Master/JCB, PromptPay, SCB EASY, KPLUS, Bualuang, LINE Pay, TrueMoney, ShopeePay, Atome)
- ประเทศอื่น (MY/SG/UAE/JP) Ksher ให้แค่ Alipay + WeChat เท่านั้น → ยืนยันว่า**สอง wallet นี้คือแกนหลักของบริษัท** ไม่ใช่ของแถม
- รองรับหลาย flow: redirect, B-scan-C, C-scan-B → ครอบคลุมทั้ง e-commerce และหน้าร้าน
- **จุดที่ต้องรู้:** เอกสาร Ksher ระบุว่า WeChat Pay **ต้องเปิดลิงก์ในแอป WeChat** ถึงจะจ่ายได้ → ถ้าลูกค้าเข้าเว็บผ่าน Safari/Chrome ต้องมี fallback (เช่น QR ให้สแกน) ต้องออกแบบ checkout เผื่อ
- ติดต่อ: info.thailand@ksher.com / LINE @ksherservice

### 🥈 Opn Payments (เดิม Omise) — integrate ง่ายที่สุด

- **เอกสาร Opn ยืนยันชัดที่สุดในบรรดาเจ้าไทย:** Thailand merchant account ได้ทั้ง
  **Alipay** (บรรยายตรง ๆ ว่า *"popular payment option that shoppers based in China use"*)
  และ **WeChat Pay** (*"Accept e-wallet payments from China's popular WeChat app"*)
- ⚠️ **`Alipay+` เป็นของ Singapore เท่านั้น ไม่มีในไทย** — ไทยได้ `Alipay` ตัวธรรมดา ต้องถามให้ชัดว่าตัวไทยคือ cross-border online หรือ in-store barcode
- API/docs ดีที่สุดในกลุ่มเจ้าไทย, flow เป็น source-based + redirect → งาน integrate เบาสุด
- เป็น local Thai startup ประสบการณ์สูง มี Alipay+ partnership ระดับภูมิภาคแล้ว
- ⚠️ ราคาปัจจุบันยัง verify ไม่ได้จาก primary source — ต้องถาม opn.ooo ตรง

### 🥉 2C2P — เจ้าใหญ่ รางเดียวกับ Antom

- ก่อตั้งที่กรุงเทพฯ **ปัจจุบันเป็นบริษัทลูกของ Antom/Ant Group (ตั้งแต่ 2022)**
  → ได้เชื่อมต่อ Alipay แบบ first-party แต่เซ็นสัญญากับนิติบุคคลไทย settle THB
- payment methods ครบที่สุดในตลาดไทย (Alipay, LINE Pay, TrueMoney, GrabPay, PromptPay, BNPL, IPP, ผ่อน)
- ⚠️ เอกสารสาธารณะยืนยันแค่ **Alipay** — **WeChat Pay ต้องถามยืนยัน**
- **KYC หนักสุด ★★★** ต้องมี **ภพ.20 (VAT Certificate)**, sales-driven, ใช้เวลานาน

### ตัวสำรอง: SiamPay (AsiaPay Thailand)

รองรับ Alipay + WeChat Pay + UnionPay + LINE Pay + ShopeePay สำหรับ merchant ไทย
แต่ไม่มีข้อมูล fee / requirement / cross-border เปิดเผยเลย ต้องโทรถาม (02-642-3272)
เก็บไว้เป็นตัวสำรองถ้าสามเจ้าบนไม่ผ่าน — **ยังไม่ได้ implement ในโปรเจค**

### เทียบเจ้าไทย

| | Ksher | Opn Payments | 2C2P |
|---|---|---|---|
| Alipay (merchant ไทย) | ✅ ยืนยันจาก docs | ✅ ยืนยันจาก docs | ✅ |
| WeChat Pay (merchant ไทย) | ✅ ยืนยันจาก docs | ✅ ยืนยันจาก docs | ⚠️ ต้องถาม |
| โฟกัสตลาดจีน | ★★★ core business | ★★☆ | ★★☆ |
| ความง่ายในการ integrate | ★★☆ | ★★★ | ★☆☆ |
| KYC | ★★☆ | ★★☆ | ★★★ (ต้อง ภพ.20) |
| Public pricing | ❌ | ❌ | ❌ |
| Settle | THB | THB | THB |

**ลำดับที่แนะนำให้ติดต่อ:** เริ่มคุยกับ **Ksher** ก่อน (เจ้าไทยเจ้าเดียวที่ธุรกิจหลักคือ
cross-border จีนโดยตรง) แล้วคุย **Opn** คู่ขนานไว้เป็น plan B — โค้ดรองรับทั้งคู่แล้ว
สลับด้วย env ตัวเดียว จึงเอาราคาสองเจ้ามาต่อรองกันได้โดยไม่ต้องกลัวงาน integrate เสียเปล่า

---

## เจ้านอก (อ้างอิง — ยังไม่ได้ implement)

| Provider | สรุป |
|---|---|
| **Antom** (Ant International) | ต่อตรง Alipay + WeChat, รับ merchant ไทย, ไม่มี setup/monthly fee, Alipay CN **1.9% + $0.10** โครงสร้างพื้นฐานอยู่ในจีนอยู่แล้ว → เร็วที่สุด และรับ CNY ตรงได้ (ไม่ต้องแปลงเรท) |
| **Oceanpayment / Citcon / Globepay / LianLian** | PSP เฉพาะทางฝั่งจีน onboarding ง่ายกว่า แต่ fee สูงกว่าและไม่โปร่งใส |
| ❌ **Stripe** | Thailand account **ไม่รองรับ Alipay และ WeChat Pay** — หน้า support ของ Stripe ระบุไว้ในช่อง "Not Supported" ชัดเจน |
| ❌ **Airwallex** | เฉพาะนิติบุคคล **HK/SG** เท่านั้นที่รับจาก WeChat เวอร์ชัน CN/HK ได้ — บริษัทไทยใช้ไม่ได้ |

**Antom เป็นตัวเลือกที่ดีที่สุดในภาพรวม** แต่ต้องเซ็นกับนิติบุคคลต่างประเทศและ onboarding
หนักกว่า — ถ้าเจ้าไทยทั้งสามให้ราคาหรือเงื่อนไขที่ไม่ไหว ค่อยกลับมาดูตัวนี้
(การเพิ่ม Antom ทำได้ด้วยการเขียนไฟล์ใหม่ 1 ไฟล์ใน `apps/api/src/lib/payments/`)

---

## เช็คลิสต์ "ไม่ถูกบล็อคในจีน" — ฝั่งเว็บของเราเอง

เลือก PSP ถูกอย่างเดียวไม่พอ ถ้าหน้าเว็บโหลดไม่ขึ้นในจีนก็จบ

- ✅ **`next/font/google`** ที่ใช้ใน [layout.tsx](../apps/web/src/app/layout.tsx) — **ปลอดภัย**
  Next.js ดาวน์โหลดฟอนต์มา self-host ตอน build ไม่ได้เรียก fonts.googleapis.com ตอน runtime
- ✅ ตอนนี้ไม่พบ GA / GTM / reCAPTCHA / YouTube embed / Google Maps / Facebook SDK ใน codebase — **อย่าเพิ่มเข้ามา** ทั้งหมดนี้โดนบล็อคในจีน
- ⚠️ **Render (Singapore)** — เข้าถึงได้จากจีนแต่ latency สูงและไม่การันตี
  ถ้า traffic จีนเยอะควรพิจารณา CDN ที่มี PoP ในจีนหรือฮ่องกง
- ⚠️ **WeChat H5 payment ต้อง whitelist โดเมน** — ต้องเอา `siambox.shop`
  ไปตั้งใน Payment Authorization Config บน WeChat Pay Merchant Platform ก่อนถึงจะเรียกแอปได้
- ✅ **ไม่ต้องมี ICP license** เพราะ host อยู่นอกจีน

---

## คำถามที่ต้องถาม PSP (ใช้ถามได้เลย)

> ผมขายสินค้าจากไทยส่งไปลูกค้าที่อยู่ในประเทศจีน ต้องการรับชำระผ่าน Alipay และ
> WeChat Pay แบบ **cross-border online** (ลูกค้าอยู่ในจีน ไม่ใช่นักท่องเที่ยวในไทย)
> รองรับเคสนี้ไหม ค่าธรรมเนียมเท่าไหร่ settle เป็นสกุลอะไร กี่วัน
> และ hosted payment page ของท่านโหลดได้ปกติจากในจีนหรือไม่?

**EN version:**

> We are a Thailand-registered company shipping goods from Thailand to customers
> located in mainland China. We need to accept **cross-border online** Alipay and
> WeChat Pay (payers are in mainland China, not tourists in Thailand).
> Do you support this? What are the MDR, settlement currency and settlement time?
> Is your hosted checkout page accessible from within mainland China?

---

## ข้อมูลธุรกิจสำหรับกรอกใบสมัคร

- **ชื่อร้าน:** SiamBox
- **เว็บ:** siambox.shop
- **โมเดล:** ขายของไทย → ลูกค้าในจีน
- **Business description (EN):**
  > SiamBox is a Thailand-based online retailer selling Thai consumer goods and
  > lifestyle products to customers in China through our website siambox.shop.
  > Customers in China place orders and pay online (via Alipay / WeChat Pay /
  > international cards). Products are shipped from Thailand to customers in China,
  > with standard (7–15 business days) and express (3–5 business days) international delivery.
- **จัดส่ง:** ธรรมดา 7–15 วัน / ด่วน 3–5 วัน (ระหว่างประเทศ ไทย→จีน)
- **เอกสารที่ต้องเตรียม:** หนังสือรับรองบริษัท, ภพ.20 (ถ้าจด VAT), บัญชีธนาคารนิติบุคคล, บัตร ปชช. กรรมการ/UBO

---

## สถานะการ implement ในโปรเจค

ทั้งสามเจ้าเขียนเสร็จแล้วหลัง `PaymentProvider` interface เดียวกัน — สลับด้วย env ตัวเดียว
ไม่ต้องแก้ route หรือ frontend รายละเอียดเชิงเทคนิคอยู่ใน `docs/siambox.md` → Phase 2A

```text
apps/api/src/lib/payments/types.ts       interface + cnyCentsToSatang()
apps/api/src/lib/payments/ksher.ts       HMAC-SHA256 signature
apps/api/src/lib/payments/opn.ts         HTTP Basic (secret key)
apps/api/src/lib/payments/twoctwop.ts    JWT HS256 envelope
apps/api/src/lib/payments/index.ts       registry — activeProvider() / getProvider()
```

**เลือกเจ้า:** `PAYMENT_PROVIDER=ksher | opn | 2c2p` ใน `.env` (ดูคีย์ทั้งหมดใน `apps/api/.env.example`)

**Webhook:** ทั้งสามเส้น mount ไว้พร้อมกัน — `/api/webhooks/ksher`, `/api/webhooks/opn`,
`/api/webhooks/2c2p` → เปลี่ยนเจ้าไม่ต้อง redeploy แค่ไปแก้ URL ใน dashboard ของ provider

- **Ksher** เซ็นลายเซ็นทับ **full callback URL** → ต้องตั้ง `KSHER_WEBHOOK_URL` ให้ตรงกับที่ตั้งใน dashboard เป๊ะ ๆ ไม่งั้น verify ไม่ผ่าน
- **Opn ไม่เซ็น webhook เลย** → ต่อ `?key=<OPN_WEBHOOK_SECRET>` ท้าย URL ใน dashboard
- **2C2P** ใช้ JWT ตัวเดียวกับ API → verify ด้วย secret key ได้เลย

**Payment เก่าไม่พัง:** `Payment.gatewayProvider` เก็บเจ้าที่สร้าง payment นั้นไว้ การ sync
และ refund ใช้เจ้าตามที่บันทึกไว้ ไม่ใช่เจ้าที่ active อยู่ตอนนี้ → สลับเจ้ากลางคันได้
ออเดอร์ที่ค้างอยู่ยังจบได้ปกติ

### ⚠️ ยังไม่ได้ยิงของจริง — ต้อง verify ก่อน go-live

โค้ดเขียนตาม public docs ของแต่ละเจ้า แต่ยังไม่มี credentials ให้ทดสอบ:

| เจ้า | สิ่งที่ต้องยืนยัน |
|---|---|
| **Ksher** | base URL (`KSHER_API_BASE`), ชื่อ field ของ URL ที่ตอบกลับตอน create order (โค้ดอ่านหลายชื่อเผื่อไว้), channel codes, และ **WeChat ที่ต้องเปิดในแอป WeChat → ต้องทำ QR fallback** |
| **Opn** | `Alipay` ของ merchant ไทยเป็น cross-border online หรือ in-store barcode |
| **2C2P** | channel code ของ WeChat Pay, และ Payment Action API (`/payment/4.3/action`) สำหรับ refund |
| ทุกเจ้า | รับผู้จ่ายที่อยู่ในจีนแผ่นดินใหญ่จริงหรือไม่ (ไม่ใช่แค่นักท่องเที่ยวจีนในไทย) |

### เรื่องเรทเงิน

ทุกเจ้า settle **THB** เท่านั้น ขณะที่เราตั้งราคาเป็น CNY → `cnyCentsToSatang()` แปลงด้วย
`CNY_TO_THB_RATE` ที่ตั้งไว้ใน env (default 4.9) **ควรเปลี่ยนไปดึงเรทอัตโนมัติแทนค่าคงที่**
ก่อนเปิดขายจริง ไม่งั้นกำไรจะแกว่งตามค่าเงิน — Antom เป็นเจ้าเดียวที่รับ CNY ตรงและตัดปัญหานี้ทิ้งได้
