import { createHash } from "node:crypto";

// ChillPay Payment Gateway — "Connect by API" integration (sandbox by default).
// Docs: ChillPay Merchant Integration Manual v1.2.5.
//
// Env vars are loaded by index.ts AFTER ESM hoisting, so read process.env lazily.

const DEFAULT_API_BASE = "https://sandbox-appsrv2.chillpay.co/api/v2";

// ISO 4217 numeric — ChillPay PG settles in THB only.
export const THB_CURRENCY = "764";
// Route No. issued by ChillPay (default 1 for a single website).
export const ROUTE_NO = "1";

// e-Wallet channel codes (Appendix E).
export const CHANNEL_ALIPAY = "epayment_alipay";
export const CHANNEL_WECHATPAY = "epayment_wechatpay";
// Credit card — fully browser-testable in the sandbox with ChillPay's test cards
// (e.g. 4141 0000 0000 1414, any expiry/CVV, OTP 123456). No app / appointment needed.
export const CHANNEL_CREDITCARD = "creditcard";

type ChillpayConfig = {
  merchantCode: string;
  apiKey: string;
  md5Secret: string;
  apiBase: string;
};

export function isChillpayEnabled(): boolean {
  return Boolean(
    process.env.CHILLPAY_MERCHANT_CODE &&
      process.env.CHILLPAY_API_KEY &&
      process.env.CHILLPAY_MD5_SECRET,
  );
}

function getConfig(): ChillpayConfig {
  const merchantCode = process.env.CHILLPAY_MERCHANT_CODE;
  const apiKey = process.env.CHILLPAY_API_KEY;
  const md5Secret = process.env.CHILLPAY_MD5_SECRET;
  if (!merchantCode || !apiKey || !md5Secret) {
    throw Object.assign(new Error("PaymentGatewayDisabled"), { status: 503 });
  }
  return {
    merchantCode,
    apiKey,
    md5Secret,
    apiBase: process.env.CHILLPAY_API_BASE ?? DEFAULT_API_BASE,
  };
}

// CheckSum = MD5( concat(values...) + MD5SecretKey ). Missing values are empty strings.
function checksum(parts: Array<string | number>, secret: string): string {
  return createHash("md5").update(parts.join("") + secret).digest("hex");
}

export function cnyCentsToSatang(cnyCents: number): number {
  const rate = Number(process.env.CNY_TO_THB_RATE ?? "4.9");
  return Math.round(cnyCents * rate);
}

export type CreatePaymentInput = {
  orderNo: string;
  customerId: string;
  /** Amount in satang (THB minor units, integer). */
  amountSatang: number;
  channelCode: string;
  phoneNumber?: string;
  description?: string;
  ipAddress?: string;
  langCode?: string;
};

export type ChillpayCreateResponse = {
  Status: number;
  Code: number;
  Message: string;
  TransactionId: number;
  Amount: number;
  OrderNo: string;
  PaymentUrl: string;
  Token: string;
};

// POST /Payment/ — creates a transaction and returns the PaymentUrl to redirect the customer to.
export async function createPayment(input: CreatePaymentInput): Promise<ChillpayCreateResponse> {
  const cfg = getConfig();
  // Fields in the exact order used for the CheckSum (Table 2.2, items 1–19).
  const fields = {
    MerchantCode: cfg.merchantCode,
    OrderNo: input.orderNo,
    CustomerId: input.customerId,
    Amount: String(input.amountSatang),
    PhoneNumber: input.phoneNumber ?? "",
    Description: input.description ?? "",
    ChannelCode: input.channelCode,
    Currency: THB_CURRENCY,
    LangCode: input.langCode ?? "EN",
    RouteNo: ROUTE_NO,
    IPAddress: input.ipAddress ?? "127.0.0.1",
    ApiKey: cfg.apiKey,
    TokenFlag: "N",
    CreditToken: "",
    CreditMonth: "",
    ShopID: "",
    ProductImageUrl: "",
    CustEmail: "",
    CardType: "",
  };
  const CheckSum = checksum(Object.values(fields), cfg.md5Secret);

  const res = await fetch(`${cfg.apiBase}/Payment/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...fields, CheckSum }).toString(),
  });
  const data = (await res.json()) as ChillpayCreateResponse;
  if (data.Code !== 200 || !data.PaymentUrl) {
    throw Object.assign(new Error(`ChillpayCreateFailed: ${data.Code} ${data.Message}`), {
      status: 502,
    });
  }
  return data;
}

export type ChillpayStatusResponse = {
  TransactionId: number;
  Amount: number;
  OrderNo: string;
  CustomerId: string;
  BankCode: string;
  PaymentDate: string;
  /** Appendix C: 0=Success, 1=Fail, 2=Cancel, 3=Error, 9=Pending. */
  PaymentStatus: number;
  Currency: string;
};

// POST /PaymentStatus/ — authoritative status lookup (used for webhook re-verification + polling).
export async function getPaymentStatus(transactionId: string): Promise<ChillpayStatusResponse> {
  const cfg = getConfig();
  const CheckSum = checksum([cfg.merchantCode, transactionId, cfg.apiKey], cfg.md5Secret);
  const res = await fetch(`${cfg.apiBase}/PaymentStatus/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      MerchantCode: cfg.merchantCode,
      TransactionId: transactionId,
      ApiKey: cfg.apiKey,
      CheckSum,
    }).toString(),
  });
  return (await res.json()) as ChillpayStatusResponse;
}
