import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import sharp from "sharp";
import { randomBytes } from "node:crypto";
import { prisma, OrderStatus, PaymentStatus, ShippingCarrier, CustomerStatus } from "@siambox/database";
import { adminAuth } from "../middleware/admin-auth.js";
import { getOmise } from "../lib/omise.js";
import { getSupabase, SUPABASE_BUCKET } from "../lib/supabase.js";
import { syncChargeToPayment } from "./webhooks.js";

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

    const [today, pendingPayment, packing, shipped, delivered] = await Promise.all([
      prisma.order.count({ where: { placedAt: { gte: since } } }),
      prisma.order.count({ where: { status: "PENDING_PAYMENT" } }),
      prisma.order.count({ where: { status: "PACKING" } }),
      prisma.order.count({ where: { status: "SHIPPED" } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
    ]);

    const revenueAgg = await prisma.order.aggregate({
      _sum: { totalCents: true },
      where: { status: { in: ["PAID", "PACKING", "SHIPPED", "IN_CUSTOMS", "OUT_FOR_DELIVERY", "DELIVERED"] } },
    });

    res.json({
      data: {
        ordersToday: today,
        pendingPayment,
        packing,
        shipped,
        delivered,
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
        items: true,
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
    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: {
        status: PaymentStatus.REFUNDED,
        notes: input.reason ?? undefined,
      },
    });
    if (input.alsoRefundOrder) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "REFUNDED" },
      });
    }
    res.json({ data: payment });
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
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
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

// Manual refresh of Omise charge status (use during dev without public webhook URL).
adminRouter.post("/payments/:id/refresh-omise", async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment || !payment.omiseChargeId) {
      res.status(404).json({ error: "PaymentOrChargeNotFound" });
      return;
    }
    const charge = await getOmise().charges.retrieve(payment.omiseChargeId);
    const result = await syncChargeToPayment(charge);
    const fresh = await prisma.payment.findUnique({ where: { id: payment.id } });
    res.json({ data: { payment: fresh, omiseStatus: charge.status, paid: charge.paid, updated: result.updated } });
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
