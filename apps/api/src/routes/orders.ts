import { Router } from "express";
import { z } from "zod";
import { prisma } from "@siambox/database";
import { checkoutSchema } from "@siambox/shared";
import { cnyCentsToSatang, getOmise, isOmiseEnabled } from "../lib/omise.js";
import { syncChargeToPayment } from "./webhooks.js";

export const ordersRouter = Router();

const RETURN_BASE = process.env.OMISE_RETURN_BASE ?? "http://localhost:3000";

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

    const shippingCents = settings.shippingBaseCents;
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

    // Gateway flow — create Omise source + charge for online methods
    let authorizeUri: string | null = null;
    if (input.paymentMethod === "ALIPAY" || input.paymentMethod === "WECHAT_PAY") {
      if (!isOmiseEnabled()) {
        throw Object.assign(new Error("PaymentGatewayDisabled"), { status: 503 });
      }
      const omise = getOmise();
      const sourceType = input.paymentMethod === "ALIPAY" ? "alipay" : "wechat_pay";
      const amountSatang = cnyCentsToSatang(total);
      const returnUri = `${RETURN_BASE}/zh/orders/${order.orderNumber}?charge=1`;

      const source = await omise.sources.create({
        type: sourceType,
        amount: amountSatang,
        currency: "THB",
      });
      const charge = await omise.charges.create({
        amount: amountSatang,
        currency: "THB",
        source: source.id,
        return_uri: returnUri,
        description: `SiamBox ${order.orderNumber}`,
        metadata: { orderNumber: order.orderNumber },
      });
      await prisma.payment.create({
        data: {
          orderId: order.id,
          method: input.paymentMethod === "ALIPAY" ? "ALIPAY" : "WECHAT",
          status: "PENDING",
          amountCents: amountSatang,
          currency: "THB",
          omiseChargeId: charge.id,
          omiseSourceId: source.id,
        },
      });
      authorizeUri = charge.authorize_uri ?? null;
    }

    res.status(201).json({ data: { ...order, authorizeUri } });
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

// Public endpoint — refresh order's Omise payments from Omise API and return current status.
// Used by /[locale]/orders/[orderNumber] poller in dev (when webhook URL isn't public).
// Safe because it only syncs from Omise (source of truth), no client-side state mutation.
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
    if (isOmiseEnabled()) {
      const omise = getOmise();
      for (const payment of order.payments) {
        if (!payment.omiseChargeId || payment.status !== "PENDING") continue;
        const charge = await omise.charges.retrieve(payment.omiseChargeId);
        await syncChargeToPayment(charge);
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
        items: true,
        shippingAddress: true,
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
