import { Router } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@siambox/database";
import { getPaymentLink, type BeamPaymentLinkDetail } from "../lib/beam.js";

export const webhooksRouter = Router();

// Verifies the Beam webhook signature: HMAC-SHA256(rawBody) keyed by the base64-decoded
// signing secret, compared (base64) against the X-Beam-Signature header.
// If BEAM_WEBHOOK_SECRET is unset (local dev), verification is skipped.
function verifyBeamSignature(rawBody: Buffer, signature: string | undefined): boolean {
  const secret = process.env.BEAM_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!signature) return false;
  const expected = createHmac("sha256", Buffer.from(secret, "base64"))
    .update(rawBody)
    .digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Beam background notification: POST application/json (events e.g. payment_link.paid).
// We verify the HMAC signature, then re-query the Get Payment Link API (authoritative)
// before mutating anything — never trusting the posted body's status.
webhooksRouter.post("/beam", async (req, res, next) => {
  try {
    const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody ?? Buffer.from("");
    if (!verifyBeamSignature(rawBody, req.header("x-beam-signature"))) {
      res.status(401).json({ error: "InvalidSignature" });
      return;
    }
    const paymentLinkId = String(
      req.body?.paymentLinkId ?? req.body?.data?.paymentLinkId ?? req.body?.id ?? "",
    );
    if (!paymentLinkId) {
      res.json({ ok: true, ignored: true });
      return;
    }
    await syncBeamLink(await getPaymentLink(paymentLinkId));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Maps a Beam payment-link status onto our Payment + Order records.
export async function syncBeamLink(link: BeamPaymentLinkDetail): Promise<{ updated: boolean }> {
  const payment = await prisma.payment.findUnique({
    where: { beamPaymentLinkId: link.paymentLinkId },
  });
  if (!payment) return { updated: false };

  const status = String(link.status).toUpperCase();

  if (status === "COMPLETED" || status === "PAID" || status === "SUCCEEDED") {
    if (payment.status !== "APPROVED") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "APPROVED", approvedAt: new Date() },
      });
      // promote order if still pending
      await prisma.order.updateMany({
        where: { id: payment.orderId, status: "PENDING_PAYMENT" },
        data: { status: "PAID", paidAt: new Date() },
      });
      return { updated: true };
    }
  } else if (status === "EXPIRED" || status === "CANCELED" || status === "FAILED") {
    if (payment.status !== "REJECTED") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "REJECTED",
          rejectedAt: new Date(),
          failureMessage: status.toLowerCase(),
        },
      });
      return { updated: true };
    }
  }
  // ACTIVE / other states — no change here.
  return { updated: false };
}
