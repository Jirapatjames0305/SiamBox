// SiamPay (AsiaPay Thailand) — the fallback in docs/payment-gateway-china.md: Alipay +
// WeChat Pay + UnionPay + LINE Pay + ShopeePay for Thai merchants.
//
// ⚠️ SiamPay publishes no integration docs of its own. This is written against AsiaPay's
// shared PayDollar/PesoPay spec, which SiamPay is the Thai brand of. Every field below —
// endpoint paths, the hash recipes, the datafeed parameter names — must be confirmed
// against the integration guide AsiaPay hands over at onboarding before go-live.
//
// It differs from every other provider here in two ways:
//
//   1. There is no "create payment" API call. Checkout is a redirect to a hosted form
//      with a SHA-1 `secureHash` in the query string, so createPayment builds a URL and
//      makes no network request at all.
//   2. The datafeed (their webhook) is retried until the endpoint answers with a literal
//      "OK" — hence `webhookAckBody`.

import { createHash, timingSafeEqual } from "node:crypto";
import {
  THB_NUMERIC,
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

const DEFAULT_API_BASE = "https://www.siampay.com";
const PAY_FORM_PATH = "/b2c2/eng/payment/payForm.jsp";
const ORDER_API_PATH = "/b2c2/eng/merchant/api/orderApi.jsp";

/** Normal sale — funds captured immediately. "H" would authorise-only. */
const PAY_TYPE = "N";

type SiamPayConfig = {
  merchantId: string;
  secureHashSecret: string;
  apiBase: string;
  /** Query/refund API needs a separate portal login; payment redirect does not. */
  loginId: string | undefined;
  password: string | undefined;
};

function getConfig(): SiamPayConfig {
  const merchantId = process.env.SIAMPAY_MERCHANT_ID;
  const secureHashSecret = process.env.SIAMPAY_SECURE_HASH_SECRET;
  if (!merchantId || !secureHashSecret) throw gatewayError("PaymentGatewayDisabled", 503);
  return {
    merchantId,
    secureHashSecret,
    apiBase: process.env.SIAMPAY_API_BASE ?? DEFAULT_API_BASE,
    loginId: process.env.SIAMPAY_LOGIN_ID,
    password: process.env.SIAMPAY_PASSWORD,
  };
}

/** AsiaPay's hash is SHA-1 over the ordered fields joined by `|`, secret last. */
export function siamPaySecureHash(fields: (string | number)[], secret: string): string {
  return createHash("sha1").update([...fields, secret].join("|")).digest("hex");
}

/** AsiaPay payMethod codes. ANY omits the field so their cashier shows every method. */
function payMethod(channel: PaymentChannel): string | undefined {
  switch (channel) {
    case "ALIPAY":
      return "ALIPAYHKONL";
    case "WECHAT":
      return "WECHAT";
    case "PROMPTPAY":
      return "PROMPTPAY";
    case "ANY":
    default:
      return undefined;
  }
}

function normalizeStatus(raw: string): StatusResult {
  const value = raw.trim().toUpperCase();
  if (value === "ACCEPTED" || value === "0") return { status: "PAID", raw };
  if (value === "REJECTED" || value === "1") return { status: "FAILED", raw };
  return { status: "PENDING", raw };
}

/** The order API answers with a flat `key=value&key=value` string, not JSON. */
export function parseOrderApiResponse(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of text.trim().split("&")) {
    const idx = pair.indexOf("=");
    if (idx <= 0) continue;
    out[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
  }
  return out;
}

function requirePortalLogin(cfg: SiamPayConfig): { loginId: string; password: string } {
  if (!cfg.loginId || !cfg.password) {
    throw gatewayError("SiamPayPortalLoginNotConfigured", 503);
  }
  return { loginId: cfg.loginId, password: cfg.password };
}

async function callOrderApi(
  params: Record<string, string>,
  cfg: SiamPayConfig,
): Promise<Record<string, string>> {
  const res = await fetch(`${cfg.apiBase}${ORDER_API_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  const text = await res.text();
  if (!res.ok) {
    throw gatewayError(`SiamPayRequestFailed: ${ORDER_API_PATH} ${res.status} ${text.slice(0, 300)}`);
  }
  const parsed = parseOrderApiResponse(text);
  if (parsed.resultCode && parsed.resultCode !== "0") {
    throw gatewayError(`SiamPayOrderApiError: ${text.slice(0, 300)}`);
  }
  return parsed;
}

export const siampay: PaymentProvider = {
  id: "siampay",
  label: "SiamPay",

  // AsiaPay keeps re-sending the datafeed until it reads exactly this back.
  webhookAckBody: "OK",

  isEnabled() {
    return Boolean(process.env.SIAMPAY_MERCHANT_ID && process.env.SIAMPAY_SECURE_HASH_SECRET);
  },

  /**
   * No API call — the hosted form *is* the payment. Returns the signed URL to send the
   * customer to, so the shared redirect flow works unchanged.
   */
  async createPayment(input: CreatePaymentInput): Promise<CreatedPayment> {
    const cfg = getConfig();
    const amount = satangToDecimal(input.amountSatang);
    // Field order is fixed by AsiaPay and the hash breaks if it changes.
    const secureHash = siamPaySecureHash(
      [cfg.merchantId, input.orderNumber, THB_NUMERIC, amount, PAY_TYPE],
      cfg.secureHashSecret,
    );

    const params = new URLSearchParams({
      merchantId: cfg.merchantId,
      orderRef: input.orderNumber,
      currCode: THB_NUMERIC,
      amount,
      payType: PAY_TYPE,
      lang: process.env.SIAMPAY_LANG ?? "E",
      // One return URL for all three outcomes; the order page shows the real status.
      successUrl: input.returnUrl,
      failUrl: input.returnUrl,
      cancelUrl: input.returnUrl,
      // NIL = no payment-page mode override.
      mpsMode: "NIL",
      remark: input.description || `SiamBox ${input.orderNumber}`,
      secureHash,
    });
    const method = payMethod(input.channel);
    if (method) params.set("payMethod", method);

    return {
      // AsiaPay keys everything off orderRef until it issues a PayRef at payment time.
      gatewayRef: input.orderNumber,
      redirectUrl: `${cfg.apiBase}${PAY_FORM_PATH}?${params.toString()}`,
    };
  },

  async getStatus(ref: PaymentRef): Promise<StatusResult> {
    const cfg = getConfig();
    const { loginId, password } = requirePortalLogin(cfg);
    const result = await callOrderApi(
      {
        merchantId: cfg.merchantId,
        loginId,
        password,
        actionType: "Query",
        orderRef: ref.orderNumber,
        currCode: THB_NUMERIC,
        payType: PAY_TYPE,
      },
      cfg,
    );
    // `orderStatus` is the human-readable one; `successcode` the numeric fallback.
    return normalizeStatus(result.orderStatus ?? result.successcode ?? "unknown");
  },

  /**
   * Datafeed hash: SHA-1 over src|prc|successcode|Ref|PayRef|Cur|Amt|payerAuth|secret.
   * The body is form-encoded, so express-urlencoded has already parsed it into req.body.
   */
  verifyWebhook(req: WebhookRequest): boolean {
    const secret = process.env.SIAMPAY_SECURE_HASH_SECRET;
    // Nothing to check against (local dev) — the route re-queries the order anyway.
    if (!secret) return true;

    const body = (req.body ?? {}) as Record<string, unknown>;
    const field = (k: string) => String(body[k] ?? "");
    const received = field("secureHash");
    if (!received) return false;

    const expected = siamPaySecureHash(
      [
        field("src"),
        field("prc"),
        field("successcode"),
        field("Ref"),
        field("PayRef"),
        field("Cur"),
        field("Amt"),
        field("payerAuth"),
      ],
      secret,
    );
    const a = Buffer.from(received.toLowerCase(), "utf8");
    const b = Buffer.from(expected, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  },

  parseWebhook(req: WebhookRequest): WebhookTarget | null {
    const body = (req.body ?? {}) as Record<string, unknown>;
    // `Ref` is our orderRef. PayRef is AsiaPay's own id, which we never stored as the
    // gatewayRef — createPayment set that to the order number — so only Ref is useful.
    const ref = body.Ref ?? body.ref;
    const orderNumber = typeof ref === "string" && ref ? ref : undefined;
    if (!orderNumber) return null;
    return { orderNumber, gatewayRef: orderNumber };
  },

  async refund(input: RefundInput): Promise<{ refundRef: string }> {
    const cfg = getConfig();
    const { loginId, password } = requirePortalLogin(cfg);
    // Refunds address AsiaPay's PayRef, which only the query API can give us.
    const order = await callOrderApi(
      {
        merchantId: cfg.merchantId,
        loginId,
        password,
        actionType: "Query",
        orderRef: input.orderNumber,
        currCode: THB_NUMERIC,
        payType: PAY_TYPE,
      },
      cfg,
    );
    const payRef = order.PayRef ?? order.payRef;
    if (!payRef) {
      throw gatewayError(`SiamPayNoPayRef: ${input.orderNumber}`);
    }
    if (input.amountSatang == null) {
      // AsiaPay's refund action takes an explicit amount; there is no "refund all" flag.
      throw gatewayError("SiamPayRefundNeedsAmount", 400);
    }

    const result = await callOrderApi(
      {
        merchantId: cfg.merchantId,
        loginId,
        password,
        actionType: "Refund",
        payRef,
        amount: satangToDecimal(input.amountSatang),
        ...(input.reason ? { remark: input.reason } : {}),
      },
      cfg,
    );
    return { refundRef: result.PayRef ?? result.refRef ?? payRef };
  },
};
