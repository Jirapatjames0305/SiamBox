# คำอธิบายธุรกิจสำหรับสมัคร Payment Gateway (SiamBox)

ใช้กรอกใบสมัคร Opn Payments (Omise) — และใช้กับ Ksher / 2C2P ได้เหมือนกัน
ตัวเลขทั้งหมดดึงจากฐานข้อมูลจริง (152 สินค้า active, 17 หมวด) ณ ก.ค. 2026

---

## 1. คำอธิบายสั้น (ช่องกรอกที่จำกัดความยาว)

> SiamBox เป็นร้านค้าออนไลน์สัญชาติไทย จำหน่ายสินค้าอุปโภคบริโภคของไทย
> (ขนม อาหารสำเร็จรูป เครื่องปรุง เครื่องสำอาง และของใช้ในบ้าน)
> ให้ลูกค้าในประเทศจีนผ่านเว็บไซต์ siambox.shop และจัดส่งจากประเทศไทยไปยังผู้ซื้อโดยตรง

---

## 2. คำอธิบายเต็ม (ช่อง Business Description)

> **SiamBox** ดำเนินธุรกิจพาณิชย์อิเล็กทรอนิกส์ข้ามพรมแดน (cross-border e-commerce)
> จำหน่ายสินค้าอุปโภคบริโภคแบรนด์ไทยให้กับผู้บริโภคในสาธารณรัฐประชาชนจีน
>
> **สินค้าที่จำหน่าย** — ปัจจุบันมี 152 รายการ ใน 17 หมวดหมู่ ได้แก่ ขนมขบเคี้ยว,
> ผลิตภัณฑ์ดูแลส่วนบุคคล, อาหารสำเร็จรูป/บะหมี่กึ่งสำเร็จรูป, ผลิตภัณฑ์บำรุงผิว,
> ผลไม้อบแห้ง, เครื่องปรุงและน้ำพริกแกงไทย, เครื่องดื่ม, ของใช้ในครัวเรือน,
> เครื่องสำอาง และผลิตภัณฑ์สมุนไพร
> เป็นสินค้าแบรนด์ไทยที่มีจำหน่ายทั่วไป เช่น เถ้าแก่น้อย, ศรีจันทร์, โลโบ, ไวไว, ยำยำ, ไมโล
> **ไม่มีสินค้าควบคุม ไม่มีอาหารเสริม ยา บุหรี่ไฟฟ้า หรือสินค้าผิดกฎหมายใด ๆ**
>
> **ช่วงราคา** — ประมาณ ¥9.9 ถึง ¥214 ต่อชิ้น เฉลี่ยประมาณ ¥65 ต่อรายการ
> ลูกค้าสามารถสั่งเป็นชิ้น หรือจัดกล่องรวมสินค้าเอง (ขั้นต่ำ ¥100 ต่อกล่อง)
>
> **ช่องทางการขาย** — ขายผ่านเว็บไซต์ของบริษัทเอง siambox.shop ช่องทางเดียว
> (รองรับภาษาจีน ไทย และอังกฤษ) ไม่ได้ขายผ่านมาร์เก็ตเพลสหรือตัวแทนจำหน่าย
>
> **กลุ่มลูกค้า** — ผู้บริโภครายย่อย (B2C) ที่พำนักอยู่ในประเทศจีนแผ่นดินใหญ่
>
> **การชำระเงิน** — ลูกค้าชำระเงินออนไลน์ผ่านเว็บไซต์ด้วย Alipay, WeChat Pay
> และบัตรเครดิต/เดบิตระหว่างประเทศ ชำระเต็มจำนวนก่อนจัดส่งทุกครั้ง
> ไม่มีการเก็บเงินปลายทาง ไม่มีการผ่อนชำระ และไม่มีการตัดเงินแบบสมัครสมาชิกรายเดือน
>
> **การจัดส่ง** — จัดส่งจากคลังสินค้าในประเทศไทยไปยังที่อยู่ของลูกค้าในประเทศจีน
> แบบธรรมดา 7–15 วันทำการ (ค่าส่ง ¥10) และแบบด่วน 3–5 วันทำการ (ค่าส่ง ¥50)
> ลูกค้าติดตามสถานะพัสดุได้ผ่านหน้าเว็บด้วยหมายเลขคำสั่งซื้อ
>
> **นโยบายคืนเงิน** — กรณีสินค้าเสียหายระหว่างขนส่ง สินค้าไม่ตรงตามที่สั่ง
> หรือพัสดุสูญหาย บริษัทคืนเงินเต็มจำนวนผ่านช่องทางเดิมที่ลูกค้าชำระมา
> ภายใน 7–14 วันทำการนับจากวันที่ได้รับแจ้ง

---

## 3. ⚠️ ประเด็นสำคัญที่ต้องแจ้ง PSP ตั้งแต่ต้น

**ผู้ชำระเงินอยู่ในจีนแผ่นดินใหญ่ ไม่ใช่นักท่องเที่ยวจีนในประเทศไทย**

เรื่องนี้ต้องพูดให้ชัดในใบสมัครและตอนคุยกับ sales — เพราะ Alipay/WeChat Pay
มีสองแบบที่ต่างกันโดยสิ้นเชิง (in-store สำหรับนักท่องเที่ยว กับ cross-border online)
ถ้าปล่อยให้เข้าใจผิดแล้วอนุมัติมา อาจถูกระงับบัญชีทีหลังเมื่อ PSP เห็น traffic จริง

ข้อความที่ใช้ถามได้เลย:

> บริษัทจดทะเบียนในประเทศไทย จำหน่ายสินค้าไทยให้ลูกค้าที่พำนักอยู่ในจีนแผ่นดินใหญ่
> และจัดส่งจากไทยไปจีน ต้องการรับชำระผ่าน Alipay และ WeChat Pay
> แบบ **cross-border online** (ผู้ชำระเงินอยู่ในจีน ไม่ใช่นักท่องเที่ยวจีนในไทย)
> ทางบริษัทรองรับกรณีนี้หรือไม่ อัตราค่าธรรมเนียมเท่าใด รับชำระเป็นสกุลใด
> settle เป็นสกุลใดและกี่วัน และหน้าชำระเงินของท่านเปิดจากในประเทศจีนได้ปกติหรือไม่

---

## 4. English version (ทีม compliance มักอ่านฉบับอังกฤษ)

> **SiamBox** is a Thailand-registered cross-border e-commerce business selling Thai
> consumer goods to retail customers located in mainland China.
>
> **Products** — 152 SKUs across 17 categories: snacks, personal care, instant food,
> skincare, dried fruits, Thai cooking pastes and seasonings, beverages, household
> goods, cosmetics and herbal products. All are mainstream Thai retail brands
> (Taokaenoi, Srichand, Lobo, Wai Wai, Yum Yum, Milo). No restricted, regulated or
> prohibited goods; no supplements, pharmaceuticals or tobacco products.
>
> **Price range** — ¥9.9 to ¥214 per item, averaging about ¥65. Customers order
> individual items or build a mixed box (¥100 minimum per box).
>
> **Sales channel** — our own website siambox.shop only (Chinese, Thai and English).
> No marketplaces or resellers.
>
> **Customers** — individual consumers (B2C) residing in mainland China.
>
> **Payments** — taken online at checkout via Alipay, WeChat Pay and international
> credit/debit cards. Paid in full before dispatch. No cash on delivery, no
> instalments, no recurring or subscription billing.
>
> **Fulfilment** — shipped from our warehouse in Thailand directly to the customer's
> address in China. Standard 7–15 business days (¥10 shipping), express 3–5 business
> days (¥50). Customers track their parcel on the website using the order number.
>
> **Refunds** — full refund to the original payment method for goods damaged in
> transit, incorrect items, or parcels lost in delivery, issued within 7–14 business
> days of the report.

---

## 5. เอกสารที่ต้องเตรียม

- หนังสือรับรองบริษัท (อายุไม่เกิน 6 เดือน)
- ภ.พ.20 (ใบทะเบียนภาษีมูลค่าเพิ่ม) — **2C2P บังคับ**, Opn/Ksher อาจขอ
- บัญชีธนาคารนิติบุคคล (หน้าสมุดบัญชี / statement)
- บัตรประชาชนกรรมการผู้มีอำนาจลงนาม และ UBO
- URL เว็บไซต์ที่เปิดใช้งานจริง พร้อมหน้าที่ PSP มักตรวจ:
  - หน้าสินค้าและราคา
  - นโยบายคืนเงิน / คืนสินค้า
  - นโยบายการจัดส่งและระยะเวลา
  - ข้อมูลติดต่อบริษัท (ที่อยู่ + ช่องทางติดต่อ)
  - เงื่อนไขการใช้บริการ / นโยบายความเป็นส่วนตัว

> **ตรวจก่อนกดส่งใบสมัคร:** PSP เกือบทุกเจ้าเปิดเว็บดูจริงก่อนอนุมัติ
> ถ้าหน้านโยบายคืนเงิน/จัดส่ง/ติดต่อยังไม่มีบนเว็บ มักโดนตีกลับให้เพิ่มก่อน
