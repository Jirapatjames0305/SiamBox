import { Router } from "express";
import { prisma } from "@siambox/database";
import { isMarket, marketFilter } from "../lib/markets.js";

export const productsRouter = Router();

// ?market=CN|HK narrows the catalogue to what may legally be listed there. Omitting it
// returns everything, which is what the admin app and any older client expects.
productsRouter.get("/", async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true, ...marketFilter(req.query.market) },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: products });
  } catch (err) {
    next(err);
  }
});

// Public — curated homepage best sellers (active products only), ordered by position.
productsRouter.get("/best-sellers", async (req, res, next) => {
  try {
    const rows = await prisma.bestSeller.findMany({
      orderBy: { position: "asc" },
      include: { product: true },
    });
    const market = req.query.market;
    const data = rows
      .map((r) => r.product)
      .filter((p) => p.active && (!isMarket(market) || p.markets.includes(market)));
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

productsRouter.get("/:slug", async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
    });
    if (!product) {
      res.status(404).json({ error: "ProductNotFound" });
      return;
    }
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
});
