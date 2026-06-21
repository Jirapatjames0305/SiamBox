# Payment Gateways ในไทย 2025–2026

> **หมายเหตุความน่าเชื่อถือ:** ตัวเลขที่ใส่ ✅ ผ่าน adversarial verification จากหลายแหล่ง ส่วนที่ใส่ ⚠️ ยังตรวจสอบไม่ได้จาก primary source — ต้อง verify ตรงกับ provider โดยตรง
>
> ที่มา: Deep research (105 agents, 23 แหล่ง, verify 25 claims — confirmed 7, killed 18) — มิถุนายน 2026

---

## ภาพรวมเปรียบเทียบ

| Provider | Card MDR | PromptPay | Setup Fee | Monthly Fee | KYC ยาก | Integration ยาก |
|---|---|---|---|---|---|---|
| **Stripe** ✅ | 3.65% + ฿10 | 1.65% | ฿0 | ฿0 | ★★☆ | ★☆☆ |
| **Xendit** ✅ | 3.2% + ฿10 | **0.80%** | ฿0 | ฿0 | ★★☆ | ★☆☆ |
| **2C2P** ✅ | negotiate | negotiate | negotiate | negotiate | ★★★ | ★★☆ |
| **Opn/Omise** ⚠️ | verify | verify | ไม่มี (เดิม) | ไม่มี (เดิม) | ★★☆ | ★☆☆ |
| **GBPrimePay** ⚠️ | verify | verify | verify | verify | ★★☆ | ★★☆ |
| **KBank K-Payment** ⚠️ | verify | verify | มี | มี | ★★★ | ★★★ |
| **SCB PGW** ⚠️ | verify | verify | มี | มี | ★★★ | ★★★ |
| **PaySolutions** ⚠️ | verify | verify | verify | verify | ★★★ | ★★☆ |

---

## รายละเอียดแต่ละ Provider

### 1. Stripe ✅

**ค่าธรรมเนียม (verified จาก stripe.com/en-th/pricing)**
- บัตรในประเทศ: **3.65% + ฿10** ต่อบิล
- PromptPay QR: **1.65%**
- ไม่มี setup fee / monthly fee

**KYC / Onboarding — ยาก: ★★☆**
- ต้องมีนิติบุคคลในไทย + เลขที่เสียภาษี + บัญชีธนาคารไทย
- เปิดรับนิติบุคคลไทยเท่านั้น
- ระยะเวลา: ปกติ 1–3 วันทำการ

**Integration — ยาก: ★☆☆**
- Docs ดีที่สุดในตลาด, SDK ครบทุก platform, Dashboard ใช้งานง่าย
- มี sandbox พร้อมใช้ ไม่ต้องรออนุมัติ

**Payment Methods ที่รองรับ**
- ✅ PromptPay, Visa, Mastercard, Apple Pay, Google Pay
- ❌ Amex, UnionPay, JCB, WeChat Pay, Alipay, TrueMoney, LINE Pay, Rabbit Pay

**ข้อจำกัด**
- เพิ่งเข้าไทยปี 2022 ยัง expand payment methods อยู่
- ไม่เหมาะถ้า target นักท่องเที่ยวจีนหรือต้องการ Thai wallet

---

### 2. Xendit ✅

**ค่าธรรมเนียม (verified จาก xendit.co/en-th/pricing)**
- บัตรในประเทศ: **3.2% + ฿10**
- PromptPay/QR: **0.80%** — ถูกที่สุดในตลาดที่ verified ได้
- ไม่มี setup fee / monthly fee

**KYC / Onboarding — ยาก: ★★☆**
- ต้องมีนิติบุคคลในไทย เช่นเดียวกับ Stripe
- กระบวนการคล้ายกัน เอกสารไม่เยอะ

**Integration — ยาก: ★☆☆**
- REST API, docs ชัดเจน, รองรับ webhook
- Xendit ซื้อ GBPrimePay แล้ว แต่ยังเป็น brand แยกกัน

**เหมาะกับ**
- ธุรกิจที่ volume PromptPay สูง — rate 0.80% คุ้มมาก

---

### 3. 2C2P ✅

**ค่าธรรมเนียม**
- **ไม่มี public pricing** — ต้อง negotiate ต่อ merchant
- Third-party estimate (ไม่ verified): 3.75–4.75% สำหรับ card
- ยิ่ง volume สูง ยิ่ง negotiate ได้ดี

**KYC / Onboarding — ยาก: ★★★**
- ต้องมี **ภพ.20 (VAT Certificate)** — ต้องจดทะเบียนบริษัทและ VAT ในไทย
- กระบวนการ sales-driven, เอกสารเยอะ
- ใช้เวลา onboard นานกว่า Stripe/Xendit

**Integration — ยาก: ★★☆**
- SDK มีครบแต่ docs ไม่ friendly เท่า Stripe
- Payment Methods ครบที่สุดในตลาด ✅:
  - Card (3DS), Apple Pay, Google Pay
  - Alipay, LINE Pay, GrabPay, TrueMoney, ZaloPay, PayPal, GCash
  - Internet/Mobile Banking, PromptPay QR
  - BNPL, Installment (IPP), Recurring (RPP)

**เหมาะกับ**
- Enterprise, ธุรกิจที่ต้องการ payment method ครบ, regional expansion (รองรับ SEA)

---

### 4. Opn Payments / Omise ⚠️

> ⚠️ ทุก fee claim ถูก refute 0-3 — ต้อง verify ที่ **opn.ooo** โดยตรง

**สิ่งที่รู้**
- Local Thai startup, ประสบการณ์สูงในตลาดไทย
- เดิม (ก่อน rebrand) ไม่มี setup/monthly fee
- Integration reputation ดี

**KYC — ยาก: ★★☆** (ประมาณการ)
**Integration — ยาก: ★☆☆** (ประมาณการจาก reputation)

---

### 5. GBPrimePay ⚠️

**ข้อมูลที่ verified ✅**
- รองรับเฉพาะ **THB เท่านั้น**
- ให้บริการเฉพาะ **ประเทศไทย** เท่านั้น
- Xendit ซื้อกิจการแล้ว แต่ brand ยังแยกอยู่

**ค่าธรรมเนียม / KYC / Integration**
- ⚠️ ยังไม่สามารถ verify ได้จาก primary source ต้องติดต่อโดยตรง
- หลัง Xendit เข้าซื้อ roadmap อาจเปลี่ยน

**เหมาะกับ**
- ธุรกิจที่ต้องการ gateway ไทยล้วน ราคาอาจต่อรองได้

---

### 6. Bank Gateways (KBank K-Payment, SCB PGW, BBL Merchant iPay) ⚠️

> ⚠️ ข้อมูลค่าธรรมเนียมทั้งหมดถูก refute — ต้องติดต่อธนาคารโดยตรง

**สิ่งที่รู้ทั่วไป**
- มักมี **entrance fee** และ **ค่าบำรุงรายปี** ต่างจาก fintech gateway
- ต้องมีบัญชีธุรกิจกับธนาคารนั้น

**KYC / Onboarding — ยาก: ★★★**
- Bureaucracy สูง, เอกสารเยอะ, ใช้เวลา weeks
- ต้องนัดพบ RM ธนาคาร

**Integration — ยาก: ★★★**
- Docs น้อย, support ช้า, sandbox ไม่ดี

**เหมาะกับ**
- Enterprise ที่ต้องการความน่าเชื่อถือแบบธนาคาร หรือมี relationship กับธนาคารอยู่แล้ว

---

## ข้อจำกัดสำคัญ: บริษัทต่างชาติ ✅ (verified 3-0)

บริษัทต่างชาติ **ไม่สามารถ** ขอ Thai Merchant ID ได้โดยตรง ทุก gateway ต้องการ:

1. นิติบุคคลจดทะเบียนในไทย
2. เลขประจำตัวผู้เสียภาษีไทย
3. บัญชีธนาคารไทย (นิติบุคคล)

**ทางเลือกถ้าไม่มีบริษัทไทย:**
- **Merchant of Record (MoR)** service
- Global PSP ที่มี regional account (เช่น 2C2P Singapore)
- แต่จะไม่ได้ Thai MID และมี cost/compliance แตกต่างกัน

---

## แนะนำตามกรณีใช้งาน

| กรณี | แนะนำ |
|---|---|
| Startup / เพิ่งเริ่ม อยากง่าย | **Stripe** หรือ **Xendit** |
| ต้องการ PromptPay rate ถูกที่สุด | **Xendit** (0.80%) |
| ต้องการ payment method ครบ (wallet/BNPL/regional) | **2C2P** |
| Volume สูง + negotiate ได้ | **2C2P** |
| Thai-only ราคาอาจต่อรองได้ | **GBPrimePay** (verify ก่อน) |
| ต้องการ bank-level trust | **KBank / SCB** (overhead สูง) |

---

## สิ่งที่ต้อง verify โดยตรงกับ Provider

ข้อมูลต่อไปนี้เปลี่ยนบ่อยและยังไม่มี primary source ที่ verified:

- **Opn/Omise** — ราคาปัจจุบัน: opn.ooo
- **GBPrimePay** — ราคาและ payment methods หลัง Xendit เข้าซื้อ
- **KBank K-Payment** — entrance fee, annual fee, MDR
- **SCB Payment Gateway** — entrance fee, annual fee, MDR
- **BBL Merchant iPay** — ค่าธรรมเนียมทุกตัว
- **PaySolutions** — ค่าธรรมเนียมทุกตัว
- **Settlement time** — ทุก provider (ไม่มีข้อมูลที่ verified)
