// Provider-agnostic payment-gateway contract.
//
// SiamBox sells from Thailand to customers in mainland China, so the gateway must do
// *cross-border online* Alipay / WeChat Pay. Three Thai providers are implemented:
// Ksher, Opn Payments (ex-Omise) and 2C2P — see docs/payment-gateway-china.md.
//
// All three settle in THB, so every amount crossing this boundary is THB **satang**
// (integer, smallest unit). Providers that want decimal THB convert internally.

export const THB = "THB";

export type ProviderId = "ksher" | "opn" | "2c2p";

/** Logical channel the customer picked at checkout — each provider maps it to its own code. */
export type PaymentChannel = "ALIPAY" | "WECHAT" | "PROMPTPAY" | "ANY";

export type CreatePaymentInput = {
  /** Our order number — sent as the merchant reference so webhooks can find the order. */
  orderNumber: string;
  /** Integer THB satang. */
  amountSatang: number;
  channel: PaymentChannel;
  /** Where the gateway sends the customer back after paying. */
  returnUrl: string;
  description?: string;
};

export type CreatedPayment = {
  /** Provider-side identifier we persist on Payment.gatewayRef. */
  gatewayRef: string;
  /** URL to redirect the customer to (hosted page, wallet handoff, or QR image). */
  redirectUrl: string;
};

/** Provider statuses normalised to the three states our Payment record cares about. */
export type GatewayStatus = "PENDING" | "PAID" | "FAILED";

export type StatusResult = {
  status: GatewayStatus;
  /** Raw provider status, kept for logging / failureMessage. */
  raw: string;
};

/**
 * Everything a provider might need to look a payment up. Ksher and 2C2P key off the
 * merchant order number; Opn keys off its own charge id — so both travel together.
 */
export type PaymentRef = {
  gatewayRef: string;
  orderNumber: string;
};

export type RefundInput = PaymentRef & {
  /** Integer THB satang. Omit for a full refund. */
  amountSatang?: number;
  reason?: string;
};

/** Normalised view of an inbound webhook, assembled by the webhook route. */
export type WebhookRequest = {
  /** Exact bytes received — required for signature checks. */
  rawBody: Buffer;
  headers: Record<string, string | undefined>;
  query: Record<string, unknown>;
  body: unknown;
  /** Absolute URL the webhook was delivered to. Ksher signs this, so it must match. */
  url: string;
};

/** Which payment the webhook is about. Either key may be present; the route tries both. */
export type WebhookTarget = {
  gatewayRef?: string;
  orderNumber?: string;
};

export interface PaymentProvider {
  readonly id: ProviderId;
  readonly label: string;
  /** True when the provider's credentials are configured. */
  isEnabled(): boolean;
  createPayment(input: CreatePaymentInput): Promise<CreatedPayment>;
  getStatus(ref: PaymentRef): Promise<StatusResult>;
  /** Reject the request when the signature does not check out. */
  verifyWebhook(req: WebhookRequest): boolean;
  /** Null when the payload carries no reference we recognise (ignore, don't fail). */
  parseWebhook(req: WebhookRequest): WebhookTarget | null;
  refund(input: RefundInput): Promise<{ refundRef: string }>;
}

export function gatewayError(message: string, status = 502): Error {
  return Object.assign(new Error(message), { status });
}

/** Providers settle in THB but we price in CNY — convert with the configured rate. */
export function cnyCentsToSatang(cnyCents: number): number {
  const rate = Number(process.env.CNY_TO_THB_RATE ?? "4.9");
  return Math.round(cnyCents * rate);
}

/** Satang → decimal THB string, for providers whose API takes a decimal amount (2C2P). */
export function satangToDecimal(satang: number): string {
  return (satang / 100).toFixed(2);
}
