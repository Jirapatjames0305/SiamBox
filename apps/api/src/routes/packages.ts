import { Router } from "express";
import { prisma } from "@siambox/database";

export const packagesRouter = Router();

packagesRouter.get("/config", async (_req, res, next) => {
  try {
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });
    res.json({
      data: {
        customPackageMinCents: settings.customPackageMinCents,
        shippingBaseCents: settings.shippingBaseCents,
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
