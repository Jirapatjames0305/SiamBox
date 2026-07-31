// 2C2P — founded in Bangkok, majority-owned by Ant Group since 2022, so its Alipay
// connection is first-party while the contract stays with a Thai entity.
// Docs: https://developer.2c2p.com/docs/api-payment-token
//
// Every request and response body is a single JWT (HS256, merchant secret key) wrapped
// as `{ payload: "<jwt>" }`. We create a Payment Token, redirect to `webPaymentUrl`,
// and reconcile through the Payment Inquiry API plus the backend notification.

import {
  THB,
  gatewayError,
  satangToDecimal,
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
import { signJwtHS256, verifyJwtHS256 } from "./jwt.js";

const DEFAULT_API_BASE = "https://sandbox-pgw.2c2p.com";
const SUCCESS_CODE = "0000";

type TwoC2PConfig = { merchantId: string; secretKey: string; apiBase: string };

function getConfig(): TwoC2PConfig {
  const merchantId = process.env.TWOCTWOP_MERCHANT_ID;
  const secretKey = process.env.TWOCTWOP_SECRET_KEY;
  if (!merchantId || !secretKey) throw gatewayError("PaymentGatewayDisabled", 503);
  return {
    merchantId,
    secretKey,
    apiBase: process.env.TWOCTWOP_API_BASE ?? DEFAULT_API_BASE,
  };
}

// 2C2P channel codes. Leaving the list empty shows every channel enabled on the
// merchant account — the safe default when a code has not been confirmed with 2C2P.
const CHANNEL_CODES: Record<PaymentChannel, string[]> = {
  ALIPAY: ["ALIPAY"],
  WECHAT: ["WECHATPAY"],
  PROMPTPAY: ["QR"],
  ANY: [],
};

async function call2c2p(
  path: string,
  payload: Record<string, unknown>,
  cfg: TwoC2PConfig,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${cfg.apiBase}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload: signJwtHS256(payload, cfg.secretKey) }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw gatewayError(`TwoC2PRequestFailed: ${path} ${res.status} ${text}`);
  }
  const wrapper = (await res.json()) as { payload?: unknown; respCode?: unknown };
  if (typeof wrapper.payload !== "string") {
    // Errors before the JWT layer come back unwrapped.
    throw gatewayError(`TwoC2PBadResponse: ${JSON.stringify(wrapper).slice(0, 300)}`);
  }
  const decoded = verifyJwtHS256(wrapper.payload, cfg.secretKey);
  if (!decoded) throw gatewayError("TwoC2PInvalidResponseSignature");
  return decoded;
}

function assertOk(decoded: Record<string, unknown>): void {
  const code = String(decoded.respCode ?? "");
  if (code && code !== SUCCESS_CODE) {
    throw gatewayError(`TwoC2PError ${code}: ${String(decoded.respDesc ?? "")}`);
  }
}

// Payment Inquiry status codes: A=authorised, S=settled, V=voided, R=reversed/refunded,
// F=failed, P/RP=pending. Anything unknown stays PENDING so we never mark an order paid
// on a status we do not recognise.
const PAID = ["A", "S", "AP", "SP"];
const FAILED = ["V", "R", "F", "C", "E", "X"];

function normalizeStatus(raw: string): StatusResult {
  const upper = raw.toUpperCase();
  if (PAID.includes(upper)) return { status: "PAID", raw };
  if (FAILED.includes(upper)) return { status: "FAILED", raw };
  return { status: "PENDING", raw };
}

export const twoctwop: PaymentProvider = {
  id: "2c2p",
  label: "2C2P",

  isEnabled() {
    return Boolean(process.env.TWOCTWOP_MERCHANT_ID && process.env.TWOCTWOP_SECRET_KEY);
  },

  async createPayment(input: CreatePaymentInput): Promise<CreatedPayment> {
    const cfg = getConfig();
    const channels = CHANNEL_CODES[input.channel];
    const decoded = await call2c2p(
      "/payment/4.3/paymentToken",
      {
        merchantID: cfg.merchantId,
        invoiceNo: input.orderNumber,
        description: input.description ?? `SiamBox ${input.orderNumber}`,
        // 2C2P takes a decimal amount, not minor units.
        amount: Number(satangToDecimal(input.amountSatang)),
        currencyCode: THB,
        ...(channels.length ? { paymentChannel: channels } : {}),
        frontendReturnUrl: input.returnUrl,
        backendReturnUrl: process.env.TWOCTWOP_WEBHOOK_URL ?? "",
        nonceStr: `${input.orderNumber}-${Date.now()}`,
        locale: "en",
      },
      cfg,
    );
    assertOk(decoded);
    const webPaymentUrl = decoded.webPaymentUrl;
    if (typeof webPaymentUrl !== "string" || !webPaymentUrl) {
      throw gatewayError(`TwoC2PNoWebPaymentUrl: ${JSON.stringify(decoded).slice(0, 300)}`);
    }
    // Inquiry and refund both key off invoiceNo, so store that rather than the token —
    // the token expires, the invoice number does not.
    return { gatewayRef: input.orderNumber, redirectUrl: webPaymentUrl };
  },

  async getStatus(ref: PaymentRef): Promise<StatusResult> {
    const cfg = getConfig();
    const decoded = await call2c2p(
      "/payment/4.3/paymentInquiry",
      { merchantID: cfg.merchantId, invoiceNo: ref.orderNumber, locale: "en" },
      cfg,
    );
    // An unpaid invoice answers with a non-zero respCode rather than a status — treat
    // that as still pending instead of throwing, so polling stays cheap and quiet.
    const code = String(decoded.respCode ?? "");
    const raw = String(decoded.transactionStatus ?? decoded.status ?? (code || "UNKNOWN"));
    if (code && code !== SUCCESS_CODE && !decoded.transactionStatus) {
      return { status: "PENDING", raw };
    }
    return normalizeStatus(raw);
  },

  // The backend notification is the same `{ payload: <jwt> }` envelope, so verifying the
  // JWT with our secret authenticates it.
  verifyWebhook(req: WebhookRequest): boolean {
    const secret = process.env.TWOCTWOP_SECRET_KEY;
    if (!secret) return false;
    const payload = (req.body as { payload?: unknown })?.payload;
    return typeof payload === "string" && verifyJwtHS256(payload, secret) !== null;
  },

  parseWebhook(req: WebhookRequest): WebhookTarget | null {
    const secret = process.env.TWOCTWOP_SECRET_KEY;
    const payload = (req.body as { payload?: unknown })?.payload;
    if (!secret || typeof payload !== "string") return null;
    const decoded = verifyJwtHS256(payload, secret);
    const invoiceNo = decoded?.invoiceNo;
    if (typeof invoiceNo !== "string" || !invoiceNo) return null;
    return { orderNumber: invoiceNo, gatewayRef: invoiceNo };
  },

  async refund(input: RefundInput): Promise<{ refundRef: string }> {
    const cfg = getConfig();
    if (input.amountSatang == null) {
      throw gatewayError("TwoC2PRefundAmountRequired", 400);
    }
    // Payment Action API — processType "R" is refund. Verify the action endpoint version
    // enabled on your merchant account before going live.
    const decoded = await call2c2p(
      "/payment/4.3/action",
      {
        merchantID: cfg.merchantId,
        invoiceNo: input.orderNumber,
        processType: "R",
        amount: Number(satangToDecimal(input.amountSatang)),
        ...(input.reason ? { reason: input.reason } : {}),
      },
      cfg,
    );
    assertOk(decoded);
    return { refundRef: String(decoded.referenceNo ?? decoded.invoiceNo ?? input.orderNumber) };
  },
};
