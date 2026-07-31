// Opn Payments (formerly Omise) — Thai PSP. Its docs list both Alipay
// ("shoppers based in China") and WeChat Pay for Thailand merchant accounts.
// Docs: https://docs.omise.co/payment-methods
//
// Flow: create a Source for the chosen wallet, create a Charge against it, then send
// the customer to `authorize_uri`. Auth is HTTP Basic with the secret key as username.
//
// Note: `Alipay+` is a Singapore-only product at Opn — Thailand accounts get plain
// `alipay`. Confirm with Opn that yours is enabled for cross-border online payers.

import { createHmac, timingSafeEqual } from "node:crypto";
import {
  THB,
  gatewayError,
  type CreatePaymentInput,
  type CreatedPayment,
  type PaymentChannel,
  type PaymentProvider,
  type PaymentRef,
  type RefundInput,
  type StatusResult,
  type WebhookRequest,
  type WebhookTarget,
} from "./types.js";

const DEFAULT_API_BASE = "https://api.omise.co";

type OpnConfig = { secretKey: string; apiBase: string };

function getConfig(): OpnConfig {
  const secretKey = process.env.OPN_SECRET_KEY;
  if (!secretKey) throw gatewayError("PaymentGatewayDisabled", 503);
  return { secretKey, apiBase: process.env.OPN_API_BASE ?? DEFAULT_API_BASE };
}

function authHeader(cfg: OpnConfig): string {
  return "Basic " + Buffer.from(`${cfg.secretKey}:`).toString("base64");
}

// Omise source types. ANY falls back to PromptPay because the source-based flow needs a
// concrete type — the hosted "pick a method" page is a Ksher/2C2P feature, not an Opn one.
const SOURCE_TYPES: Record<PaymentChannel, string> = {
  ALIPAY: "alipay",
  WECHAT: "wechat_pay",
  PROMPTPAY: "promptpay",
  ANY: "promptpay",
};

async function callOpn(
  method: "POST" | "GET",
  path: string,
  body: Record<string, unknown> | undefined,
  cfg: OpnConfig,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${cfg.apiBase}${path}`, {
    method,
    headers: {
      Authorization: authHeader(cfg),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || json.object === "error") {
    throw gatewayError(
      `OpnRequestFailed: ${method} ${path} ${res.status} ${JSON.stringify(json).slice(0, 300)}`,
    );
  }
  return json;
}

function normalizeStatus(raw: string): StatusResult {
  switch (raw) {
    case "successful":
      return { status: "PAID", raw };
    case "failed":
    case "expired":
    case "reversed":
      return { status: "FAILED", raw };
    default:
      return { status: "PENDING", raw };
  }
}

export const opn: PaymentProvider = {
  id: "opn",
  label: "Opn Payments",

  isEnabled() {
    return Boolean(process.env.OPN_SECRET_KEY);
  },

  async createPayment(input: CreatePaymentInput): Promise<CreatedPayment> {
    const cfg = getConfig();
    const source = await callOpn(
      "POST",
      "/sources",
      { type: SOURCE_TYPES[input.channel], amount: input.amountSatang, currency: THB },
      cfg,
    );
    const charge = await callOpn(
      "POST",
      "/charges",
      {
        amount: input.amountSatang,
        currency: THB,
        source: source.id,
        return_uri: input.returnUrl,
        // Surfaced in the Opn dashboard and echoed back on webhook events.
        metadata: { order_number: input.orderNumber },
        ...(input.description ? { description: input.description } : {}),
      },
      cfg,
    );

    const chargeId = typeof charge.id === "string" ? charge.id : "";
    if (!chargeId) throw gatewayError("OpnNoChargeId");
    const redirectUrl = extractRedirectUrl(charge);
    if (!redirectUrl) {
      throw gatewayError(`OpnNoAuthorizeUri: ${JSON.stringify(charge).slice(0, 300)}`);
    }
    return { gatewayRef: chargeId, redirectUrl };
  },

  async getStatus(ref: PaymentRef): Promise<StatusResult> {
    const cfg = getConfig();
    const charge = await callOpn(
      "GET",
      `/charges/${encodeURIComponent(ref.gatewayRef)}`,
      undefined,
      cfg,
    );
    return normalizeStatus(String(charge.status ?? "unknown"));
  },

  // Opn does not sign its webhooks. Guard the endpoint with a secret in the URL that only
  // Opn's dashboard knows (…/api/webhooks/opn?key=<OPN_WEBHOOK_SECRET>); when the secret
  // is unset (local dev) the check is skipped. The route re-queries the charge either way,
  // so a forged body cannot mark an order paid on its own.
  verifyWebhook(req: WebhookRequest): boolean {
    const secret = process.env.OPN_WEBHOOK_SECRET;
    if (!secret) return true;
    const received = String(req.query.key ?? "");
    const a = createHmac("sha256", secret).update(secret).digest();
    const b = createHmac("sha256", secret).update(received).digest();
    return timingSafeEqual(a, b);
  },

  parseWebhook(req: WebhookRequest): WebhookTarget | null {
    // { object: "event", key: "charge.complete", data: { id: "chrg_...", status } }
    const body = req.body as { data?: { id?: unknown; metadata?: { order_number?: unknown } } };
    const id = body?.data?.id;
    if (typeof id !== "string" || !id) return null;
    const orderNumber = body?.data?.metadata?.order_number;
    return {
      gatewayRef: id,
      ...(typeof orderNumber === "string" ? { orderNumber } : {}),
    };
  },

  async refund(input: RefundInput): Promise<{ refundRef: string }> {
    const cfg = getConfig();
    // Omit `amount` for a full refund — Opn refunds the charge total.
    const refund = await callOpn(
      "POST",
      `/charges/${encodeURIComponent(input.gatewayRef)}/refunds`,
      {
        ...(input.amountSatang != null ? { amount: input.amountSatang } : {}),
        ...(input.reason ? { metadata: { reason: input.reason } } : {}),
      },
      cfg,
    );
    return { refundRef: String(refund.id ?? "") };
  },
};

/**
 * Wallet charges hand off via `authorize_uri`. PromptPay has no redirect — the customer
 * scans a QR — so fall back to the generated QR image and let the order page show it.
 */
function extractRedirectUrl(charge: Record<string, unknown>): string | undefined {
  if (typeof charge.authorize_uri === "string" && charge.authorize_uri) {
    return charge.authorize_uri;
  }
  const source = charge.source as
    | { scannable_code?: { image?: { download_uri?: unknown } } }
    | undefined;
  const qr = source?.scannable_code?.image?.download_uri;
  return typeof qr === "string" && qr ? qr : undefined;
}
