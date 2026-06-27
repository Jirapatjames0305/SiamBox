import { Router, json } from "express";
import { prisma } from "@siambox/database";
import { getPaymentLink, type BeamPaymentLinkDetail } from "../lib/beam.js";

export const webhooksRouter = Router();

// Beam background notification: POST application/json.
// We don't trust the posted body — we take the paymentLinkId and re-query the
// Get Payment Link API (authoritative, authenticated) before mutating anything.
// (Signature verification will be added with the full webhook setup.)
webhooksRouter.post("/beam", json(), async (req, res, next) => {
  try {
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
