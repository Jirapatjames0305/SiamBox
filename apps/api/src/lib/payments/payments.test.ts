import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { ksher, ksherSign } from "./ksher.js";
import { opn } from "./opn.js";
import { twoctwop } from "./twoctwop.js";
import { signJwtHS256, verifyJwtHS256 } from "./jwt.js";
import { activeProvider, getProvider, isProviderId } from "./index.js";
import { cnyCentsToSatang, satangToDecimal, type WebhookRequest } from "./types.js";

const ENV_KEYS = [
  "PAYMENT_PROVIDER",
  "CNY_TO_THB_RATE",
  "KSHER_APPID",
  "KSHER_API_TOKEN",
  "KSHER_API_BASE",
  "KSHER_WEBHOOK_URL",
  "OPN_SECRET_KEY",
  "OPN_API_BASE",
  "OPN_WEBHOOK_SECRET",
  "TWOCTWOP_MERCHANT_ID",
  "TWOCTWOP_SECRET_KEY",
  "TWOCTWOP_API_BASE",
];

let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const key of ENV_KEYS) delete process.env[key];
});

afterEach(() => {
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  vi.unstubAllGlobals();
});

/** Stubs fetch with canned JSON responses and records what was sent. */
function stubFetch(...responses: unknown[]) {
  const calls: { url: string; method: string; body: unknown }[] = [];
  let i = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL, init?: RequestInit) => {
      calls.push({
        url: String(input),
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      });
      const payload = responses[Math.min(i++, responses.length - 1)];
      return { ok: true, json: async () => payload, text: async () => JSON.stringify(payload) };
    }),
  );
  return calls;
}

function webhook(partial: Partial<WebhookRequest>): WebhookRequest {
  return {
    rawBody: Buffer.from(""),
    headers: {},
    query: {},
    body: undefined,
    url: "https://api.siambox.shop/api/webhooks/x",
    ...partial,
  };
}

describe("currency conversion", () => {
  it("converts CNY cents to THB satang at the configured rate", () => {
    process.env.CNY_TO_THB_RATE = "5.0";
    expect(cnyCentsToSatang(10_000)).toBe(50_000); // ¥100.00 → ฿500.00
  });

  it("falls back to 4.9 and rounds to a whole satang", () => {
    expect(cnyCentsToSatang(333)).toBe(1632); // 333 * 4.9 = 1631.7
  });

  it("renders satang as a decimal THB string for 2C2P", () => {
    expect(satangToDecimal(50_000)).toBe("500.00");
    expect(satangToDecimal(1)).toBe("0.01");
  });
});

describe("provider registry", () => {
  it("resolves only known provider ids", () => {
    expect(isProviderId("ksher")).toBe(true);
    expect(isProviderId("2c2p")).toBe(true);
    expect(isProviderId("beam")).toBe(false);
    expect(getProvider("beam")).toBeNull();
    expect(getProvider(null)).toBeNull();
  });

  it("returns no active provider until one is selected and configured", () => {
    expect(activeProvider()).toBeNull();

    process.env.PAYMENT_PROVIDER = "ksher";
    expect(activeProvider()).toBeNull(); // selected but credentials missing

    process.env.KSHER_APPID = "app";
    process.env.KSHER_API_TOKEN = "token";
    expect(activeProvider()?.id).toBe("ksher");
  });

  it("ignores an unrecognised PAYMENT_PROVIDER instead of throwing", () => {
    process.env.PAYMENT_PROVIDER = "stripe";
    expect(activeProvider()).toBeNull();
  });
});

describe("ksher", () => {
  beforeEach(() => {
    process.env.KSHER_APPID = "app123";
    process.env.KSHER_API_TOKEN = "secret-token";
    process.env.KSHER_API_BASE = "https://api.example.test";
  });

  it("signs params sorted by name, prefixed by the path, uppercase hex", () => {
    // The docs' worked example: {foo:1, bar:2, foo_bar:3, foobar:4} on /p
    // must serialise to "/p" + "bar2foo1foo_bar3foobar4".
    const expected = createHmac("sha256", "secret-token")
      .update("/pbar2foo1foo_bar3foobar4")
      .digest("hex")
      .toUpperCase();
    expect(ksherSign("/p", { foo: 1, bar: 2, foo_bar: 3, foobar: 4 }, "secret-token")).toBe(expected);
  });

  it("excludes an existing signature field from the signature itself", () => {
    const withSig = ksherSign("/p", { a: 1, signature: "stale" }, "secret-token");
    expect(withSig).toBe(ksherSign("/p", { a: 1 }, "secret-token"));
  });

  it("creates a redirect order and keys the payment off our order number", async () => {
    const calls = stubFetch({ data: { redirect_url: "https://pay.ksher.test/abc" } });
    const created = await ksher.createPayment({
      orderNumber: "SB-1001",
      amountSatang: 50_000,
      channel: "ALIPAY",
      returnUrl: "https://siambox.shop/zh/orders/SB-1001",
    });

    expect(created).toEqual({ gatewayRef: "SB-1001", redirectUrl: "https://pay.ksher.test/abc" });
    const body = calls[0]!.body as Record<string, unknown>;
    expect(calls[0]!.url).toBe("https://api.example.test/api/v1/redirect/orders");
    expect(body.merchant_order_id).toBe("SB-1001");
    expect(body.amount).toBe(50_000);
    expect(body.channel).toBe("alipay");
    expect(body.signature).toBeTypeOf("string");
  });

  it("throws rather than redirecting nowhere when the response has no URL", async () => {
    stubFetch({ data: { code: "0" } });
    await expect(
      ksher.createPayment({
        orderNumber: "SB-1002",
        amountSatang: 100,
        channel: "WECHAT",
        returnUrl: "https://siambox.shop/x",
      }),
    ).rejects.toThrow(/KsherNoRedirectUrl/);
  });

  it("normalises order state to PAID / FAILED / PENDING", async () => {
    stubFetch({ data: { state: "PAID" } });
    expect((await ksher.getStatus({ gatewayRef: "SB-1", orderNumber: "SB-1" })).status).toBe("PAID");

    stubFetch({ data: { state: "EXPIRED" } });
    expect((await ksher.getStatus({ gatewayRef: "SB-2", orderNumber: "SB-2" })).status).toBe(
      "FAILED",
    );

    // Unknown states must stay PENDING — never mark an order paid on a status we can't read.
    stubFetch({ data: { state: "SOMETHING_NEW" } });
    expect((await ksher.getStatus({ gatewayRef: "SB-3", orderNumber: "SB-3" })).status).toBe(
      "PENDING",
    );
  });

  it("accepts a correctly signed callback and rejects a tampered one", () => {
    process.env.KSHER_WEBHOOK_URL = "https://api.siambox.shop/api/webhooks/ksher";
    const query = { type: "order", instance: "SB-1001", code: "statuschange", message: "Order Paid" };
    const signature = ksherSign(process.env.KSHER_WEBHOOK_URL, query, "secret-token");

    const good = webhook({ query: { ...query, signature } });
    expect(ksher.verifyWebhook(good)).toBe(true);
    expect(ksher.parseWebhook(good)).toEqual({ orderNumber: "SB-1001", gatewayRef: "SB-1001" });

    // Same signature, different order number → must not verify.
    expect(ksher.verifyWebhook(webhook({ query: { ...query, instance: "SB-9999", signature } }))).toBe(
      false,
    );
    expect(ksher.verifyWebhook(webhook({ query }))).toBe(false); // no signature at all
  });
});

describe("opn payments", () => {
  beforeEach(() => {
    process.env.OPN_SECRET_KEY = "skey_test_123";
    process.env.OPN_API_BASE = "https://api.opn.test";
  });

  it("creates a source then a charge and returns the authorize_uri", async () => {
    const calls = stubFetch(
      { id: "src_1", object: "source" },
      { id: "chrg_1", object: "charge", status: "pending", authorize_uri: "https://auth.test/1" },
    );
    const created = await opn.createPayment({
      orderNumber: "SB-2001",
      amountSatang: 20_000,
      channel: "WECHAT",
      returnUrl: "https://siambox.shop/zh/orders/SB-2001",
    });

    expect(created).toEqual({ gatewayRef: "chrg_1", redirectUrl: "https://auth.test/1" });
    expect(calls[0]!.url).toBe("https://api.opn.test/sources");
    expect((calls[0]!.body as Record<string, unknown>).type).toBe("wechat_pay");
    const charge = calls[1]!.body as Record<string, unknown>;
    expect(calls[1]!.url).toBe("https://api.opn.test/charges");
    expect(charge.source).toBe("src_1");
    expect(charge.return_uri).toBe("https://siambox.shop/zh/orders/SB-2001");
    // The order number rides along so webhooks can be traced back without a DB lookup.
    expect(charge.metadata).toEqual({ order_number: "SB-2001" });
  });

  it("falls back to the PromptPay QR image when there is no redirect", async () => {
    stubFetch(
      { id: "src_2", object: "source" },
      {
        id: "chrg_2",
        object: "charge",
        status: "pending",
        source: { scannable_code: { image: { download_uri: "https://qr.test/2.png" } } },
      },
    );
    const created = await opn.createPayment({
      orderNumber: "SB-2002",
      amountSatang: 5_000,
      channel: "PROMPTPAY",
      returnUrl: "https://siambox.shop/x",
    });
    expect(created.redirectUrl).toBe("https://qr.test/2.png");
  });

  it("treats an error envelope as a failure even on HTTP 200", async () => {
    stubFetch({ object: "error", code: "invalid_charge", message: "amount too low" });
    await expect(
      opn.createPayment({
        orderNumber: "SB-2003",
        amountSatang: 1,
        channel: "ALIPAY",
        returnUrl: "https://siambox.shop/x",
      }),
    ).rejects.toThrow(/OpnRequestFailed/);
  });

  it("maps charge statuses", async () => {
    stubFetch({ id: "chrg_3", status: "successful" });
    expect((await opn.getStatus({ gatewayRef: "chrg_3", orderNumber: "SB-1" })).status).toBe("PAID");

    stubFetch({ id: "chrg_4", status: "expired" });
    expect((await opn.getStatus({ gatewayRef: "chrg_4", orderNumber: "SB-1" })).status).toBe(
      "FAILED",
    );

    stubFetch({ id: "chrg_5", status: "pending" });
    expect((await opn.getStatus({ gatewayRef: "chrg_5", orderNumber: "SB-1" })).status).toBe(
      "PENDING",
    );
  });

  it("guards the unsigned webhook with the URL secret when one is set", () => {
    const event = { object: "event", key: "charge.complete", data: { id: "chrg_9" } };
    // No secret configured (local dev) → open.
    expect(opn.verifyWebhook(webhook({ body: event }))).toBe(true);

    process.env.OPN_WEBHOOK_SECRET = "hunter2";
    expect(opn.verifyWebhook(webhook({ body: event, query: { key: "hunter2" } }))).toBe(true);
    expect(opn.verifyWebhook(webhook({ body: event, query: { key: "wrong" } }))).toBe(false);
    expect(opn.verifyWebhook(webhook({ body: event }))).toBe(false);
  });

  it("reads the charge id out of the event body", () => {
    expect(
      opn.parseWebhook(
        webhook({
          body: { data: { id: "chrg_9", metadata: { order_number: "SB-3001" } } },
        }),
      ),
    ).toEqual({ gatewayRef: "chrg_9", orderNumber: "SB-3001" });
    expect(opn.parseWebhook(webhook({ body: { object: "event" } }))).toBeNull();
  });
});

describe("2c2p", () => {
  const SECRET = "merchant-secret";

  beforeEach(() => {
    process.env.TWOCTWOP_MERCHANT_ID = "M123";
    process.env.TWOCTWOP_SECRET_KEY = SECRET;
    process.env.TWOCTWOP_API_BASE = "https://pgw.test";
  });

  it("round-trips a JWT and rejects a tampered payload", () => {
    const token = signJwtHS256({ invoiceNo: "SB-1", respCode: "0000" }, SECRET);
    expect(verifyJwtHS256(token, SECRET)).toEqual({ invoiceNo: "SB-1", respCode: "0000" });
    expect(verifyJwtHS256(token, "other-secret")).toBeNull();

    const [header, , signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ invoiceNo: "SB-EVIL" }))
      .toString("base64url");
    expect(verifyJwtHS256(`${header}.${forged}.${signature}`, SECRET)).toBeNull();
    expect(verifyJwtHS256("not-a-jwt", SECRET)).toBeNull();
  });

  it("wraps the payment-token request in a signed JWT and returns webPaymentUrl", async () => {
    const calls = stubFetch({
      payload: signJwtHS256(
        { respCode: "0000", webPaymentUrl: "https://pgw.test/pay/xyz", paymentToken: "tok_1" },
        SECRET,
      ),
    });
    const created = await twoctwop.createPayment({
      orderNumber: "SB-4001",
      amountSatang: 123_456,
      channel: "ALIPAY",
      returnUrl: "https://siambox.shop/zh/orders/SB-4001",
    });

    expect(created).toEqual({ gatewayRef: "SB-4001", redirectUrl: "https://pgw.test/pay/xyz" });
    expect(calls[0]!.url).toBe("https://pgw.test/payment/4.3/paymentToken");
    const sent = verifyJwtHS256(String((calls[0]!.body as { payload: string }).payload), SECRET)!;
    expect(sent.invoiceNo).toBe("SB-4001");
    // 2C2P wants decimal THB, not satang.
    expect(sent.amount).toBe(1234.56);
    expect(sent.currencyCode).toBe("THB");
    expect(sent.paymentChannel).toEqual(["ALIPAY"]);
  });

  it("surfaces a non-zero respCode as an error", async () => {
    stubFetch({ payload: signJwtHS256({ respCode: "1005", respDesc: "Invalid merchant" }, SECRET) });
    await expect(
      twoctwop.createPayment({
        orderNumber: "SB-4002",
        amountSatang: 100,
        channel: "ANY",
        returnUrl: "https://siambox.shop/x",
      }),
    ).rejects.toThrow(/TwoC2PError 1005/);
  });

  it("refuses a response we cannot authenticate", async () => {
    stubFetch({ payload: signJwtHS256({ respCode: "0000" }, "someone-elses-secret") });
    await expect(
      twoctwop.getStatus({ gatewayRef: "SB-4003", orderNumber: "SB-4003" }),
    ).rejects.toThrow(/TwoC2PInvalidResponseSignature/);
  });

  it("maps inquiry statuses and keeps an unpaid invoice pending", async () => {
    stubFetch({ payload: signJwtHS256({ respCode: "0000", transactionStatus: "S" }, SECRET) });
    expect((await twoctwop.getStatus({ gatewayRef: "SB-1", orderNumber: "SB-1" })).status).toBe(
      "PAID",
    );

    stubFetch({ payload: signJwtHS256({ respCode: "0000", transactionStatus: "F" }, SECRET) });
    expect((await twoctwop.getStatus({ gatewayRef: "SB-2", orderNumber: "SB-2" })).status).toBe(
      "FAILED",
    );

    // "invoice not found yet" answers with an error code and no status — not a failure.
    stubFetch({ payload: signJwtHS256({ respCode: "4001", respDesc: "No records" }, SECRET) });
    expect((await twoctwop.getStatus({ gatewayRef: "SB-3", orderNumber: "SB-3" })).status).toBe(
      "PENDING",
    );
  });

  it("authenticates the backend notification by its JWT signature", () => {
    const good = webhook({
      body: { payload: signJwtHS256({ invoiceNo: "SB-4004", respCode: "0000" }, SECRET) },
    });
    expect(twoctwop.verifyWebhook(good)).toBe(true);
    expect(twoctwop.parseWebhook(good)).toEqual({
      orderNumber: "SB-4004",
      gatewayRef: "SB-4004",
    });

    const forged = webhook({
      body: { payload: signJwtHS256({ invoiceNo: "SB-4004" }, "wrong-secret") },
    });
    expect(twoctwop.verifyWebhook(forged)).toBe(false);
    expect(twoctwop.verifyWebhook(webhook({ body: {} }))).toBe(false);
  });
});
