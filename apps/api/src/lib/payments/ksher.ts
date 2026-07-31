// Ksher — Thai PSP built specifically for China cross-border payments.
// Docs: https://doc.vip.ksher.net/docs/user_guide/apiDoc/
//
// We use the "redirect" flow: create an order, redirect the customer to the hosted
// page, then reconcile from the async notification (a GET callback) plus the order
// query API. Auth is a per-request HMAC-SHA256 signature, not a bearer token.
//
// Env vars are read lazily — index.ts loads .env after ESM hoisting.

import { createHmac, timingSafeEqual } from "node:crypto";
import {
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

const DEFAULT_API_BASE = "https://api.ksher.net";
const ORDERS_PATH = "/api/v1/redirect/orders";

type KsherConfig = { appId: string; token: string; mid?: string; apiBase: string };

function getConfig(): KsherConfig {
  const appId = process.env.KSHER_APPID;
  const token = process.env.KSHER_API_TOKEN;
  if (!appId || !token) throw gatewayError("PaymentGatewayDisabled", 503);
  return {
    appId,
    token,
    mid: process.env.KSHER_MID || undefined,
    apiBase: process.env.KSHER_API_BASE ?? DEFAULT_API_BASE,
  };
}

/**
 * Ksher signature: sort the params by ASCII name (excluding `signature`), concatenate
 * name+value with no separator, prepend `prefix` (the endpoint path for API calls, the
 * full callback URL for webhooks), then HMAC-SHA256 with the API token, uppercase hex.
 */
export function ksherSign(
  prefix: string,
  params: Record<string, string | number>,
  token: string,
): string {
  const body = Object.keys(params)
    .filter((k) => k !== "signature")
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join("");
  return createHmac("sha256", token).update(prefix + body).digest("hex").toUpperCase();
}

// Ksher channel codes. Verify against your merchant account before go-live — the
// enabled set is per-merchant and the docs list them per country.
const CHANNEL_CODES: Record<PaymentChannel, string> = {
  ALIPAY: "alipay",
  WECHAT: "wechat",
  PROMPTPAY: "promptpay",
  ANY: "", // omit `channel` → Ksher shows its aggregated method picker
};

function nowSeconds(): string {
  return String(Math.floor(Date.now() / 1000));
}

async function callKsher(
  method: "POST" | "GET" | "PUT",
  path: string,
  params: Record<string, string | number>,
  cfg: KsherConfig,
): Promise<Record<string, unknown>> {
  const signed = { ...params, signature: ksherSign(path, params, cfg.token) };
  const url = new URL(cfg.apiBase + path);
  let res: Response;
  if (method === "GET") {
    for (const [k, v] of Object.entries(signed)) url.searchParams.set(k, String(v));
    res = await fetch(url, { method });
  } else {
    res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signed),
    });
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw gatewayError(`KsherRequestFailed: ${method} ${path} ${res.status} ${text}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

/** Ksher nests its result under `data` on some endpoints and inlines it on others. */
function unwrap(json: Record<string, unknown>): Record<string, unknown> {
  const data = json.data;
  return data && typeof data === "object" ? (data as Record<string, unknown>) : json;
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value) return value;
  }
  return undefined;
}

const PAID = ["PAID", "SUCCESS", "SUCCEEDED", "TRADE_SUCCESS", "COMPLETED"];
const FAILED = ["FAILED", "CLOSED", "CANCELED", "CANCELLED", "EXPIRED", "REFUNDED"];

function normalizeStatus(raw: string): StatusResult {
  const upper = raw.toUpperCase();
  if (PAID.includes(upper)) return { status: "PAID", raw };
  if (FAILED.includes(upper)) return { status: "FAILED", raw };
  return { status: "PENDING", raw };
}

export const ksher: PaymentProvider = {
  id: "ksher",
  label: "Ksher",

  isEnabled() {
    return Boolean(process.env.KSHER_APPID && process.env.KSHER_API_TOKEN);
  },

  async createPayment(input: CreatePaymentInput): Promise<CreatedPayment> {
    const cfg = getConfig();
    const channel = CHANNEL_CODES[input.channel];
    const params: Record<string, string | number> = {
      appid: cfg.appId,
      merchant_order_id: input.orderNumber,
      // Ksher takes the amount in cents — for THB that is satang.
      amount: input.amountSatang,
      redirect_url: input.returnUrl,
      redirect_url_fail: input.returnUrl,
      timestamp: nowSeconds(),
      ...(channel ? { channel } : {}),
      ...(cfg.mid ? { mid: cfg.mid } : {}),
      ...(input.description ? { product_name: input.description } : {}),
    };
    const data = unwrap(await callKsher("POST", ORDERS_PATH, params, cfg));
    const redirectUrl = pickString(data, ["redirect_url", "payment_url", "url", "pay_url"]);
    if (!redirectUrl) {
      throw gatewayError(`KsherNoRedirectUrl: ${JSON.stringify(data).slice(0, 300)}`);
    }
    // Ksher keys every follow-up call off our own order id, so that is the stable ref.
    return { gatewayRef: input.orderNumber, redirectUrl };
  },

  async getStatus(ref: PaymentRef): Promise<StatusResult> {
    const cfg = getConfig();
    const path = `${ORDERS_PATH}/${encodeURIComponent(ref.orderNumber)}`;
    const params: Record<string, string | number> = {
      appid: cfg.appId,
      timestamp: nowSeconds(),
      ...(cfg.mid ? { mid: cfg.mid } : {}),
    };
    const data = unwrap(await callKsher("GET", path, params, cfg));
    const raw = pickString(data, ["state", "status", "order_state", "trade_state"]) ?? "UNKNOWN";
    return normalizeStatus(raw);
  },

  // The callback is a GET whose signature covers the full callback URL, so the URL we
  // rebuild must match what Ksher was configured with — pin it via KSHER_WEBHOOK_URL
  // rather than trusting Host/X-Forwarded-* headers behind a proxy.
  verifyWebhook(req: WebhookRequest): boolean {
    const token = process.env.KSHER_API_TOKEN;
    if (!token) return false;
    const received = String(req.query.signature ?? "");
    if (!received) return false;
    const params: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(req.query)) {
      if (k !== "signature") params[k] = String(v);
    }
    const base = process.env.KSHER_WEBHOOK_URL ?? req.url.split("?")[0] ?? req.url;
    const expected = ksherSign(base, params, token);
    const a = Buffer.from(expected);
    const b = Buffer.from(received.toUpperCase());
    return a.length === b.length && timingSafeEqual(a, b);
  },

  parseWebhook(req: WebhookRequest): WebhookTarget | null {
    // { type: "order", instance: <merchant_order_id>, code: "statuschange", message: "Order Paid" }
    const instance = req.query.instance;
    if (typeof instance !== "string" || !instance) return null;
    return { orderNumber: instance, gatewayRef: instance };
  },

  async refund(input: RefundInput): Promise<{ refundRef: string }> {
    const cfg = getConfig();
    const path = `${ORDERS_PATH}/${encodeURIComponent(input.orderNumber)}`;
    // Ksher has no "full refund" shorthand — the amount is required.
    if (input.amountSatang == null) {
      throw gatewayError("KsherRefundAmountRequired", 400);
    }
    const refundOrderId = `${input.orderNumber}-R${Date.now()}`;
    const params: Record<string, string | number> = {
      appid: cfg.appId,
      refund_order_id: refundOrderId,
      refund_amount: input.amountSatang,
      timestamp: nowSeconds(),
      ...(cfg.mid ? { mid: cfg.mid } : {}),
    };
    await callKsher("PUT", path, params, cfg);
    return { refundRef: refundOrderId };
  },
};
