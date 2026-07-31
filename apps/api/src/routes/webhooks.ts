import { Router, type Request } from "express";
import { prisma } from "@siambox/database";
import {
  getProvider,
  isProviderId,
  type PaymentProvider,
  type WebhookRequest,
} from "../lib/payments/index.js";

export const webhooksRouter = Router();

// One route per provider: /api/webhooks/ksher, /api/webhooks/opn, /api/webhooks/2c2p.
// Point the provider dashboard at the one matching PAYMENT_PROVIDER. Keeping all three
// mounted means a provider switch needs no redeploy — only a dashboard change.
webhooksRouter.all("/:provider", async (req, res, next) => {
  try {
    const id = req.params.provider.toLowerCase();
    if (!isProviderId(id)) {
      res.status(404).json({ error: "UnknownProvider" });
      return;
    }
    const provider = getProvider(id)!;
    const hook = toWebhookRequest(req);

    if (!provider.verifyWebhook(hook)) {
      res.status(401).json({ error: "InvalidSignature" });
      return;
    }
    const target = provider.parseWebhook(hook);
    if (!target) {
      res.json({ ok: true, ignored: true });
      return;
    }
    await syncPayment(provider, target);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

function toWebhookRequest(req: Request): WebhookRequest {
  const proto = req.header("x-forwarded-proto") ?? req.protocol;
  return {
    rawBody: (req as unknown as { rawBody?: Buffer }).rawBody ?? Buffer.from(""),
    headers: req.headers as Record<string, string | undefined>,
    query: req.query as Record<string, unknown>,
    body: req.body,
    url: `${proto}://${req.get("host") ?? ""}${req.originalUrl}`,
  };
}

/**
 * Re-queries the provider (the source of truth) and maps the result onto our Payment +
 * Order records. The webhook body is only ever used to find *which* payment to check —
 * never to decide its status — so a forged notification cannot mark an order paid.
 */
export async function syncPayment(
  provider: PaymentProvider,
  target: { gatewayRef?: string; orderNumber?: string },
): Promise<{ updated: boolean }> {
  const payment = target.gatewayRef
    ? await prisma.payment.findUnique({
        where: { gatewayRef: target.gatewayRef },
        include: { order: { select: { orderNumber: true } } },
      })
    : target.orderNumber
      ? await prisma.payment.findFirst({
          where: { order: { orderNumber: target.orderNumber }, gatewayRef: { not: null } },
          orderBy: { createdAt: "desc" },
          include: { order: { select: { orderNumber: true } } },
        })
      : null;
  if (!payment?.gatewayRef) return { updated: false };

  const { status, raw } = await provider.getStatus({
    gatewayRef: payment.gatewayRef,
    orderNumber: payment.order.orderNumber,
  });

  if (status === "PAID") {
    if (payment.status === "APPROVED") return { updated: false };
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "APPROVED", approvedAt: new Date() },
    });
    // Promote the order only if it is still waiting — never walk a later status back.
    await prisma.order.updateMany({
      where: { id: payment.orderId, status: "PENDING_PAYMENT" },
      data: { status: "PAID", paidAt: new Date() },
    });
    return { updated: true };
  }

  if (status === "FAILED") {
    if (payment.status === "REJECTED") return { updated: false };
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "REJECTED", rejectedAt: new Date(), failureMessage: raw },
    });
    return { updated: true };
  }

  return { updated: false }; // still PENDING
}
