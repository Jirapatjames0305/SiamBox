import { Router } from "express";
import { z } from "zod";
import { prisma } from "@siambox/database";
import { verifyTurnstile } from "../middleware/turnstile.js";

export const partnerInquiriesRouter = Router();

const inquirySchema = z.object({
  companyName: z.string().min(1).max(200),
  contactName: z.string().min(1).max(200),
  contact: z.string().min(1).max(200),
  email: z.string().email().max(200).optional().or(z.literal("")),
  partnerType: z.string().max(50).optional(),
  message: z.string().max(2000).optional(),
});

// Public — anyone can submit a partnership inquiry.
partnerInquiriesRouter.post("/", verifyTurnstile, async (req, res, next) => {
  try {
    const input = inquirySchema.parse(req.body);
    const created = await prisma.partnerInquiry.create({
      data: {
        companyName: input.companyName,
        contactName: input.contactName,
        contact: input.contact,
        email: input.email || null,
        partnerType: input.partnerType,
        message: input.message,
      },
    });
    res.status(201).json({ data: { id: created.id } });
  } catch (err) {
    next(err);
  }
});
