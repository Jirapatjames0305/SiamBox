// Beam Checkout — "Payment Links API" integration (sandbox/playground by default).
// Docs: https://docs.beamcheckout.com/payment-links/payment-links-api
//
// We create a hosted payment link per order and redirect the customer to its `url`,
// where they pick a method (Alipay / WeChat via eWallets, or PromptPay QR) and pay.
// Auth is HTTP Basic with base64(merchantId:apiKey).
// Env vars are loaded by index.ts AFTER ESM hoisting, so read process.env lazily.

const DEFAULT_API_BASE = "https://playground.api.beamcheckout.com";

// Beam settles in THB; netAmount is an integer in the smallest currency unit (satang).
export const THB = "THB";

type BeamConfig = {
  merchantId: string;
  apiKey: string;
  apiBase: string;
};

export function isBeamEnabled(): boolean {
  return Boolean(process.env.BEAM_MERCHANT_ID && process.env.BEAM_API_KEY);
}

function getConfig(): BeamConfig {
  const merchantId = process.env.BEAM_MERCHANT_ID;
  const apiKey = process.env.BEAM_API_KEY;
  if (!merchantId || !apiKey) {
    throw Object.assign(new Error("PaymentGatewayDisabled"), { status: 503 });
  }
  return {
    merchantId,
    apiKey,
    apiBase: process.env.BEAM_API_BASE ?? DEFAULT_API_BASE,
  };
}

function authHeader(cfg: BeamConfig): string {
  return "Basic " + Buffer.from(`${cfg.merchantId}:${cfg.apiKey}`).toString("base64");
}

// Beam PG settles in THB only → convert CNY cents to THB satang via CNY_TO_THB_RATE.
export function cnyCentsToSatang(cnyCents: number): number {
  const rate = Number(process.env.CNY_TO_THB_RATE ?? "4.9");
  return Math.round(cnyCents * rate);
}

// linkSettings toggles (groups). eWallets covers Alipay / WeChat Pay; qrPromptPay is Thai QR;
// card is debit/credit card.
export type LinkMethods = { eWallets?: boolean; qrPromptPay?: boolean; card?: boolean };

export type CreatePaymentLinkInput = {
  /** Integer, smallest currency unit (satang for THB). */
  netAmount: number;
  /** Merchant's order identifier (we use order.orderNumber). */
  referenceId: string;
  /** Which payment-method groups to enable on the hosted page. */
  methods: LinkMethods;
  /** Where Beam sends the customer back to after a successful payment. */
  redirectUrl: string;
};

export type BeamPaymentLink = { paymentLinkId: string; url: string };

// POST /api/v1/payment-links — returns the hosted checkout URL to redirect the customer to.
export async function createPaymentLink(input: CreatePaymentLinkInput): Promise<BeamPaymentLink> {
  const cfg = getConfig();
  const linkSettings: Record<string, { isEnabled: boolean }> = {};
  if (input.methods.eWallets) linkSettings.eWallets = { isEnabled: true };
  if (input.methods.qrPromptPay) linkSettings.qrPromptPay = { isEnabled: true };
  if (input.methods.card) linkSettings.card = { isEnabled: true };

  const res = await fetch(`${cfg.apiBase}/api/v1/payment-links`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader(cfg) },
    body: JSON.stringify({
      order: { netAmount: input.netAmount, currency: THB, referenceId: input.referenceId },
      linkSettings,
      redirectUrl: input.redirectUrl,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw Object.assign(new Error(`BeamPaymentLinkFailed: ${res.status} ${text}`), { status: 502 });
  }
  // Create returns { id, url }; status is fetched separately via getPaymentLink.
  const data = (await res.json()) as { id: string; url: string };
  return { paymentLinkId: data.id, url: data.url };
}

// Payment-link status — ACTIVE until paid; COMPLETED/PAID on success, EXPIRED/CANCELED otherwise.
export type BeamLinkStatus = "ACTIVE" | "COMPLETED" | "PAID" | "EXPIRED" | "CANCELED" | string;

export type BeamPaymentLinkDetail = {
  paymentLinkId: string;
  status: BeamLinkStatus;
  order?: { referenceId?: string };
};

// GET /api/v1/payment-links/{id} — authoritative status lookup (webhook re-verification + polling).
export async function getPaymentLink(paymentLinkId: string): Promise<BeamPaymentLinkDetail> {
  const cfg = getConfig();
  const res = await fetch(
    `${cfg.apiBase}/api/v1/payment-links/${encodeURIComponent(paymentLinkId)}`,
    { method: "GET", headers: { Authorization: authHeader(cfg) } },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw Object.assign(new Error(`BeamGetLinkFailed: ${res.status} ${text}`), { status: 502 });
  }
  return (await res.json()) as BeamPaymentLinkDetail;
}

export type BeamChargeListItem = {
  chargeId: string;
  status: string;
  paymentMethodType?: string;
};

// GET /api/v1/charges?referenceId={ref} — find the charge(s) for an order (we set referenceId = orderNumber).
export async function listChargesByReference(referenceId: string): Promise<BeamChargeListItem[]> {
  const cfg = getConfig();
  const res = await fetch(
    `${cfg.apiBase}/api/v1/charges?referenceId=${encodeURIComponent(referenceId)}`,
    { method: "GET", headers: { Authorization: authHeader(cfg) } },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw Object.assign(new Error(`BeamListChargesFailed: ${res.status} ${text}`), { status: 502 });
  }
  const data = (await res.json()) as { data?: BeamChargeListItem[] };
  return data.data ?? [];
}

// POST /api/v1/refunds — refund a charge. Omit `amount` for a full refund
// (partial refund is only supported for CARD charges).
export async function refundCharge(input: {
  chargeId: string;
  amount?: number;
  reason?: string;
}): Promise<{ refundId: string }> {
  const cfg = getConfig();
  const res = await fetch(`${cfg.apiBase}/api/v1/refunds`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader(cfg) },
    body: JSON.stringify({
      chargeId: input.chargeId,
      ...(input.amount != null ? { amount: input.amount } : {}),
      ...(input.reason ? { reason: input.reason } : {}),
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw Object.assign(new Error(`BeamRefundFailed: ${res.status} ${text}`), { status: 502 });
  }
  return (await res.json()) as { refundId: string };
}
