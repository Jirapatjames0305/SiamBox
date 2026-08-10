// Antom (Ant International) — first-party Alipay + WeChat Pay, the option
// docs/payment-gateway-china.md rates best overall: no setup/monthly fee, infrastructure
// already inside China, and it accepts Thai merchants.
//
// Docs: https://global.alipay.com/docs/ac/ams/api
//
// Auth is RSA-SHA256, not a shared secret like the Thai PSPs. Every request carries
//   Signature: algorithm=RSA256,keyVersion=1,signature=<url-encoded base64>
// over the string  "<METHOD> <path>\n<clientId>.<requestTime>.<body>"  signed with our
// private key. Notifications come back signed the same way with Antom's public key, so
// verifyWebhook is a real cryptographic check rather than a shared-secret compare.
//
// Amounts stay THB satang: Antom's `paymentAmount.value` is the currency's minor unit as
// a string, which for THB is the satang. Antom can also settle CNY directly (the reason
// the doc favours it) — that would remove cnyCentsToSatang entirely, but the shared
// contract in types.ts is THB-only today, so this provider follows suit.

import { constants, createSign, createVerify, randomUUID } from "node:crypto";
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

const DEFAULT_API_BASE = "https://open-sea-global.alipay.com";
const KEY_VERSION = "1";

type AntomConfig = {
  clientId: string;
  privateKey: string;
  publicKey: string | undefined;
  apiBase: string;
};

/**
 * Keys are pasted into .env as one line with literal "\n" escapes. Restore the newlines
 * and wrap in PEM armour when the header is missing, so either form works.
 */
function normalizeKey(raw: string, label: "PRIVATE" | "PUBLIC"): string {
  const body = raw.trim().replace(/\\n/g, "\n");
  if (body.includes("-----BEGIN")) return body;
  const header = label === "PRIVATE" ? "PRIVATE KEY" : "PUBLIC KEY";
  const wrapped = body.replace(/\s+/g, "").replace(/(.{64})/g, "$1\n").trim();
  return `-----BEGIN ${header}-----\n${wrapped}\n-----END ${header}-----`;
}

function getConfig(): AntomConfig {
  const clientId = process.env.ANTOM_CLIENT_ID;
  const privateKey = process.env.ANTOM_PRIVATE_KEY;
  if (!clientId || !privateKey) throw gatewayError("PaymentGatewayDisabled", 503);
  return {
    clientId,
    privateKey: normalizeKey(privateKey, "PRIVATE"),
    publicKey: process.env.ANTOM_PUBLIC_KEY
      ? normalizeKey(process.env.ANTOM_PUBLIC_KEY, "PUBLIC")
      : undefined,
    apiBase: process.env.ANTOM_API_BASE ?? DEFAULT_API_BASE,
  };
}

/** Antom wants ISO-8601 *with* a timezone offset — `Z` is rejected. */
export function antomRequestTime(date = new Date()): string {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const pad = (n: number) => String(n).padStart(2, "0");
  const local = new Date(date.getTime() + offsetMinutes * 60_000).toISOString().slice(0, 23);
  return `${local}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** The exact bytes Antom signs, both outbound and on notifications. */
export function antomSignatureContent(
  method: string,
  path: string,
  clientId: string,
  time: string,
  body: string,
): string {
  return `${method} ${path}\n${clientId}.${time}.${body}`;
}

export function antomSign(content: string, privateKey: string): string {
  return createSign("RSA-SHA256").update(content, "utf8").sign(
    { key: privateKey, padding: constants.RSA_PKCS1_PADDING },
    "base64",
  );
}

export function antomVerify(content: string, signature: string, publicKey: string): boolean {
  try {
    return createVerify("RSA-SHA256")
      .update(content, "utf8")
      .verify({ key: publicKey, padding: constants.RSA_PKCS1_PADDING }, signature, "base64");
  } catch {
    // Malformed key or non-base64 signature — a failed verification, not a crash.
    return false;
  }
}

/** Pulls `signature=<value>` out of the `algorithm=…,keyVersion=…,signature=…` header. */
export function parseSignatureHeader(header: string): string | null {
  for (const part of header.split(",")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === "signature") return decodeURIComponent(rest.join("="));
  }
  return null;
}

/**
 * ANY defaults to Alipay CN — mainland China is what this provider is here for. Override
 * per-deployment with ANTOM_PAYMENT_METHOD once Antom confirms which methods are live on
 * the account.
 */
function paymentMethodType(channel: PaymentChannel): string {
  switch (channel) {
    case "ALIPAY":
      return "ALIPAY_CN";
    case "WECHAT":
      return "WECHATPAY_CN";
    case "PROMPTPAY":
      return "PROMPTPAY";
    case "ANY":
    default:
      return process.env.ANTOM_PAYMENT_METHOD?.trim() || "ALIPAY_CN";
  }
}

async function callAntom(
  path: string,
  payload: Record<string, unknown>,
  cfg: AntomConfig,
): Promise<Record<string, unknown>> {
  const body = JSON.stringify(payload);
  const requestTime = antomRequestTime();
  const signature = antomSign(
    antomSignatureContent("POST", path, cfg.clientId, requestTime, body),
    cfg.privateKey,
  );

  const res = await fetch(`${cfg.apiBase}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "client-id": cfg.clientId,
      "request-time": requestTime,
      Signature: `algorithm=RSA256,keyVersion=${KEY_VERSION},signature=${encodeURIComponent(signature)}`,
    },
    body,
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const result = json.result as { resultStatus?: string; resultCode?: string } | undefined;
  // resultStatus U = unknown/in-progress, which is not an error — the caller re-queries.
  if (!res.ok || result?.resultStatus === "F") {
    throw gatewayError(
      `AntomRequestFailed: POST ${path} ${res.status} ${JSON.stringify(json).slice(0, 300)}`,
    );
  }
  return json;
}

function normalizeStatus(raw: string): StatusResult {
  switch (raw) {
    case "SUCCESS":
      return { status: "PAID", raw };
    case "FAIL":
    case "CANCELLED":
      return { status: "FAILED", raw };
    default:
      return { status: "PENDING", raw };
  }
}

export const antom: PaymentProvider = {
  id: "antom",
  label: "Antom",

  isEnabled() {
    return Boolean(process.env.ANTOM_CLIENT_ID && process.env.ANTOM_PRIVATE_KEY);
  },

  async createPayment(input: CreatePaymentInput): Promise<CreatedPayment> {
    const cfg = getConfig();
    // paymentRequestId is our idempotency key *and* the handle every later call uses,
    // so it is the order number verbatim — never a random id we would have to store.
    const json = await callAntom(
      "/ams/api/v1/payments/pay",
      {
        productCode: "CASHIER_PAYMENT",
        paymentRequestId: input.orderNumber,
        paymentAmount: { currency: THB, value: String(input.amountSatang) },
        paymentMethod: { paymentMethodType: paymentMethodType(input.channel) },
        paymentRedirectUrl: input.returnUrl,
        ...(process.env.ANTOM_NOTIFY_URL ? { paymentNotifyUrl: process.env.ANTOM_NOTIFY_URL } : {}),
        order: {
          orderDescription: input.description || `SiamBox ${input.orderNumber}`,
          referenceOrderId: input.orderNumber,
          orderAmount: { currency: THB, value: String(input.amountSatang) },
        },
      },
      cfg,
    );

    const redirectUrl = [json.normalUrl, json.applinkUrl, json.schemeUrl].find(
      (u): u is string => typeof u === "string" && u.length > 0,
    );
    if (!redirectUrl) {
      throw gatewayError(`AntomNoRedirectUrl: ${JSON.stringify(json).slice(0, 300)}`);
    }
    // paymentId is Antom's own handle — needed for refunds, so it is what we persist.
    const paymentId = typeof json.paymentId === "string" ? json.paymentId : input.orderNumber;
    return { gatewayRef: paymentId, redirectUrl };
  },

  async getStatus(ref: PaymentRef): Promise<StatusResult> {
    const cfg = getConfig();
    const json = await callAntom(
      "/ams/api/v1/payments/inquiryPayment",
      { paymentRequestId: ref.orderNumber },
      cfg,
    );
    return normalizeStatus(String(json.paymentStatus ?? "UNKNOWN"));
  },

  /**
   * Notifications are signed with Antom's key over
   * "POST <notify path>\n<clientId>.<response-time>.<body>".
   *
   * Without ANTOM_PUBLIC_KEY there is nothing to verify against, so the check is skipped
   * — the route re-queries Antom for the real status regardless, so an unsigned body
   * still cannot mark an order paid on its own.
   */
  verifyWebhook(req: WebhookRequest): boolean {
    const publicKey = process.env.ANTOM_PUBLIC_KEY;
    if (!publicKey) return true;

    const clientId = process.env.ANTOM_CLIENT_ID;
    const header = req.headers["signature"];
    const time = req.headers["request-time"] ?? req.headers["response-time"];
    if (!clientId || !header || !time) return false;

    const signature = parseSignatureHeader(header);
    if (!signature) return false;

    const path = new URL(req.url).pathname;
    const content = antomSignatureContent(
      "POST",
      path,
      clientId,
      time,
      req.rawBody.toString("utf8"),
    );
    return antomVerify(content, signature, normalizeKey(publicKey, "PUBLIC"));
  },

  parseWebhook(req: WebhookRequest): WebhookTarget | null {
    // { notifyType: "PAYMENT_RESULT", paymentRequestId, paymentId, paymentStatus }
    const body = req.body as
      | { paymentRequestId?: unknown; paymentId?: unknown }
      | undefined;
    const orderNumber =
      typeof body?.paymentRequestId === "string" && body.paymentRequestId
        ? body.paymentRequestId
        : undefined;
    const gatewayRef =
      typeof body?.paymentId === "string" && body.paymentId ? body.paymentId : undefined;
    if (!orderNumber && !gatewayRef) return null;
    return { ...(gatewayRef ? { gatewayRef } : {}), ...(orderNumber ? { orderNumber } : {}) };
  },

  async refund(input: RefundInput): Promise<{ refundRef: string }> {
    const cfg = getConfig();
    // Antom has no "refund everything" flag — a full refund must state the amount, and
    // we only know it when the caller passes one.
    if (input.amountSatang == null) {
      throw gatewayError("AntomRefundNeedsAmount", 400);
    }
    const refundRequestId = `${input.orderNumber}-R-${randomUUID().slice(0, 8)}`;
    const json = await callAntom(
      "/ams/api/v1/payments/refund",
      {
        refundRequestId,
        paymentId: input.gatewayRef,
        refundAmount: { currency: THB, value: String(input.amountSatang) },
        ...(input.reason ? { refundReason: input.reason } : {}),
      },
      cfg,
    );
    return { refundRef: String(json.refundId ?? refundRequestId) };
  },
};
