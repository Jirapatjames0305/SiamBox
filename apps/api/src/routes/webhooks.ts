import { Router } from "express";
import { prisma } from "@siambox/database";
import { getOmise } from "../lib/omise.js";

export const webhooksRouter = Router();

// Omise event payload shape (minimal — we re-verify from API so we don't trust full body)
type OmiseEvent = {
  id?: string;
  key?: string;
  data?: { id?: string; object?: string };
};

webhooksRouter.post("/omise", async (req, res, next) => {
  try {
    const event = req.body as OmiseEvent;
    const chargeId = event?.data?.id;

    // We only care about charge events. Other event types are ignored silently.
    if (!chargeId || event?.data?.object !== "charge") {
      res.json({ ok: true, ignored: true });
      return;
    }

    // Re-fetch the charge from Omise to verify (don't trust webhook payload)
    const charge = await getOmise().charges.retrieve(chargeId);
    await syncChargeToPayment(charge);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export async function syncChargeToPayment(charge: {
  id: string;
  paid?: boolean;
  status?: string;
  failure_code?: string | null;
  failure_message?: string | null;
}): Promise<{ updated: boolean }> {
  const payment = await prisma.payment.findUnique({
    where: { omiseChargeId: charge.id },
  });
  if (!payment) return { updated: false };

  if (charge.paid === true) {
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
  } else if (charge.status === "failed" || charge.status === "expired") {
    if (payment.status !== "REJECTED") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "REJECTED",
          rejectedAt: new Date(),
          failureMessage: charge.failure_message ?? charge.failure_code ?? charge.status,
        },
      });
      return { updated: true };
    }
  }
  return { updated: false };
}
