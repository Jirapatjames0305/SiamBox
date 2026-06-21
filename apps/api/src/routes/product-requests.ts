import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import sharp from "sharp";
import { randomBytes } from "node:crypto";
import { prisma } from "@siambox/database";
import { getSupabase, SUPABASE_BUCKET } from "../lib/supabase.js";
import { verifyTurnstile } from "../middleware/turnstile.js";

export const productRequestsRouter = Router();

const upload = multer({
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

const requestSchema = z.object({
  productName: z.string().min(1).max(200),
  detail: z.string().max(2000).optional(),
  contact: z.string().max(200).optional(),
  imageUrl: z.string().url().max(1000).optional(),
});

// Public — upload a reference image for a product request.
productRequestsRouter.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "NoFile" });
      return;
    }
    const webp = await sharp(req.file.buffer, { failOn: "error" })
      .rotate()
      .webp({ quality: 82 })
      .toBuffer();
    const objectPath = `requests/${randomBytes(12).toString("hex")}.webp`;
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

// Public — anyone can request a product.
productRequestsRouter.post("/", verifyTurnstile, async (req, res, next) => {
  try {
    const input = requestSchema.parse(req.body);
    const created = await prisma.productRequest.create({
      data: {
        productName: input.productName,
        detail: input.detail,
        contact: input.contact,
        imageUrl: input.imageUrl,
      },
    });
    res.status(201).json({ data: { id: created.id } });
  } catch (err) {
    next(err);
  }
});
