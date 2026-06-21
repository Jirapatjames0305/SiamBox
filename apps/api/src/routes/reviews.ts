import { Router } from "express";
import { z } from "zod";
import { prisma } from "@siambox/database";
import { verifyTurnstile } from "../middleware/turnstile.js";

export const reviewsRouter = Router();

// Public — approved reviews shown on the storefront homepage.
reviewsRouter.get("/", async (_req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, authorName: true, location: true, rating: true, comment: true, createdAt: true },
    });
    res.json({ data: reviews });
  } catch (err) {
    next(err);
  }
});

// Public — review eligibility + existing review for an order. The order detail page
// uses this to decide whether to show the "review" entry point.
reviewsRouter.get("/order/:orderNumber", async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: req.params.orderNumber },
      select: {
        status: true,
        shippingAddress: { select: { recipient: true } },
        review: { select: { id: true, rating: true, comment: true, authorName: true, status: true, createdAt: true } },
      },
    });
    if (!order) {
      res.status(404).json({ error: "OrderNotFound" });
      return;
    }
    res.json({
      data: {
        eligible: order.status === "DELIVERED",
        review: order.review,
        recipientName: order.shippingAddress?.recipient ?? "",
      },
    });
  } catch (err) {
    next(err);
  }
});

const submitSchema = z.object({
  authorName: z.string().min(1).max(80),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(2000),
});

// Public — submit a review for a delivered order. One review per order; starts PENDING.
reviewsRouter.post("/order/:orderNumber", verifyTurnstile, async (req, res, next) => {
  try {
    const input = submitSchema.parse(req.body);
    const order = await prisma.order.findUnique({
      where: { orderNumber: req.params.orderNumber },
      select: {
        id: true,
        status: true,
        shippingAddress: { select: { province: true } },
        review: { select: { id: true } },
      },
    });
    if (!order) {
      res.status(404).json({ error: "OrderNotFound" });
      return;
    }
    if (order.status !== "DELIVERED") {
      throw Object.assign(new Error("OrderNotDelivered"), { status: 400 });
    }
    if (order.review) {
      throw Object.assign(new Error("AlreadyReviewed"), { status: 409 });
    }
    const created = await prisma.review.create({
      data: {
        orderId: order.id,
        authorName: input.authorName,
        location: order.shippingAddress?.province || null,
        rating: input.rating,
        comment: input.comment,
      },
      select: { id: true },
    });
    res.status(201).json({ data: { id: created.id } });
  } catch (err) {
    next(err);
  }
});
