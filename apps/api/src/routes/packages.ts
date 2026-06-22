import { Router } from "express";
import { prisma } from "@siambox/database";

export const packagesRouter = Router();

const PAYMENT_METHODS = ["MANUAL", "ALIPAY", "WECHAT_PAY", "TEST"] as const;

packagesRouter.get("/config", async (_req, res, next) => {
  try {
    const [settings, pmRows] = await Promise.all([
      prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
      prisma.paymentMethodSetting.findMany(),
    ]);
    const byMethod = new Map(pmRows.map((r) => [r.method, r]));
    const paymentMethods = Object.fromEntries(
      PAYMENT_METHODS.map((m) => {
        const row = byMethod.get(m);
        return [m, { hidden: row?.hidden ?? false, disabled: row?.disabled ?? false }];
      }),
    );
    res.json({
      data: {
        customPackageMinCents: settings.customPackageMinCents,
        shippingBaseCents: settings.shippingBaseCents,
        shippingExpressCents: settings.shippingExpressCents,
        paymentMethods,
        bankQrUrl: settings.bankQrUrl,
        bankAccountName: settings.bankAccountName,
        bankAccountNumber: settings.bankAccountNumber,
        storeWechatId: settings.storeWechatId,
        heroBgUrl: settings.heroBgUrl,
        storiesBgUrl: settings.storiesBgUrl,
        brandsBgUrl: settings.brandsBgUrl,
        partnerBgUrl: settings.partnerBgUrl,
        faviconUrl: settings.faviconUrl,
        logoUrl: settings.logoUrl,
      },
    });
  } catch (err) {
    next(err);
  }
});

packagesRouter.get("/", async (_req, res, next) => {
  try {
    const packages = await prisma.package.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      include: { items: { include: { product: true } } },
    });
    res.json({ data: packages });
  } catch (err) {
    next(err);
  }
});

packagesRouter.get("/:slug", async (req, res, next) => {
  try {
    const pkg = await prisma.package.findUnique({
      where: { slug: req.params.slug },
      include: { items: { include: { product: true } } },
    });
    if (!pkg) {
      res.status(404).json({ error: "PackageNotFound" });
      return;
    }
    res.json({ data: pkg });
  } catch (err) {
    next(err);
  }
});
