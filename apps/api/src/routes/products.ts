import { Router } from "express";
import { prisma } from "@siambox/database";

export const productsRouter = Router();

productsRouter.get("/", async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: products });
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
