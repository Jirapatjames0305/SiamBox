import { Router } from "express";
import { prisma } from "@siambox/database";
import {
  PROVIDER_IDS,
  PROVIDER_LABELS,
  configuredProviderIds,
} from "../lib/payments/index.js";

export const packagesRouter = Router();

const PAYMENT_METHODS = ["MANUAL", "ALIPAY", "WECHAT_PAY", "TEST"] as const;
const PAYMENT_METHOD_DEFAULTS: Record<string, { hidden: boolean; disabled: boolean }> = {};

packagesRouter.get("/config", async (_req, res, next) => {
  try {
    const [settings, pmRows, ppRows] = await Promise.all([
      prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
      prisma.paymentMethodSetting.findMany(),
      prisma.paymentProviderSetting.findMany(),
    ]);
    const byMethod = new Map(pmRows.map((r) => [r.method, r]));
    const paymentMethods = Object.fromEntries(
      PAYMENT_METHODS.map((m) => {
        const row = byMethod.get(m);
        const def = PAYMENT_METHOD_DEFAULTS[m] ?? { hidden: false, disabled: false };
        return [m, { hidden: row?.hidden ?? def.hidden, disabled: row?.disabled ?? def.disabled }];
      }),
    );
    // Each gateway is offered only when the admin allows it AND its credentials exist.
    // Allowed-but-unconfigured providers are still listed, marked disabled, so the
    // checkout can show why they cannot be picked instead of silently hiding them.
    const configured = new Set(configuredProviderIds());
    const byProvider = new Map(ppRows.map((r) => [r.provider, r]));
    const paymentProviders = PROVIDER_IDS.map((id) => {
      const row = byProvider.get(id);
      return {
        id,
        label: PROVIDER_LABELS[id],
        hidden: row?.hidden ?? false,
        disabled: (row?.disabled ?? false) || !configured.has(id),
        configured: configured.has(id),
      };
    });

    // Display-only rates for the storefront's currency switcher. The charge itself is
    // always CNY converted to THB at settlement — these never touch a real amount.
    const currencyRates = {
      CNY: 1,
      THB: Number(process.env.CNY_TO_THB_RATE ?? "4.9"),
      USD: Number(process.env.CNY_TO_USD_RATE ?? "0.14"),
    };

    res.json({
      data: {
        paymentProviders,
        currencyRates,
        customPackageMinCents: settings.customPackageMinCents,
        purchaseLimitEnabled: settings.purchaseLimitEnabled,
        shippingBaseCents: settings.shippingBaseCents,
        shippingExpressCents: settings.shippingExpressCents,
        paymentMethods,
        bankQrUrl: settings.bankQrUrl,
        bankAccountName: settings.bankAccountName,
        bankAccountNumber: settings.bankAccountNumber,
        storeWechatId: settings.storeWechatId,
        alipayQrUrl: settings.alipayQrUrl,
        wechatQrUrl: settings.wechatQrUrl,
        alipayMode: settings.alipayMode,
        wechatMode: settings.wechatMode,
        heroBgUrl: settings.heroBgUrl,
        storiesBgUrl: settings.storiesBgUrl,
        brandsBgUrl: settings.brandsBgUrl,
        partnerBgUrl: settings.partnerBgUrl,
        faviconUrl: settings.faviconUrl,
        logoUrl: settings.logoUrl,
        contactLineUrl: settings.contactLineUrl,
        contactWechatId: settings.contactWechatId,
        contactWechatQrUrl: settings.contactWechatQrUrl,
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
