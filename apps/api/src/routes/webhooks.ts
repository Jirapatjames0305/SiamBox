import { Router, urlencoded } from "express";
import { prisma } from "@siambox/database";
import { getPaymentStatus, type ChillpayStatusResponse } from "../lib/chillpay.js";

export const webhooksRouter = Router();

// Web app base for redirecting the customer back after payment.
const WEB_BASE = process.env.WEB_BASE_URL ?? "http://localhost:3000";

// ChillPay "Back to Merchant" Result URL. ChillPay POSTs the result here (transNo, orderNo,
// respCode); we look the order up by transNo and 303-redirect the browser to its order page.
// Configure this URL in the ChillPay dashboard (Settings → Payment Channel → Result URL).
webhooksRouter.all("/chillpay/return", urlencoded({ extended: false }), async (req, res, next) => {
  try {
    const transNo = String(req.body?.transNo ?? req.query.transNo ?? "");
    let orderNumber: string | null = null;
    if (transNo) {
      const payment = await prisma.payment.findUnique({
        where: { chillpayTransactionId: transNo },
        include: { order: { select: { orderNumber: true } } },
      });
      orderNumber = payment?.order.orderNumber ?? null;
      // Best-effort: sync now so the order page already shows the final state on arrival.
      if (payment) {
        try {
          await syncStatusToPayment(await getPaymentStatus(transNo));
        } catch {
          // ignore — the order page poller will retry
        }
      }
    }
    const target = orderNumber
      ? `${WEB_BASE}/zh/orders/${orderNumber}?charge=1`
      : `${WEB_BASE}/zh/track`;
    res.redirect(303, target);
  } catch (err) {
    next(err);
  }
});

// ChillPay background notification: POST application/x-www-form-urlencoded.
// We don't trust the posted body — we take the TransactionId and re-query the
// PaymentStatus API (authoritative, authenticated) before mutating anything.
webhooksRouter.post("/chillpay", urlencoded({ extended: false }), async (req, res, next) => {
  try {
    const transactionId = String(req.body?.TransactionId ?? "");
    if (!transactionId) {
      res.json({ ok: true, ignored: true });
      return;
    }
    const status = await getPaymentStatus(transactionId);
    await syncStatusToPayment(status);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Maps a ChillPay PaymentStatus (Appendix C) onto our Payment + Order records.
export async function syncStatusToPayment(
  status: ChillpayStatusResponse,
): Promise<{ updated: boolean }> {
  const payment = await prisma.payment.findUnique({
    where: { chillpayTransactionId: String(status.TransactionId) },
  });
  if (!payment) return { updated: false };

  const code = Number(status.PaymentStatus);

  if (code === 0) {
    // 0 = Complete payment transaction
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
  } else if (code === 1 || code === 2 || code === 3) {
    // 1 = Fail, 2 = Cancel, 3 = Error
    if (payment.status !== "REJECTED") {
      const reason = code === 2 ? "cancelled" : code === 3 ? "error" : "failed";
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "REJECTED", rejectedAt: new Date(), failureMessage: reason },
      });
      return { updated: true };
    }
  }
  // code 9 (pending) and other states (void/refund/settlement) — no change here.
  return { updated: false };
}
