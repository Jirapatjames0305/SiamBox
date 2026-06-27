# Thailand → China Cross-Border Ecommerce System

# Project Goal

สร้างระบบ Ecommerce สำหรับขายสินค้าไทยให้ลูกค้าจีนแบบ Cross-Border

เป้าหมาย:

* เริ่มไว
* ใช้งานจริงได้
* ไม่ต้องมีทีมจีน
* ไม่ต้องเปิดโกดังจีนช่วงแรก
* ใช้ logistics system ที่มีอยู่แล้ว

กลุ่มสินค้า:

* ของกินแห้ง
* ของฝากไทย
* lifestyle
* ของใช้ไทย

หลีกเลี่ยงช่วงแรก:

* ของสด
* เนื้อสัตว์
* ยา
* อาหารเสริม
* เครื่องสำอางเสี่ยงสูง

---

# System Overview

ระบบแบ่งเป็น 4 ส่วนหลัก

```text id="ngc5e9"
1. Customer Website
2. Admin Backoffice
3. CMS
4. CRM
```

---

# 1. Customer Website

## Purpose

เว็บไซต์สำหรับลูกค้าจีน:

* ดูสินค้า
* สั่งซื้อ
* ชำระเงิน
* ติดตามพัสดุ
* ติดต่อร้านค้า

---

## Main Features

```text id="smvj3t"
- Product Listing
- Product Detail
- Cart
- Checkout
- Tracking
- Multi-language
- Mobile-first
- WeChat Contact
```

---

# 2. Admin Backoffice

## Purpose

ระบบหลังบ้านสำหรับเจ้าของร้าน

---

## Features

### Dashboard

```text id="v2ns7y"
- daily sales
- pending orders
- shipping status
- revenue
```

---

### Order Management

```text id="w0ecxy"
- ดูออเดอร์
- เปลี่ยนสถานะ
- ปริ้น label
- ใส่ tracking
- ตรวจ payment
```

---

### Product Management

```text id="ltm2tv"
- เพิ่มสินค้า
- แก้ไขสินค้า
- จัดการ stock
- upload รูป
```

---

### Shipping Management

```text id="5f7t0k"
- EMS
- DHL
- Tracking Number
- Shipping Status
```

---

### Customer Management

```text id="66az50"
- ดูข้อมูลลูกค้า
- order history
- blacklist
- notes
```

---

### Payment Management

```text id="gmh6mq"
- ตรวจ payment
- approve payment
- refund
```

---

# 3. CMS

## Purpose

จัดการ content หน้าเว็บโดยไม่ต้องแก้ code

---

## CMS Features

```text id="w66rc6"
- homepage banner
- featured products
- blog/article
- promotion
- translation
- SEO content
```

---

# 4. CRM

## Purpose

ระบบดูแลลูกค้า

---

## CRM Features

```text id="q9duzt"
- purchase history
- customer segmentation
- support ticket
- customer notes
- repeat customer tracking
- broadcast messaging
```

---

# Overall Business Flow

```text id="snhy18"
ลูกค้าจีน
↓
เข้าเว็บไซต์
↓
เลือกสินค้า
↓
Checkout
↓
ชำระเงิน
↓
กรอกที่อยู่จีน
↓
ระบบสร้าง Order
↓
Backoffice แจ้งเตือน
↓
Admin แพ็คสินค้า
↓
ส่ง EMS / DHL
↓
ออกจากไทย
↓
ผ่านศุลกากรจีน
↓
Courier จีนรับต่อ
↓
ส่งถึงหน้าบ้านลูกค้า
```

---

# Detailed Shipping Flow

# STEP 1 — Customer Order

ลูกค้า:

* เลือกสินค้า
* กรอกที่อยู่จีน
* ใส่เบอร์จีน
* ชำระเงิน

ระบบ:

* สร้าง Order
* แจ้งเตือน Admin

---

# STEP 2 — Packing

Admin:

* แพ็คสินค้า
* ปริ้น Shipping Label
* เตรียม Invoice

---

# STEP 3 — Thailand Export

ส่งผ่าน:

* EMS
* DHL
* FedEx

บริษัทขนส่ง:

* ชั่งน้ำหนัก
* สแกน Barcode
* สร้าง Tracking Number
* ส่งออกจากไทย

---

# STEP 4 — Flight & Customs

พัสดุ:

* ไปสนามบิน
* บินไปจีน
* ผ่านศุลกากรจีน

จีนจะตรวจ:

* ประเภทสินค้า
* มูลค่า
* ภาษี
* ของต้องห้าม

---

# STEP 5 — China Courier Handover

ตัวอย่าง:

```text id="8vhzhx"
Thailand Post
↓
China Post
```

หรือ

```text id="s7slmz"
DHL Thailand
↓
DHL China
```

ระบบ logistics เชื่อมอัตโนมัติ
เจ้าของร้านไม่ต้องหาคนส่งในจีนเอง

---

# STEP 6 — Local Delivery

Courier จีน:

* คัดแยกพัสดุ
* ส่งเข้า hub
* ส่งต่อไรเดอร์
* ส่งถึงหน้าบ้านลูกค้า

---

# Tax & Customs Strategy

# Recommended: DDU / DAP

ลูกค้าเป็นผู้จ่ายภาษี (ถ้ามี)

Flow:

```text id="9x31tm"
พัสดุถึงศุลกากรจีน
↓
จีนประเมินภาษี
↓
Courier แจ้งลูกค้า
↓
ลูกค้าจ่าย
↓
ส่งถึงบ้าน
```

---

# Product Strategy

# Recommended Products

```text id="f3j7iu"
- ขนม
- มาม่า
- snack
- ของฝาก
- ยาดม
- ยาหม่อง
- สบู่
- lifestyle
```

---

# Avoid Early

```text id="r4j7vf"
- ของสด
- เนื้อสัตว์
- ยา
- อาหารเสริม
- เครื่องสำอางเสี่ยงสูง
- แบตเตอรี่บางประเภท
```

---

# Customer Authentication Strategy

# Core Philosophy

```text id="7y71z5"
ทำให้ลูกค้าสั่งซื้อได้เร็วที่สุด
```

---

# Recommended Checkout Strategy

# Phase 1 — Guest Checkout First

## Flow

```text id="crj0b2"
ลูกค้าเข้าเว็บ
↓
เลือกสินค้า
↓
Add to cart
↓
Checkout
↓
กรอกชื่อ + ที่อยู่จีน + เบอร์โทร
↓
เลือกวิธีชำระเงิน
↓
Confirm Order
↓
ระบบสร้าง Order
```

ลูกค้า:

* ไม่ต้องสมัครสมาชิก
* ไม่ต้องจำ password
* ไม่ต้อง login

---

# Why Guest Checkout?

ลูกค้าใหม่ โดยเฉพาะ cross-border:

* ยังไม่ trust เว็บ
* ไม่อยากสมัคร account
* ไม่อยากกรอกข้อมูลเยอะ

---

# Important UX Principle

```text id="57m77n"
Buy first
Create account later
```

---

# Auto Account Creation Strategy

หลังลูกค้าสั่งซื้อ:

```text id="dcbj6y"
Order Created
↓
ระบบสร้าง user อัตโนมัติ
↓
ผูก order กับ customer
↓
ลูกค้าสามารถ activate account ภายหลัง
```

---

# Recommended Authentication Methods

# Phase 1

ไม่ต้องมี login system เต็มรูปแบบ

---

# Phase 2

เพิ่ม:

* OTP Login
* Magic Link
* WeChat Login

---

# Avoid Early

```text id="fytkl7"
- username/password แบบเก่า
- registration form ยาว
- email verification ซับซ้อน
```

---

# Recommended Customer Data

```text id="6gl7c7"
customer_name
customer_phone
customer_wechat
shipping_address
```

---

# Customer Trust Strategy

ลูกค้าสนใจสิ่งเหล่านี้มากกว่า account system:

```text id="t8afje"
- tracking จริง
- ส่งของจริง
- ติดต่อได้
- รีวิวจริง
- ระยะเวลาส่งชัดเจน
```

---

# Payment System

# Phase 1 — Manual Payment

ใช้:

* WeChat
* Alipay

Flow:

```text id="iwrcy7"
ลูกค้าชำระเงิน
↓
ส่งสลิป
↓
Admin ตรวจสอบ
↓
Confirm Order
```

---

# Phase 2 — Gateway

Integrate:

* Alipay
* WeChat Pay
* Airwallex
* 2C2P

---

# Recommended Tech Stack

# Frontend

## Website

* Next.js

## UI

* TailwindCSS
* shadcn/ui

---

# Admin / Backoffice

## Framework

* Next.js Admin Panel

ใช้:

* TanStack Table
* React Hook Form
* Zod

---

# CMS

## Recommended

* Payload CMS

Alternative:

* Strapi

---

# CRM

## Phase 1

Build custom CRM inside Backoffice

---

# Backend

## Framework

* Express.js

(สามารถ migrate ไป NestJS ภายหลัง)

---

# Database

## PostgreSQL

---

# ORM

## Prisma

---

# Storage

## Cloudflare R2 (recommended)

> **ของจริงตอนนี้:** ใช้ **Supabase Storage** (bucket `siambox-products`) แทน R2 —
> รูปทุกชนิด (สินค้า / แพ็กเกจ / slip / hero/section backgrounds / favicon / logo)
> upload ผ่าน `POST /api/admin/uploads` → sharp แปลงเป็น WebP → push ขึ้น bucket → คืน public URL
> ย้ายไป R2 ได้ภายหลังถ้าต้องการ (เปลี่ยนแค่ layer ใน `apps/api/src/lib/`). ดู Phase 1H

---

# Deployment

ดูรายละเอียดทั้งหมดที่ [`DEPLOY.md`](./DEPLOY.md) (source of truth — stack, env vars, checklist)

---

# Infrastructure Notes

## Avoid

```text id="ltc6zq"
- Google Fonts
- Firebase หนัก ๆ
- Google-only services
```

---

## Use

```text id="jlwm7g"
- Cloudflare CDN
```

---

# Suggested Monorepo Structure

```text id="ns1n5s"
apps/
├── web
├── admin
├── cms
├── api

packages/
├── ui
├── database
├── shared
```

---

# Suggested Database Tables

```text id="1vq1qo"
users
products
orders
order_items
shipping_addresses
payments
tracking_logs
customer_notes
support_tickets
cms_pages
cms_banners
campaigns
```

---

# Order Status Flow

```text id="x0x3c3"
PENDING_PAYMENT
↓
PAID
↓
PACKING
↓
SHIPPED
↓
IN_CUSTOMS
↓
OUT_FOR_DELIVERY
↓
DELIVERED
```

---

# Development Phases

# Phase 1 — MVP

Goal:

* รับออเดอร์จริงได้

Features:

* Website
* Checkout
* Manual payment
* Tracking
* Basic backoffice

Shipping:

* EMS / DHL

---

# Phase 2

Goal:

* ลดงาน manual

Features:

* CMS
* CRM
* Auto translation
* Notification
* Tracking sync

---

# Phase 3

Goal:

* Scale

Features:

* China warehouse
* Fulfillment
* Analytics
* Recommendation system
* Automation

---

# Important Startup Strategy

ช่วงแรก:

* อย่าทำระบบใหญ่เกินไป
* อย่า optimize เร็วเกิน
* focus ที่ shipping จริง
* focus ที่ customer experience

---

# Lean Startup Flow

```text id="4t8mbv"
รับออเดอร์
↓
แพ็คเอง
↓
ส่ง EMS / DHL
↓
ส่ง Tracking ให้ลูกค้า
↓
เรียนรู้ logistics จริง
↓
ค่อย scale
```

---

# Long-Term Vision

Build:

* Thailand → China Ecommerce Infrastructure
* Cross-border logistics workflow
* CRM ecosystem
* Fulfillment-ready platform
* Multi-language commerce platform
* China-focused ecommerce operations system

---

# Build Progress

# Phase 0 — Foundation ✅

Monorepo + DB schema scaffold ตาม Recommended Tech Stack

## Tooling

```text
pnpm 9 + Turborepo
TypeScript 5.7 (strict)
Next.js 15 + React 19 + Tailwind 3.4
Express 4 + Prisma 6 + PostgreSQL
Zod 3 (shared validation)
```

## Workspace Structure

```text
SiamBox/
├── apps/
│   ├── web/       Next.js 15 — customer site       port 3000
│   ├── admin/     Next.js 15 — backoffice          port 3001
│   └── api/       Express + Prisma — REST API      port 4000
├── packages/
│   ├── database/  Prisma schema + client (@siambox/database)
│   ├── shared/    Zod schemas, enums, helpers (@siambox/shared)
│   └── ui/        placeholder (@siambox/ui)
├── turbo.json · pnpm-workspace.yaml · tsconfig.base.json
└── .env.example
```

## Prisma Schema (packages/database)

13 models + 7 enums

```text
Models:
- User, Product, ShippingAddress
- Order, OrderItem
- Payment, Shipment, TrackingLog
- CustomerNote, SupportTicket
- CmsPage, CmsBanner, Campaign

Enums:
- OrderStatus  (PENDING_PAYMENT → DELIVERED + CANCELLED/REFUNDED)
- PaymentStatus, PaymentMethod
- ShippingCarrier (EMS / DHL / FEDEX)
- UserRole, CustomerStatus, TicketStatus
```

ครอบคลุมทุก table ที่ระบุใน Suggested Database Tables ของ spec

## API Routes (apps/api)

```text
GET  /health
GET  /api/products
GET  /api/products/:slug
POST /api/orders            (guest checkout)
GET  /api/orders/:orderNumber
```

ใช้ Zod (`checkoutSchema`) validate request body
รับ guest checkout ตาม Phase 1 strategy (ไม่ต้องสมัครสมาชิก)

## Verification

```text
✓ pnpm install            (542 packages)
✓ prisma generate         (Prisma Client v6)
✓ pnpm -r typecheck       (6/6 workspaces pass)
```

## Setup Steps (สำหรับ dev คนถัดไป)

```text
1. corepack enable && pnpm install
2. cp .env.example .env  +  ตั้ง DATABASE_URL
3. pnpm db:generate
4. pnpm db:migrate
5. pnpm dev   (รัน web + admin + api พร้อมกัน)
```

---

# Next Phases (TODO)

# Phase 1A — Postgres + Real Data ✅

* DB: Supabase Postgres (ap-southeast-1) ผ่าน Session Pooler
* Schema sync: `prisma db push` สร้างครบ 13 tables
* Seed: ใส่สินค้าตัวอย่าง 1 รายการ (`SB-SNACK-001`)
* End-to-end smoke test ผ่าน:
  * `GET /api/products` → คืนสินค้าจาก DB
  * `POST /api/orders` → สร้าง order + items + shipping address ใน DB
  * `GET /api/admin/stats` → นับ order ที่เพิ่งสร้าง (token gate ทำงาน)

Connection note:

```text
ห้ามใช้ Direct Connection (db.<ref>.supabase.co:5432)
  เพราะ host มีแต่ AAAA (IPv6 เท่านั้น)
ใช้ Session Pooler:
  aws-1-ap-southeast-1.pooler.supabase.com:5432
  username: postgres.<project-ref>
```

`.env` มีจริง อยู่ใน .gitignore · `.env.example` เป็น placeholder

API loads `.env` จาก workspace root ผ่าน `dotenv config({ path: ../../../.env })`

---

# Phase 1B — Customer Web Flow ✅

apps/web routes ที่ใช้ได้แล้ว:

```text
/                       Landing
/products               Product listing  (SSR, revalidate 30s)
/products/[slug]        Product detail + add-to-cart
/cart                   Cart (localStorage)
/checkout               Checkout form  (zod validation, guest)
/orders/[orderNumber]   Order success + tracking
```

Highlights:

* Guest checkout ตาม Phase 1 strategy — ไม่ต้อง login
* Cart เก็บ localStorage (`siambox.cart.v1`) + `useSyncExternalStore` sync ระหว่างหลายแท็บ
* ใช้ `@siambox/shared` Zod schema (`shippingAddressSchema`) validate ฟอร์มฝั่ง client
* Server Components ดึง products ตอน build / SSR + revalidate
* zh/th label คู่กัน รอ i18n เต็มใน Phase 1D
* `next build` ผ่าน — 7 routes (4 static, 2 dynamic, 1 not-found)

ยังไม่ทำ (ตั้งใจ skip ตอนนี้):

* shadcn/ui — ยังไม่ duplicate UI ใน 2 apps จึงไม่ extract
* react-hook-form — ฟอร์มเดียว state ตรง ๆ พอ
* รูปสินค้าใช้ `<img>` ตรง ๆ ก่อน รอ R2 + `next/image` config

---

# Phase 1C — Admin Backoffice ✅

apps/admin routes:

```text
/login                      Token-based admin login
/                           Dashboard (orders today / pending / packing / shipped / revenue)
/orders                     Orders list + status filter
/orders/[orderNumber]       Detail · status transitions · payment approve/reject · add shipment
/products                   List + create/edit modal (multi-lang fields + image URLs)
```

apps/api admin endpoints (gated by `Authorization: Bearer $ADMIN_TOKEN`):

```text
GET    /api/admin/stats
GET    /api/admin/orders                      (filterable by status)
GET    /api/admin/orders/:orderNumber
PATCH  /api/admin/orders/:orderNumber         (status / internalNote)
POST   /api/admin/payments/:id/approve        (auto-moves order to PAID)
POST   /api/admin/payments/:id/reject
POST   /api/admin/orders/:orderNumber/shipments  (auto-moves to SHIPPED)
GET    /api/admin/products
POST   /api/admin/products
PATCH  /api/admin/products/:id
```

Decisions:

* Auth: single shared `ADMIN_TOKEN` ใน `.env` แทน user table — Phase 1 พอใช้
* ไม่ใช้ TanStack Table — ตารางธรรมดา + รายการ filter chip
* Product image: รับ URL trง ๆ (รอ R2 + upload widget ใน Phase 2)
* Status transitions เปิดกว้าง (ไม่บังคับ flow) — admin เลือกเองได้
* Approve payment auto-set order = PAID, Add shipment auto-set = SHIPPED

---

# Phase 1D — i18n ✅

apps/web รองรับ 3 locales ผ่าน next-intl

```text
Routes:
/         → redirect /zh
/zh/...   (default)
/th/...
/en/...
```

Setup:

```text
src/i18n/routing.ts        defineRouting + createNavigation (Link, useRouter)
src/i18n/request.ts        getRequestConfig + message loader
src/middleware.ts          createMiddleware (locale prefix always)
messages/{zh,th,en}.json   ~50 translation keys / locale
```

Pages:

```text
[locale]/page.tsx                       getTranslations (RSC)
[locale]/products/page.tsx              SSG ×3 + product names locale-aware
[locale]/products/[slug]/page.tsx       descriptions + names locale-aware
[locale]/cart/page.tsx                  useTranslations (client)
[locale]/checkout/page.tsx              client form + Zod (locale labels)
[locale]/orders/[orderNumber]/page.tsx  status badge ผ่าน Status namespace
```

UI:

* Navbar มี language switcher (中 / ไทย / EN) — `router.replace(pathname, { locale })`
* `<html lang>` ตาม locale (zh→zh-CN, th, en)
* Locale-aware Link จาก `next-intl/navigation` (auto prefix)
* Cart line เก็บ nameTh + nameZh + nameEn ทั้ง 3 ภาษา (เลือกตาม locale ตอน render)

Build:

```text
○ Static  · ● SSG (×3 locales)  · ƒ Dynamic
18 routes (6 paths × 3 locales) all green
```

Decisions:

* `localePrefix: "always"` — ทุก URL มี prefix ชัด ลด ambiguity
* Admin app ไม่ทำ i18n — internal tool ไทยอย่างเดียวพอ
* ยังไม่ทำ language detection จาก `Accept-Language` header — default = zh (กลุ่มเป้าหมายหลัก)
* ไม่ใช้ ICU plurals ซับซ้อน — แค่ `{count}` interpolation ที่จำเป็น

---

# Phase 1E — Polish & DX ✅

งานปรับปรุง UX/DX หลัง MVP base พร้อม

UI & responsive:

* apps/web — redesign สวยขึ้น + responsive (orange brand, hero gradient, product cards hover, sticky cart summary, timeline tracking)
* apps/admin — sidebar drawer สำหรับ mobile + ตารางมี `overflow-x-auto`
* apps/admin — แปลเป็นภาษาไทยทั้งหมด (nav, dashboard, orders, products, customers, modals)

Image upload (replaces Phase 1C decision "รับ URL ตรง ๆ"):

* `POST /api/admin/uploads` — multer `memoryStorage` → sharp convert WebP quality 82
* serve `/uploads` static + helmet `crossOriginResourcePolicy: cross-origin`
* admin ProductForm: drag-drop + thumbnail grid + reorder + main badge
* JPEG 1206 bytes → WebP 366 bytes (-70%) ในเทส
* ยังเป็น local disk — ย้าย R2 ตอนขึ้น production (`deploy.md`)

API docs:

* Swagger UI ที่ `/swagger`, raw spec ที่ `/openapi.json`
* `apps/api/src/openapi.ts` — OpenAPI 3.0 ครอบคลุม 15+ endpoints, bearer auth scheme, 16 reusable schemas

Deploy planning: ดู [`DEPLOY.md`](./DEPLOY.md)

---

# Phase 1F — Customer / Label / Refund ✅

**Customer Management** (gap ที่ใหญ่ที่สุดของ Phase 1C)

Backend:

* `POST /api/orders` — auto-account creation: `prisma.user.upsert` โดย unique `phone` ตอน checkout, ผูก `userId` กับ Order + ShippingAddress
* `GET    /api/admin/customers`              list + filter q (name/phone/wechat) + status
* `GET    /api/admin/customers/:id`          detail + orders + notes + addresses
* `PATCH  /api/admin/customers/:id`          status (ACTIVE / BLACKLISTED), name
* `POST   /api/admin/customers/:id/notes`    add note
* `DELETE /api/admin/customers/:id/notes/:noteId`

Frontend:

* `/customers` — list + search debounced + filter chips (ทั้งหมด / ปกติ / Blacklist)
* `/customers/[id]` — info card + order history + notes panel + blacklist toggle
* Shell nav เพิ่ม "ลูกค้า"

Smoke verified: 2 orders ต่างรอบจาก phone เดียวกัน → ผูก userId เดียวกัน, blacklist + note บันทึก OK

**Print Shipping Label**

* `/orders/[orderNumber]/label` — print-friendly A5 layout (`@page size: A5`), sender + recipient (ตัวใหญ่) + order info + items + tracking
* Shell bypass — pathname ลงท้าย `/label` ไม่ render sidebar/topbar
* ปุ่ม "พิมพ์ใบจัดส่ง" ในหน้า order detail เปิด tab ใหม่ + auto `window.print()`

**Refund Flow**

* `POST /api/admin/payments/:id/refund` — body `{ reason?, alsoRefundOrder? }` → Payment=REFUNDED + ถ้า `alsoRefundOrder` ก็ Order=REFUNDED
* ปุ่ม "คืนเงิน" ในหน้า order detail แสดงเฉพาะ Payment ที่ APPROVED, prompt เหตุผล + confirm refund order

Decisions:

* Auto-account ใช้ phone เป็น primary key — wechatId เป็น secondary (update เฉย ๆ ถ้ามาคนละครั้ง)
* Order.userId เป็น optional ไว้ — ออเดอร์เก่าก่อนแก้จะมี null (ไม่ migrate retroactive)
* Refund manual: admin บันทึกว่า refund เกิดขึ้น, การโอนเงินจริงอยู่นอกระบบ (Phase 1 manual flow)
* Label ใช้ `@media print` + `window.print()` แทน PDF generation — ง่ายและ render สวยใน browser

---

# Phase 1G — Auto Account Creation (customer-facing) ✅

ปิดสองด้านของ Auto Account Creation Strategy

Backend (เสร็จใน 1F):

* `prisma.user.upsert` by phone ตอน checkout → Order.userId + ShippingAddress.userId

Customer-facing (เพิ่มใน 1G):

* `POST /api/orders/lookup` — body `{ phone }` → คืน 50 ออเดอร์ล่าสุดของลูกค้านั้น (ผ่าน relation `Order.user.phone`)
* apps/web `/[locale]/track` — ฟอร์มเบอร์โทร + รายการออเดอร์ที่ค้นเจอ (status badge, items preview, link ไปหน้า detail)
* Navbar เพิ่ม "ติดตามออเดอร์" / "查询订单" / "Track Order" ทั้ง 3 locales
* หน้า order success เพิ่ม hint "บันทึกหน้านี้ หรือค้นจากเบอร์ได้ที่ /track"

i18n:

```text
Track namespace (12 keys) + Nav.track + Order.savedHint + Order.trackHere
ครอบ zh / th / en ครบ
```

Decisions:

* ไม่มี OTP/SMS ตาม Phase 1 spec — แค่ phone-based lookup (anyone who knows phone เห็นได้)
* ไม่มี session/cookie — แต่ละ visit ต้องกรอกเบอร์ใหม่ (Phase 2 จะเปลี่ยนเป็น OTP + cookie session)
* ไม่ rate-limit ตอนนี้ — ใส่ตอน production hardening (อยู่ใน audit ของ md)

Phase 2 จะ upgrade เป็น OTP/Magic Link/WeChat Login ตามแผนเดิม

Smoke verified: phone +8613900000999 → คืน 2 ออเดอร์, phone ไม่มีใน DB → คืน array ว่าง, body ว่าง → 400

---

# Phase 2A — Payment Gateway (Beam Checkout sandbox) ✅

Code พร้อมเทส — รอใส่ sandbox credentials (Merchant ID / API Key) ใน `.env` ก็ลองรันได้

Setup:

```text
.env  BEAM_MERCHANT_ID + BEAM_API_KEY
      + BEAM_API_BASE (default playground) + CNY_TO_THB_RATE (default 4.9)
apps/api/src/lib/beam.ts                   config + createPaymentLink() + getPaymentLink() + cnyCentsToSatang()
ไม่มี SDK — ใช้ global fetch (JSON) + HTTP Basic base64(merchantId:apiKey)
```

Schema:

```text
Payment + beamPaymentLinkId (unique), failureMessage
migration 20260627000001_chillpay_to_beam = RENAME COLUMN → beam_payment_link_id, DROP chillpay_token
```

Backend:

```text
POST /api/orders                          รับ paymentMethod (MANUAL|ALIPAY|WECHAT_PAY|TEST)
                                          ถ้า online → POST /api/v1/payment-links → เก็บ paymentLinkId
                                          คืน { ...order, authorizeUri = url (hosted checkout page) }
POST /api/webhooks/beam                   background notify (JSON) → re-query GET payment-link by id → sync
POST /api/admin/payments/:id/refresh-payment  สำหรับ dev (ไม่มี public webhook URL)
```

Frontend:

```text
/checkout                                  radio (โอนเอง / Alipay / WeChat Pay / TEST)
                                           หลังกดสั่งซื้อ ถ้ามี authorizeUri → window.location.href = authorizeUri
/orders/[orderNumber]?charge=1             OrderStatusPoller (client component)
                                           poll POST /api/orders/{orderNumber}/refresh-payment ทุก 4 วินาที (max 30 รอบ)
                                           สถานะเปลี่ยน → router.refresh()
```

Decisions:

* **linkSettings**: Alipay/WeChat → `eWallets.isEnabled=true` (group toggle); TEST → `qrPromptPay.isEnabled=true` (PromptPay QR, เทสง่ายใน sandbox) — ลูกค้าเลือก method บนหน้า hosted ของ Beam
* **Charges API คืน QR (ENCODED_IMAGE) ไม่ redirect** → จึงใช้ Payment Links API ที่คืน hosted URL แทน (redirect ตรงกับ flow เดิม)
* **Currency**: Beam รับ THB เท่านั้น → convert CNY cents → THB satang ด้วย `CNY_TO_THB_RATE` (default 4.9). `order.netAmount` เป็น satang (smallest unit), Currency = `THB`
* **Auth**: ทุก request ใช้ HTTP Basic `Authorization: Basic base64(merchantId:apiKey)`
* **Verification**: ไม่ trust webhook body ตรง ๆ — เอา `paymentLinkId` ไป re-query `GET /api/v1/payment-links/{id}` (authenticated) แล้วใช้ค่าจาก API
* **Sync logic**: link status `COMPLETED`/`PAID` → Payment=APPROVED + Order=PAID, `EXPIRED`/`CANCELED`/`FAILED` → Payment=REJECTED + `failureMessage`, `ACTIVE` → ไม่เปลี่ยน
* **referenceId**: ส่ง `order.orderNumber` ตรง ๆ (ใช้ match กับ order)
* **redirectUrl**: `${WEB_BASE_URL}/zh/orders/{orderNumber}?charge=1` — Beam เด้งลูกค้ากลับหน้า order หลังจ่ายสำเร็จ
* **Stored amount**: Payment.amountCents เก็บเป็น THB satang ที่ Beam ใช้จริง (ไม่ใช่ CNY cents) — สำหรับ reconcile กับ Beam dashboard

Refund (admin → ปุ่ม "คืนเงิน"):

* ถ้า payment เป็น Beam (มี `beamPaymentLinkId`) → `GET /charges?referenceId={orderNumber}` หา charge `SUCCEEDED` → `POST /api/v1/refunds {chargeId, reason}` (refund เต็ม, omit amount; partial เฉพาะ CARD) → แล้ว mark Payment=REFUNDED
* ถ้าไม่มี `beamPaymentLinkId` (โอนเอง) → mark record เฉย ๆ (คืนเงิน offline)
* Beam refund fail → ไม่ mark REFUNDED (ทำ Beam ก่อน DB)

Out of scope (เลื่อน):

* credit card (CARD, ต้องเก็บ PAN) / installment
* Partial refund (ตอนนี้ refund เต็มจำนวนเท่านั้น)
* Multi-attempt — ถ้าลูกค้าจ่ายไม่สำเร็จ ตอนนี้ต้องสั่งใหม่

Test plan (รอ credentials):

```text
1. ใส่ sandbox credentials ใน .env (BEAM_MERCHANT_ID + BEAM_API_KEY จาก Beam dashboard / Lighthouse → Developers)
2. รัน migration: pnpm --filter @siambox/database migrate:deploy
3. pnpm dev → กดสั่งซื้อ → เลือก Alipay/WeChat Pay
4. ระบบ redirect ไป Beam hosted page (payment-link url)
5. จ่ายในหน้า hosted ของ Beam (เลือก Alipay/WeChat/PromptPay)
6. กลับมาที่ /orders/[orderNumber]?charge=1 → poller จะ re-query GET payment-link
7. ถ้า webhook ไม่ทำงาน (dev ไม่มี public URL) → ใน admin กด "Refresh"
   /api/admin/payments/:id/refresh-payment → sync สถานะ
```

---

# Phase 1H — Supabase Storage (replaces local-disk / R2 plan) ✅

ย้าย image storage จาก local disk (Phase 1E) → **Supabase Storage** (ไม่ผ่าน R2 ตามที่เคยวางแผน)

```text
apps/api/src/lib/supabase.ts   getSupabase() (lazy + cached) + SUPABASE_BUCKET
                               createClient ใช้ ws เป็น realtime transport (node ไม่มี WebSocket native)
.env  SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + SUPABASE_BUCKET (default "siambox-products")
deps เพิ่ม: @supabase/supabase-js, ws
```

Flow upload (เดิม serve `/uploads` static, ตอนนี้คืน public URL ของ bucket):

```text
POST /api/admin/uploads (multer memoryStorage) → sharp → WebP q82
  → supabase.storage.from(bucket).upload(objectPath)
  → คืน { url: publicUrl }
```

Public upload endpoints (ไม่ต้อง admin token):

```text
POST /api/orders/slip                 ลูกค้าแนบสลิปโอนเงิน (manual payment)
POST /api/product-requests/upload     แนบรูปตอน request สินค้า
```

---

# Phase 1I — Custom Package Builder + Packages ✅

ขายแบบ "กล่องของฝาก" — มีทั้ง package สำเร็จรูป และให้ลูกค้าจัดเอง

Schema เพิ่ม: `Package`, `PackageItem` (+ `OrderItem.packageId`, nullable `productId`)

```text
GET /api/packages           list package สำเร็จรูป (active)
GET /api/packages/:slug     detail + items
GET /api/packages/config    min ราคา custom box (Settings.customPackageMinCents) + รายการสินค้าให้เลือก
```

Admin: `/packages` — สร้าง/แก้/ลบ package + เลือกสินค้าในกล่อง
Web: `/[locale]/build` — หน้าจัดกล่องเอง (BuildClient) เลือกสินค้า + เช็ค min ราคา
Checkout: `checkoutItemSchema` เป็น `discriminatedUnion("kind")` — รับทั้ง package item และ custom item

---

# Phase 1J — Reviews ✅

รีวิวจริงผูกกับ order ที่ `DELIVERED` (ตอบ "Customer Trust Strategy" ใน spec)

Schema เพิ่ม: `Review` (1 ต่อ order, `status` PENDING/APPROVED/REJECTED, rating 1-5, location จาก province)

```text
GET  /api/reviews                      รีวิวที่ APPROVED (โชว์หน้าเว็บ)
GET  /api/reviews/order/:orderNumber   เช็คว่า order นี้รีวิวยัง
POST /api/reviews/order/:orderNumber   ลูกค้าส่งรีวิว (เฉพาะ order ที่ delivered)
```

Admin: `/reviews` — approve / reject / ลบ (moderation ก่อนขึ้นเว็บ)
Web: `/[locale]/orders/[orderNumber]/review` — ฟอร์มรีวิว

---

# Phase 1K — Best Sellers (curated homepage) ✅

Admin คุมเองว่าสินค้าไหนขึ้นหน้าแรก + ลำดับ

Schema เพิ่ม: `BestSeller` (1 ต่อ product, `position`)

```text
GET    /api/products/best-sellers          public — สินค้าหน้าแรก
GET    /api/admin/best-sellers
POST   /api/admin/best-sellers             เพิ่ม/จัดลำดับ
DELETE /api/admin/best-sellers/:productId
POST   /api/admin/best-sellers/randomize   สุ่มชุดใหม่
```

Admin: `/best-sellers`

---

# Phase 1L — Product Requests & Partner Inquiries ✅

ฟอร์มสาธารณะจาก storefront → จัดการใน admin

Schema เพิ่ม: `ProductRequest` (NEW/DONE), `PartnerInquiry` (NEW/CONTACTED)

```text
POST   /api/product-requests             ลูกค้า request สินค้าที่อยากให้มีขาย (+ upload รูป)
POST   /api/partner-inquiries            สมัครเป็น partner/ตัวแทน
GET    /api/admin/product-requests       + PATCH (status) + DELETE
GET    /api/admin/partner-inquiries      + PATCH (status) + DELETE
```

Web: `/[locale]/request-product`, `/[locale]/partner`
Admin: `/product-requests`, `/partner-inquiries`

---

# Phase 1M — Settings, Payment Channels & UI Editor ✅

ใส่ความสามารถแบบ CMS-lite เข้า backoffice (ยังไม่ใช้ Payload)

**Settings** (single-row, id=1) — `GET /api/admin/settings` + `PUT`:

```text
- sender name/address/phone        (ใช้บนใบ shipping label)
- shippingBaseCents / shippingExpressCents  (ค่าส่ง NORMAL / EXPRESS)
- customPackageMinCents            (ขั้นต่ำ custom box)
- bank QR / account name / number  (manual bank transfer)
- hero/stories/brands/partner background URLs + favicon + logo  (UI editor)
```

Admin pages: `/settings`, `/shipping`, `/bank-account`, `/ui-editor`

**Payment channels** — `PaymentMethodSetting` (per-method hidden/disabled):

```text
GET /api/admin/payment-methods + PUT     คุมว่าแต่ละช่องทางโชว์/เลือกได้ไหม
Admin: /payment-methods
```

PaymentMethod enum ปัจจุบัน: `WECHAT · ALIPAY · CNY · BANK_TRANSFER · GATEWAY`
(checkout schema ฝั่ง client: `MANUAL · ALIPAY · WECHAT_PAY · TEST`)
Order เพิ่ม `shippingMethod` (NORMAL/EXPRESS) + `shippingCents`

---

# Current Schema Snapshot (ณ ตอนนี้)

โตจาก Phase 0 (13 models) → **21 models + 7 enums**

```text
Core:     User, Product, BestSeller, Package, PackageItem,
          ShippingAddress, Order, OrderItem, Payment, Shipment,
          TrackingLog, Review
CRM:      CustomerNote, SupportTicket
CMS-lite: CmsPage, CmsBanner, Campaign, Settings,
          ProductRequest, PartnerInquiry, PaymentMethodSetting

Enums (7, เท่าเดิม):
OrderStatus · PaymentStatus · PaymentMethod ·
ShippingCarrier · UserRole · CustomerStatus · TicketStatus
```

> หมายเหตุ: `CmsPage` / `CmsBanner` / `Campaign` / `SupportTicket` มีใน schema แต่ยัง
> **ไม่มี UI/route ใช้งานจริง** — scaffold รอ Phase 2 (CMS/CRM เต็มรูปแบบ)

i18n: ตอนนี้ ~328 keys/locale (zh/th/en) — โตจาก ~50 keys ตอน Phase 1D

---

# Phase 2+ — ตามแผนเดิม

CMS (Payload — หรือคง CMS-lite ปัจจุบันต่อ) · CRM เต็ม (support ticket UI, segmentation, broadcast) ·
Auto translation · Notification · Tracking sync · Beam refund/void · OTP/WeChat login
