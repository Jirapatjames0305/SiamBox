import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import sharp from "sharp";
import { randomBytes } from "node:crypto";
import { prisma, OrderStatus, PaymentStatus, ShippingCarrier, CustomerStatus } from "@siambox/database";
import { adminAuth } from "../middleware/admin-auth.js";
import { getPaymentLink, listChargesByReference, refundCharge } from "../lib/beam.js";
import { getSupabase, SUPABASE_BUCKET } from "../lib/supabase.js";
import { syncBeamLink } from "./webhooks.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB input (converted to webp)
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      cb(new Error("UnsupportedFileType"));
      return;
    }
    cb(null, true);
  },
});

export const adminRouter = Router();

adminRouter.use(adminAuth);

// ---------- Stats ----------

adminRouter.get("/stats", async (_req, res, next) => {
  try {
    const since = new Date();
    since.setHours(0, 0, 0, 0);

    // One groupBy covers every per-status count + total, instead of 6 parallel counts
    // (keeps connection usage low for the Supabase pooler).
    const [byStatus, ordersToday, revenueAgg] = await Promise.all([
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.order.count({ where: { placedAt: { gte: since } } }),
      prisma.order.aggregate({
        _sum: { totalCents: true },
        where: { status: { in: ["PAID", "PACKING", "SHIPPED", "IN_CUSTOMS", "OUT_FOR_DELIVERY", "DELIVERED"] } },
      }),
    ]);

    const countOf = (s: string) => byStatus.find((b) => b.status === s)?._count._all ?? 0;
    const totalOrders = byStatus.reduce((sum, b) => sum + b._count._all, 0);

    res.json({
      data: {
        ordersToday,
        pendingPayment: countOf("PENDING_PAYMENT"),
        packing: countOf("PACKING"),
        shipped: countOf("SHIPPED"),
        delivered: countOf("DELIVERED"),
        totalOrders,
        revenueCents: revenueAgg._sum.totalCents ?? 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---------- Orders ----------

adminRouter.get("/orders", async (req, res, next) => {
  try {
    const statusParam = req.query.status as string | undefined;
    const where = statusParam ? { status: statusParam as OrderStatus } : {};
    const orders = await prisma.order.findMany({
      where,
      orderBy: { placedAt: "desc" },
      take: 100,
      include: {
        items: true,
        shippingAddress: true,
        payments: { orderBy: { createdAt: "desc" } },
      },
    });
    res.json({ data: orders });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/orders/:orderNumber", async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: req.params.orderNumber },
      include: {
        items: {
          include: {
            package: {
              include: {
                items: { include: { product: { select: { nameTh: true, nameZh: true } } } },
              },
            },
          },
        },
        shippingAddress: true,
        payments: { orderBy: { createdAt: "desc" } },
        shipments: { orderBy: { createdAt: "desc" } },
        trackingLogs: { orderBy: { occurredAt: "desc" } },
      },
    });
    if (!order) {
      res.status(404).json({ error: "OrderNotFound" });
      return;
    }
    res.json({ data: order });
  } catch (err) {
    next(err);
  }
});

const updateOrderSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  internalNote: z.string().max(2000).optional(),
});

adminRouter.patch("/orders/:orderNumber", async (req, res, next) => {
  try {
    const input = updateOrderSchema.parse(req.body);
    const data: Record<string, unknown> = { ...input };
    const now = new Date();
    if (input.status === "PAID") data.paidAt = now;
    if (input.status === "SHIPPED") data.shippedAt = now;
    if (input.status === "DELIVERED") data.deliveredAt = now;

    const order = await prisma.order.update({
      where: { orderNumber: req.params.orderNumber },
      data,
    });
    res.json({ data: order });
  } catch (err) {
    next(err);
  }
});

// ---------- Payments ----------

const approvePaymentSchema = z.object({
  reference: z.string().max(200).optional(),
});

adminRouter.post("/payments/:id/approve", async (req, res, next) => {
  try {
    const input = approvePaymentSchema.parse(req.body);
    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: {
        status: PaymentStatus.APPROVED,
        approvedAt: new Date(),
        reference: input.reference,
      },
    });
    // Move order to PAID if still pending
    await prisma.order.updateMany({
      where: { id: payment.orderId, status: "PENDING_PAYMENT" },
      data: { status: "PAID", paidAt: new Date() },
    });
    res.json({ data: payment });
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/payments/:id/reject", async (req, res, next) => {
  try {
    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: { status: PaymentStatus.REJECTED, rejectedAt: new Date() },
    });
    res.json({ data: payment });
  } catch (err) {
    next(err);
  }
});

const refundPaymentSchema = z.object({
  reason: z.string().max(500).optional(),
  alsoRefundOrder: z.boolean().optional(),
});

adminRouter.post("/payments/:id/refund", async (req, res, next) => {
  try {
    const input = refundPaymentSchema.parse(req.body);
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { order: { select: { orderNumber: true } } },
    });
    if (!payment) {
      res.status(404).json({ error: "PaymentNotFound" });
      return;
    }

    // Beam payment → issue a real refund via Beam before marking our records.
    // (Manual / bank-transfer payments have no beamPaymentLinkId — handled by admin offline.)
    let refundId: string | undefined;
    if (payment.beamPaymentLinkId) {
      const charges = await listChargesByReference(payment.order.orderNumber);
      const charge = charges.find((c) => String(c.status).toUpperCase() === "SUCCEEDED");
      if (!charge) {
        res.status(409).json({ error: "NoRefundableCharge" });
        return;
      }
      // Full refund (omit amount) — partial is only supported for CARD charges.
      ({ refundId } = await refundCharge({ chargeId: charge.chargeId, reason: input.reason }));
    }

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.REFUNDED, notes: input.reason ?? undefined },
    });
    if (input.alsoRefundOrder) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "REFUNDED" },
      });
    }
    res.json({ data: updated, refundId });
  } catch (err) {
    next(err);
  }
});

// ---------- Shipments ----------

const createShipmentSchema = z.object({
  carrier: z.nativeEnum(ShippingCarrier),
  trackingNumber: z.string().min(1).max(100),
  weightGrams: z.number().int().positive().optional(),
});

adminRouter.post("/orders/:orderNumber/shipments", async (req, res, next) => {
  try {
    const input = createShipmentSchema.parse(req.body);
    const order = await prisma.order.findUnique({
      where: { orderNumber: req.params.orderNumber },
      include: { items: true },
    });
    if (!order) {
      res.status(404).json({ error: "OrderNotFound" });
      return;
    }
    const shippedAt = new Date();
    const shipment = await prisma.$transaction(async (tx) => {
      const created = await tx.shipment.create({
        data: {
          orderId: order.id,
          carrier: input.carrier,
          trackingNumber: input.trackingNumber,
          weightGrams: input.weightGrams,
          shippedAt,
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { status: "SHIPPED", shippedAt },
      });
      for (const item of order.items) {
        if (item.packageId) {
          const packageItems = await tx.packageItem.findMany({
            where: { packageId: item.packageId },
          });
          for (const pi of packageItems) {
            await tx.product.update({
              where: { id: pi.productId },
              data: { stock: { decrement: pi.quantity * item.quantity } },
            });
          }
        } else if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }
      return created;
    });
    res.status(201).json({ data: shipment });
  } catch (err) {
    next(err);
  }
});

// ---------- Products ----------

const productSchema = z.object({
  sku: z.string().min(1).max(50),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers, dashes"),
  nameTh: z.string().min(1).max(200),
  nameZh: z.string().max(200).optional().nullable(),
  nameEn: z.string().max(200).optional().nullable(),
  descriptionTh: z.string().max(5000).optional().nullable(),
  descriptionZh: z.string().max(5000).optional().nullable(),
  descriptionEn: z.string().max(5000).optional().nullable(),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().min(3).max(3).default("CNY"),
  stock: z.number().int().nonnegative().default(0),
  weightGrams: z.number().int().positive().optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
  active: z.boolean().default(true),
});

adminRouter.get("/products", async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ data: products });
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/products", async (req, res, next) => {
  try {
    const input = productSchema.parse(req.body);
    const product = await prisma.product.create({ data: input });
    res.status(201).json({ data: product });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch("/products/:id", async (req, res, next) => {
  try {
    const input = productSchema.partial().parse(req.body);
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: input,
    });
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
});

// ---------- Packages ----------

const packageSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers, dashes"),
  nameTh: z.string().min(1).max(200),
  nameZh: z.string().max(200).optional().nullable(),
  nameEn: z.string().max(200).optional().nullable(),
  descriptionTh: z.string().max(5000).optional().nullable(),
  descriptionZh: z.string().max(5000).optional().nullable(),
  descriptionEn: z.string().max(5000).optional().nullable(),
  currency: z.string().min(3).max(3).default("CNY"),
  images: z.array(z.string().url()).default([]),
  active: z.boolean().default(true),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

async function computePackagePriceCents(
  items: { productId: string; quantity: number }[],
): Promise<number> {
  if (items.length === 0) return 0;
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: { id: true, priceCents: true },
  });
  const priceMap = new Map(products.map((p) => [p.id, p.priceCents]));
  return items.reduce((sum, it) => {
    const price = priceMap.get(it.productId);
    if (price == null) throw Object.assign(new Error(`ProductNotFound:${it.productId}`), { status: 400 });
    return sum + price * it.quantity;
  }, 0);
}

adminRouter.get("/packages", async (_req, res, next) => {
  try {
    const packages = await prisma.package.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: { include: { product: true } } },
    });
    res.json({ data: packages });
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/packages", async (req, res, next) => {
  try {
    const input = packageSchema.parse(req.body);
    const { items, ...rest } = input;
    const priceCents = await computePackagePriceCents(items);
    const pkg = await prisma.package.create({
      data: {
        ...rest,
        priceCents,
        items: { create: items },
      },
      include: { items: { include: { product: true } } },
    });
    res.status(201).json({ data: pkg });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch("/packages/:id", async (req, res, next) => {
  try {
    const input = packageSchema.partial().parse(req.body);
    const { items, ...rest } = input;
    const pkg = await prisma.$transaction(async (tx) => {
      const data: Record<string, unknown> = { ...rest };
      if (items) {
        data.priceCents = await computePackagePriceCents(items);
        await tx.packageItem.deleteMany({ where: { packageId: req.params.id } });
        await tx.packageItem.createMany({
          data: items.map((i) => ({ ...i, packageId: req.params.id })),
        });
      }
      await tx.package.update({ where: { id: req.params.id }, data });
      return tx.package.findUnique({
        where: { id: req.params.id },
        include: { items: { include: { product: true } } },
      });
    });
    res.json({ data: pkg });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/packages/:id", async (req, res, next) => {
  try {
    await prisma.package.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ---------- Customers ----------

adminRouter.get("/customers", async (req, res, next) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    const statusParam = req.query.status as string | undefined;
    const where: Record<string, unknown> = { role: "CUSTOMER" };
    if (q) {
      (where as { OR?: unknown[] }).OR = [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { wechatId: { contains: q, mode: "insensitive" } },
      ];
    }
    if (statusParam === "ACTIVE" || statusParam === "BLACKLISTED") {
      where.status = statusParam as CustomerStatus;
    }
    const customers = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        _count: { select: { orders: true } },
        orders: {
          orderBy: { placedAt: "desc" },
          take: 1,
          select: { totalCents: true, placedAt: true, currency: true },
        },
      },
    });
    res.json({ data: customers });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/customers/:id", async (req, res, next) => {
  try {
    const customer = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        orders: {
          orderBy: { placedAt: "desc" },
          include: { items: true },
        },
        notes: { orderBy: { createdAt: "desc" } },
        addresses: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!customer) {
      res.status(404).json({ error: "CustomerNotFound" });
      return;
    }
    res.json({ data: customer });
  } catch (err) {
    next(err);
  }
});

const updateCustomerSchema = z.object({
  status: z.nativeEnum(CustomerStatus).optional(),
  name: z.string().max(200).optional(),
});

adminRouter.patch("/customers/:id", async (req, res, next) => {
  try {
    const input = updateCustomerSchema.parse(req.body);
    const customer = await prisma.user.update({
      where: { id: req.params.id },
      data: input,
    });
    res.json({ data: customer });
  } catch (err) {
    next(err);
  }
});

const addNoteSchema = z.object({ body: z.string().min(1).max(2000) });

adminRouter.post("/customers/:id/notes", async (req, res, next) => {
  try {
    const input = addNoteSchema.parse(req.body);
    const note = await prisma.customerNote.create({
      data: { userId: req.params.id, body: input.body },
    });
    res.status(201).json({ data: note });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/customers/:userId/notes/:noteId", async (req, res, next) => {
  try {
    await prisma.customerNote.delete({ where: { id: req.params.noteId } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Manual refresh of Beam payment-link status (use during dev without a public webhook URL).
adminRouter.post("/payments/:id/refresh-payment", async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment || !payment.beamPaymentLinkId) {
      res.status(404).json({ error: "PaymentOrLinkNotFound" });
      return;
    }
    const link = await getPaymentLink(payment.beamPaymentLinkId);
    const result = await syncBeamLink(link);
    const fresh = await prisma.payment.findUnique({ where: { id: payment.id } });
    res.json({
      data: { payment: fresh, beamStatus: link.status, updated: result.updated },
    });
  } catch (err) {
    next(err);
  }
});

// ---------- Product requests ----------

adminRouter.get("/product-requests", async (_req, res, next) => {
  try {
    const data = await prisma.productRequest.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch("/product-requests/:id", async (req, res, next) => {
  try {
    const status = z.enum(["NEW", "DONE"]).parse(req.body?.status);
    const data = await prisma.productRequest.update({ where: { id: req.params.id }, data: { status } });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/product-requests/:id", async (req, res, next) => {
  try {
    await prisma.productRequest.delete({ where: { id: req.params.id } });
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
});

// ---------- Partner inquiries ----------

adminRouter.get("/partner-inquiries", async (_req, res, next) => {
  try {
    const data = await prisma.partnerInquiry.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch("/partner-inquiries/:id", async (req, res, next) => {
  try {
    const status = z.enum(["NEW", "CONTACTED"]).parse(req.body?.status);
    const data = await prisma.partnerInquiry.update({ where: { id: req.params.id }, data: { status } });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/partner-inquiries/:id", async (req, res, next) => {
  try {
    await prisma.partnerInquiry.delete({ where: { id: req.params.id } });
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
});

// ---------- Best sellers ----------

adminRouter.get("/best-sellers", async (_req, res, next) => {
  try {
    const data = await prisma.bestSeller.findMany({
      orderBy: { position: "asc" },
      include: { product: true },
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

const addBestSellerSchema = z.object({ productId: z.string().min(1) });

adminRouter.post("/best-sellers", async (req, res, next) => {
  try {
    const { productId } = addBestSellerSchema.parse(req.body);
    const max = await prisma.bestSeller.aggregate({ _max: { position: true } });
    const created = await prisma.bestSeller.upsert({
      where: { productId },
      update: {},
      create: { productId, position: (max._max.position ?? -1) + 1 },
      include: { product: true },
    });
    res.status(201).json({ data: created });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/best-sellers/:productId", async (req, res, next) => {
  try {
    await prisma.bestSeller.deleteMany({ where: { productId: req.params.productId } });
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
});

const randomizeSchema = z.object({ count: z.number().int().min(1).max(24).default(6) });

adminRouter.post("/best-sellers/randomize", async (req, res, next) => {
  try {
    const { count } = randomizeSchema.parse(req.body ?? {});
    const active = await prisma.product.findMany({ where: { active: true }, select: { id: true } });
    const ids = active.map((p) => p.id);
    // Fisher–Yates shuffle, then take `count`.
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = ids[i]!;
      ids[i] = ids[j]!;
      ids[j] = tmp;
    }
    const picked = ids.slice(0, count);
    const data = await prisma.$transaction(async (tx) => {
      await tx.bestSeller.deleteMany({});
      await tx.bestSeller.createMany({
        data: picked.map((productId, i) => ({ productId, position: i })),
      });
      return tx.bestSeller.findMany({ orderBy: { position: "asc" }, include: { product: true } });
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// ---------- Reviews ----------

adminRouter.get("/reviews", async (_req, res, next) => {
  try {
    const data = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { order: { select: { orderNumber: true } } },
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch("/reviews/:id", async (req, res, next) => {
  try {
    const status = z.enum(["PENDING", "APPROVED", "REJECTED"]).parse(req.body?.status);
    const data = await prisma.review.update({ where: { id: req.params.id }, data: { status } });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/reviews/:id", async (req, res, next) => {
  try {
    await prisma.review.delete({ where: { id: req.params.id } });
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
});

// ---------- Uploads ----------

adminRouter.post("/uploads", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "NoFile" });
      return;
    }
    const { data: webpBuffer, info } = await sharp(req.file.buffer, { failOn: "error" })
      .rotate() // honor EXIF orientation, then strip metadata
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });

    const objectPath = `products/${randomBytes(12).toString("hex")}.webp`;
    const supabase = getSupabase();
    const { error: uploadError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(objectPath, webpBuffer, {
        contentType: "image/webp",
        cacheControl: "31536000",
      });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(objectPath);

    res.status(201).json({
      data: {
        url: publicUrlData.publicUrl,
        filename: objectPath,
        sizeBytes: info.size,
        originalBytes: req.file.size,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---------- Settings ----------

const settingsSchema = z.object({
  senderName: z.string().max(200),
  senderAddressLine1: z.string().max(500),
  senderAddressLine2: z.string().max(500),
  senderPhone: z.string().max(100),
  shippingBaseCents: z.number().int().min(0).max(10_000_000),
  shippingExpressCents: z.number().int().min(0).max(10_000_000),
  customPackageMinCents: z.number().int().min(0).max(10_000_000),
  bankQrUrl: z.string().max(1000),
  bankAccountName: z.string().max(200),
  bankAccountNumber: z.string().max(100),
  storeWechatId: z.string().max(200),
  alipayQrUrl: z.string().max(1000),
  wechatQrUrl: z.string().max(1000),
  alipayMode: z.enum(["QR", "GATEWAY"]),
  wechatMode: z.enum(["QR", "GATEWAY"]),
  heroBgUrl: z.string().max(1000),
  storiesBgUrl: z.string().max(1000),
  brandsBgUrl: z.string().max(1000),
  partnerBgUrl: z.string().max(1000),
  faviconUrl: z.string().max(1000),
  logoUrl: z.string().max(1000),
});

adminRouter.get("/settings", async (_req, res, next) => {
  try {
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });
    res.json({ data: settings });
  } catch (err) {
    next(err);
  }
});

adminRouter.put("/settings", async (req, res, next) => {
  try {
    const input = settingsSchema.parse(req.body);
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: input,
      create: { id: 1, ...input },
    });
    res.json({ data: settings });
  } catch (err) {
    next(err);
  }
});

// ---------- Payment channel visibility ----------

const PAYMENT_METHOD_IDS = ["MANUAL", "ALIPAY", "WECHAT_PAY", "TEST"] as const;

const paymentMethodsSchema = z.object({
  methods: z.array(
    z.object({
      method: z.enum(PAYMENT_METHOD_IDS),
      hidden: z.boolean(),
      disabled: z.boolean(),
    }),
  ),
});

adminRouter.get("/payment-methods", async (_req, res, next) => {
  try {
    const rows = await prisma.paymentMethodSetting.findMany();
    const byMethod = new Map(rows.map((r) => [r.method, r]));
    const data = PAYMENT_METHOD_IDS.map((method) => {
      const row = byMethod.get(method);
      return { method, hidden: row?.hidden ?? false, disabled: row?.disabled ?? false };
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adminRouter.put("/payment-methods", async (req, res, next) => {
  try {
    const input = paymentMethodsSchema.parse(req.body);
    await prisma.$transaction(
      input.methods.map((m) =>
        prisma.paymentMethodSetting.upsert({
          where: { method: m.method },
          update: { hidden: m.hidden, disabled: m.disabled },
          create: { method: m.method, hidden: m.hidden, disabled: m.disabled },
        }),
      ),
    );
    const rows = await prisma.paymentMethodSetting.findMany();
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});
