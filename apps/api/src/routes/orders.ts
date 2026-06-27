import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import sharp from "sharp";
import { randomBytes } from "node:crypto";
import { prisma } from "@siambox/database";
import { checkoutSchema } from "@siambox/shared";
import {
  cnyCentsToSatang,
  createPaymentLink,
  getPaymentLink,
  isBeamEnabled,
} from "../lib/beam.js";
import { getSupabase, SUPABASE_BUCKET } from "../lib/supabase.js";
import { syncBeamLink } from "./webhooks.js";
import { notifyLineGroup } from "../lib/line.js";

export const ordersRouter = Router();

const slipUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      cb(new Error("UnsupportedFileType"));
      return;
    }
    cb(null, true);
  },
});

// Public payment-slip upload (manual bank transfer). Returns a public URL the checkout
// then sends back as `slipUrl` when placing the order.
ordersRouter.post("/slip", slipUpload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "NoFile" });
      return;
    }
    const webp = await sharp(req.file.buffer, { failOn: "error" })
      .rotate()
      .webp({ quality: 82 })
      .toBuffer();
    const objectPath = `slips/${randomBytes(12).toString("hex")}.webp`;
    const supabase = getSupabase();
    const { error: uploadError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(objectPath, webp, { contentType: "image/webp", cacheControl: "31536000" });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(objectPath);
    res.status(201).json({ data: { url: data.publicUrl } });
  } catch (err) {
    next(err);
  }
});

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SB-${ts}-${rand}`;
}

ordersRouter.post("/", async (req, res, next) => {
  try {
    const input = checkoutSchema.parse(req.body);

    const packageIds = input.items.flatMap((i) => (i.kind === "package" ? [i.packageId] : []));
    const customProductIds = input.items.flatMap((i) =>
      i.kind === "custom" ? i.products.map((p) => p.productId) : [],
    );
    const addonProductIds = input.items.flatMap((i) =>
      i.kind === "package" && i.addons ? i.addons.map((a) => a.productId) : [],
    );
    const allProductIds = Array.from(new Set([...customProductIds, ...addonProductIds]));

    const [packages, allProducts, settings] = await Promise.all([
      packageIds.length > 0
        ? prisma.package.findMany({
            where: { id: { in: packageIds }, active: true },
            include: { items: { include: { product: { select: { category: true } } } } },
          })
        : Promise.resolve([]),
      allProductIds.length > 0
        ? prisma.product.findMany({
            where: { id: { in: allProductIds }, active: true },
          })
        : Promise.resolve([]),
      prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
    ]);
    const packageMap = new Map(packages.map((p) => [p.id, p]));
    const productMap = new Map(allProducts.map((p) => [p.id, p]));

    // Reject payment methods the admin has hidden or disabled (defense in depth — the web
    // hides/greys them too, but a blocked method must never reach the gateway).
    const pmSetting = await prisma.paymentMethodSetting.findUnique({
      where: { method: input.paymentMethod },
    });
    if (pmSetting && (pmSetting.hidden || pmSetting.disabled)) {
      throw Object.assign(new Error("PaymentMethodUnavailable"), { status: 400 });
    }

    // Pre-compute custom package totals + validate min threshold
    type LineToCreate = {
      packageId: string | null;
      productId: string | null;
      productNameTh: string;
      productNameZh: string | null;
      quantity: number;
      unitPriceCents: number;
      totalCents: number;
      // For custom: package needs to be created first, so defer this part
      _customProducts?: { productId: string; quantity: number }[];
    };

    let subtotal = 0;
    const lineDrafts: LineToCreate[] = input.items.flatMap((item) => {
      if (item.kind === "package") {
        const pkg = packageMap.get(item.packageId);
        if (!pkg) throw Object.assign(new Error("PackageNotAvailable"), { status: 400 });
        const lineTotal = pkg.priceCents * item.quantity;
        subtotal += lineTotal;
        const lines: LineToCreate[] = [
          {
            packageId: pkg.id,
            productId: null,
            productNameTh: pkg.nameTh,
            productNameZh: pkg.nameZh,
            quantity: item.quantity,
            unitPriceCents: pkg.priceCents,
            totalCents: lineTotal,
          },
        ];
        if (item.addons && item.addons.length > 0) {
          const allowedCategories = new Set(
            pkg.items.map((pi) => pi.product.category).filter((c): c is string => !!c),
          );
          for (const a of item.addons) {
            const product = productMap.get(a.productId);
            if (!product) throw Object.assign(new Error(`AddonNotAvailable:${a.productId}`), { status: 400 });
            if (allowedCategories.size > 0 && (!product.category || !allowedCategories.has(product.category))) {
              throw Object.assign(new Error(`AddonCategoryMismatch:${a.productId}`), { status: 400 });
            }
            const addonQty = a.quantity * item.quantity;
            const addonTotal = product.priceCents * addonQty;
            subtotal += addonTotal;
            lines.push({
              packageId: null,
              productId: product.id,
              productNameTh: product.nameTh,
              productNameZh: product.nameZh,
              quantity: addonQty,
              unitPriceCents: product.priceCents,
              totalCents: addonTotal,
            });
          }
        }
        return lines;
      }
      // Custom box: compute unit price = sum(product.price × qty)
      let unitPrice = 0;
      for (const p of item.products) {
        const product = productMap.get(p.productId);
        if (!product) throw Object.assign(new Error(`ProductNotAvailable:${p.productId}`), { status: 400 });
        unitPrice += product.priceCents * p.quantity;
      }
      if (unitPrice < settings.customPackageMinCents) {
        throw Object.assign(new Error("CustomPackageBelowMinimum"), { status: 400 });
      }
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      return [
        {
          packageId: "", // filled in after Package is created
          productId: null,
          productNameTh: "แพ็กเกจกำหนดเอง",
          productNameZh: "自定义套餐",
          quantity: item.quantity,
          unitPriceCents: unitPrice,
          totalCents: lineTotal,
          _customProducts: item.products,
        },
      ];
    });

    const shippingCents =
      input.shippingMethod === "EXPRESS"
        ? settings.shippingExpressCents
        : settings.shippingBaseCents;
    const total = subtotal + shippingCents;

    // Auto-account creation: link orders to a Customer User by phone
    const user = await prisma.user.upsert({
      where: { phone: input.shippingAddress.phone },
      update: {
        name: input.shippingAddress.recipient,
        wechatId: input.shippingAddress.wechatId ?? undefined,
      },
      create: {
        role: "CUSTOMER",
        phone: input.shippingAddress.phone,
        name: input.shippingAddress.recipient,
        wechatId: input.shippingAddress.wechatId,
      },
    });

    // Create one inactive Package per custom line so we have a packageId for OrderItem
    const orderNumber = generateOrderNumber();
    const lineItems = await Promise.all(
      lineDrafts.map(async (draft) => {
        const { _customProducts, ...rest } = draft;
        if (!_customProducts) return rest;
        const customPkg = await prisma.package.create({
          data: {
            slug: `custom-${orderNumber.toLowerCase()}-${Math.random().toString(36).slice(2, 6)}`,
            nameTh: "แพ็กเกจกำหนดเอง",
            nameZh: "自定义套餐",
            priceCents: draft.unitPriceCents,
            currency: "CNY",
            images: [],
            active: false,
            items: { create: _customProducts },
          },
        });
        return { ...rest, packageId: customPkg.id };
      }),
    );

    const order = await prisma.order.create({
      data: {
        orderNumber,
        user: { connect: { id: user.id } },
        subtotalCents: subtotal,
        shippingCents,
        shippingMethod: input.shippingMethod,
        totalCents: total,
        customerNote: input.customerNote,
        shippingAddress: {
          create: {
            user: { connect: { id: user.id } },
            recipient: input.shippingAddress.recipient,
            phone: input.shippingAddress.phone,
            wechatId: input.shippingAddress.wechatId,
            province: input.shippingAddress.province,
            city: input.shippingAddress.city,
            district: input.shippingAddress.district,
            street: input.shippingAddress.street,
            postalCode: input.shippingAddress.postalCode,
          },
        },
        items: { create: lineItems },
      },
      include: { items: true, shippingAddress: true },
    });

    // Online (gateway) methods → Beam payment-link method groups + the Payment.method we store.
    // eWallets covers Alipay / WeChat Pay; TEST uses PromptPay QR (easy to test in the sandbox).
    const GATEWAY_CHANNELS = {
      ALIPAY: { methods: { eWallets: true }, method: "ALIPAY" as const },
      WECHAT_PAY: { methods: { eWallets: true }, method: "WECHAT" as const },
      TEST: { methods: { qrPromptPay: true }, method: "GATEWAY" as const },
      // BEAM = testing option: open the hosted page with all methods enabled.
      BEAM: { methods: { eWallets: true, qrPromptPay: true }, method: "GATEWAY" as const },
    };

    // Alipay / WeChat Pay can run either as a manual QR (customer scans, then attaches a slip)
    // or through the gateway — the admin picks per channel. TEST is always gateway; MANUAL is
    // always a manual bank-transfer slip.
    const channelMode =
      input.paymentMethod === "ALIPAY"
        ? settings.alipayMode
        : input.paymentMethod === "WECHAT_PAY"
          ? settings.wechatMode
          : input.paymentMethod === "TEST" || input.paymentMethod === "BEAM"
            ? "GATEWAY"
            : "QR";

    // For QR channels the slip is the proof of payment — required before the order can be placed.
    if (
      channelMode === "QR" &&
      (input.paymentMethod === "ALIPAY" || input.paymentMethod === "WECHAT_PAY") &&
      !input.slipUrl
    ) {
      throw Object.assign(new Error("PaymentSlipRequired"), { status: 400 });
    }

    // Gateway flow — create a Beam payment link for online methods.
    let authorizeUri: string | null = null;
    const gateway =
      channelMode === "GATEWAY"
        ? GATEWAY_CHANNELS[input.paymentMethod as keyof typeof GATEWAY_CHANNELS]
        : undefined;
    if (gateway) {
      if (!isBeamEnabled()) {
        throw Object.assign(new Error("PaymentGatewayDisabled"), { status: 503 });
      }
      const amountSatang = cnyCentsToSatang(total);

      const link = await createPaymentLink({
        netAmount: amountSatang,
        referenceId: order.orderNumber,
        methods: gateway.methods,
      });
      await prisma.payment.create({
        data: {
          orderId: order.id,
          method: gateway.method,
          status: "PENDING",
          amountCents: amountSatang,
          currency: "THB",
          beamPaymentLinkId: link.paymentLinkId,
        },
      });
      authorizeUri = link.url;
    } else {
      // Manual / QR flow (MANUAL bank transfer, or Alipay / WeChat Pay in QR mode) — store the
      // customer's slip. SUBMITTED if a slip was attached, otherwise PENDING. Admin reviews +
      // approves/rejects either way.
      const manualMethod =
        input.paymentMethod === "ALIPAY"
          ? "ALIPAY"
          : input.paymentMethod === "WECHAT_PAY"
            ? "WECHAT"
            : "BANK_TRANSFER";
      await prisma.payment.create({
        data: {
          orderId: order.id,
          method: manualMethod,
          status: input.slipUrl ? "SUBMITTED" : "PENDING",
          amountCents: total,
          currency: order.currency,
          slipUrl: input.slipUrl,
        },
      });
    }

    res.status(201).json({ data: { ...order, authorizeUri } });

    // Fire-and-forget — LINE notification must not block or fail the response.
    const totalYuan = (total / 100).toFixed(2);
    const itemSummary = input.items
      .flatMap((item) => {
        if (item.kind === "package") {
          const pkg = packageMap.get(item.packageId)!;
          const lines = [`• ${pkg.nameTh} ×${item.quantity}`];
          for (const a of item.addons ?? []) {
            const p = productMap.get(a.productId)!;
            lines.push(`  - ${p.nameTh} ×${a.quantity * item.quantity}`);
          }
          return lines;
        }
        // Custom box — expand individual products
        return item.products.map((p) => {
          const product = productMap.get(p.productId)!;
          return `• ${product.nameTh} ×${p.quantity}`;
        });
      })
      .join("\n");
    notifyLineGroup(
      `🛒 ออเดอร์ใหม่ ${order.orderNumber}\n` +
        `👤 ${input.shippingAddress.recipient} (${input.shippingAddress.phone})\n` +
        `📦 ${itemSummary}\n` +
        `💰 รวม ¥${totalYuan}\n` +
        `🚚 ${input.shippingMethod === "EXPRESS" ? "ด่วนพิเศษ" : "ปกติ"}`,
    ).catch((err) => console.error("[LINE] unexpected error:", err));
  } catch (err) {
    next(err);
  }
});

const lookupSchema = z.object({
  phone: z.string().min(5).max(30),
});

ordersRouter.post("/lookup", async (req, res, next) => {
  try {
    const input = lookupSchema.parse(req.body);
    const orders = await prisma.order.findMany({
      where: { user: { phone: input.phone } },
      orderBy: { placedAt: "desc" },
      take: 50,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalCents: true,
        currency: true,
        placedAt: true,
        items: {
          select: { quantity: true, productNameTh: true, productNameZh: true },
        },
      },
    });
    res.json({ data: orders });
  } catch (err) {
    next(err);
  }
});

// Public endpoint — refresh order's Beam payments from the Get Payment Link API and return current status.
// Used by /[locale]/orders/[orderNumber] poller in dev (when the webhook isn't public).
// Safe because it only syncs from Beam (source of truth), no client-side state mutation.
ordersRouter.post("/:orderNumber/refresh-payment", async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: req.params.orderNumber },
      include: { payments: true },
    });
    if (!order) {
      res.status(404).json({ error: "OrderNotFound" });
      return;
    }
    if (isBeamEnabled()) {
      for (const payment of order.payments) {
        if (!payment.beamPaymentLinkId || payment.status !== "PENDING") continue;
        await syncBeamLink(await getPaymentLink(payment.beamPaymentLinkId));
      }
    }
    const fresh = await prisma.order.findUnique({
      where: { id: order.id },
      select: { status: true },
    });
    res.json({ data: { status: fresh?.status ?? order.status } });
  } catch (err) {
    next(err);
  }
});

ordersRouter.get("/:orderNumber", async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: req.params.orderNumber },
      include: {
        items: {
          include: {
            package: {
              select: {
                active: true,
                items: { include: { product: { select: { nameTh: true, nameZh: true } } } },
              },
            },
          },
        },
        shippingAddress: true,
        shipments: { orderBy: { createdAt: "desc" } },
        trackingLogs: { orderBy: { occurredAt: "desc" } },
        review: { select: { id: true, rating: true, comment: true, authorName: true, status: true } },
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
