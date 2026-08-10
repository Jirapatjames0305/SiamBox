import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { constants, createHash, createHmac, createVerify, generateKeyPairSync } from "node:crypto";
import { antom, antomRequestTime, antomSign, antomSignatureContent, parseSignatureHeader } from "./antom.js";
import { ksher, ksherSign } from "./ksher.js";
import { opn } from "./opn.js";
import { siampay, siamPaySecureHash, parseOrderApiResponse } from "./siampay.js";
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
  "ANTOM_CLIENT_ID",
  "ANTOM_PRIVATE_KEY",
  "ANTOM_PUBLIC_KEY",
  "ANTOM_API_BASE",
  "ANTOM_NOTIFY_URL",
  "ANTOM_PAYMENT_METHOD",
  "SIAMPAY_MERCHANT_ID",
  "SIAMPAY_SECURE_HASH_SECRET",
  "SIAMPAY_API_BASE",
  "SIAMPAY_LOGIN_ID",
  "SIAMPAY_PASSWORD",
  "SIAMPAY_LANG",
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

function tryJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/** Stubs fetch with canned JSON responses and records what was sent. */
function stubFetch(...responses: unknown[]) {
  const calls: {
    url: string;
    method: string;
    body: unknown;
    headers: Record<string, string>;
  }[] = [];
  let i = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL, init?: RequestInit) => {
      calls.push({
        url: String(input),
        method: init?.method ?? "GET",
        // Most providers send JSON; SiamPay sends form-urlencoded. Keep the raw string
        // when it is not JSON so form bodies stay assertable.
        body: init?.body ? tryJson(String(init.body)) : undefined,
        headers: (init?.headers ?? {}) as Record<string, string>,
      });
      const payload = responses[Math.min(i++, responses.length - 1)];
      // SiamPay's order API answers with a flat key=value string, so a canned response
      // that is already a string is passed through to text() verbatim.
      return {
        ok: true,
        json: async () => payload,
        text: async () => (typeof payload === "string" ? payload : JSON.stringify(payload)),
      };
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

describe("antom", () => {
  // Throwaway 2048-bit pair generated for this suite only.
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  beforeEach(() => {
    process.env.ANTOM_CLIENT_ID = "CLIENT123";
    process.env.ANTOM_PRIVATE_KEY = privateKey;
    process.env.ANTOM_API_BASE = "https://antom.test";
  });

  it("needs both the client id and the private key to be enabled", () => {
    delete process.env.ANTOM_PRIVATE_KEY;
    expect(antom.isEnabled()).toBe(false);
    process.env.ANTOM_PRIVATE_KEY = privateKey;
    expect(antom.isEnabled()).toBe(true);
  });

  it("stamps request-time with an offset, never a bare Z", () => {
    // Antom rejects "Z" — the offset must be spelled out.
    expect(antomRequestTime()).toMatch(/[+-]\d{2}:\d{2}$/);
    expect(antomRequestTime()).not.toMatch(/Z$/);
  });

  it("builds the signature content exactly as Antom specifies", () => {
    expect(antomSignatureContent("POST", "/ams/api/v1/payments/pay", "C1", "T1", "{}")).toBe(
      "POST /ams/api/v1/payments/pay\nC1.T1.{}",
    );
  });

  it("parses the signature out of the structured header", () => {
    expect(
      parseSignatureHeader("algorithm=RSA256,keyVersion=1,signature=abc%2Bdef%3D"),
    ).toBe("abc+def=");
    expect(parseSignatureHeader("algorithm=RSA256")).toBeNull();
  });

  it("signs the request and sends THB satang as a string", async () => {
    const calls = stubFetch({
      result: { resultStatus: "S", resultCode: "SUCCESS" },
      paymentId: "20260807ABC",
      normalUrl: "https://antom.test/checkout/abc",
    });
    const created = await antom.createPayment({
      orderNumber: "SB-7001",
      amountSatang: 50_000,
      channel: "ALIPAY",
      returnUrl: "https://siambox.shop/orders/SB-7001",
    });

    // gatewayRef is Antom's paymentId — refunds address that, not our order number.
    expect(created).toEqual({
      gatewayRef: "20260807ABC",
      redirectUrl: "https://antom.test/checkout/abc",
    });

    const [call] = calls;
    expect(call.url).toBe("https://antom.test/ams/api/v1/payments/pay");
    expect(call.headers["client-id"]).toBe("CLIENT123");
    expect(call.headers.Signature).toMatch(/^algorithm=RSA256,keyVersion=1,signature=/);

    const body = call.body as Record<string, any>;
    expect(body.paymentRequestId).toBe("SB-7001");
    expect(body.paymentAmount).toEqual({ currency: "THB", value: "50000" });
    expect(body.paymentMethod.paymentMethodType).toBe("ALIPAY_CN");

    // The signature must verify against the exact bytes that were sent.
    const sentSignature = decodeURIComponent(
      call.headers.Signature.split("signature=")[1],
    );
    const content = antomSignatureContent(
      "POST",
      "/ams/api/v1/payments/pay",
      "CLIENT123",
      call.headers["request-time"],
      JSON.stringify(call.body),
    );
    expect(
      createVerify("RSA-SHA256")
        .update(content, "utf8")
        .verify({ key: publicKey, padding: constants.RSA_PKCS1_PADDING }, sentSignature, "base64"),
    ).toBe(true);
  });

  it("maps channels and honours ANTOM_PAYMENT_METHOD for ANY", async () => {
    let calls = stubFetch({ result: { resultStatus: "S" }, normalUrl: "https://x.test/1" });
    await antom.createPayment({
      orderNumber: "SB-7002",
      amountSatang: 100,
      channel: "WECHAT",
      returnUrl: "https://siambox.shop/x",
    });
    expect((calls[0].body as any).paymentMethod.paymentMethodType).toBe("WECHATPAY_CN");

    process.env.ANTOM_PAYMENT_METHOD = "TRUEMONEY";
    calls = stubFetch({ result: { resultStatus: "S" }, normalUrl: "https://x.test/2" });
    await antom.createPayment({
      orderNumber: "SB-7003",
      amountSatang: 100,
      channel: "ANY",
      returnUrl: "https://siambox.shop/x",
    });
    expect((calls[0].body as any).paymentMethod.paymentMethodType).toBe("TRUEMONEY");
  });

  it("throws when the response carries no redirect target", async () => {
    stubFetch({ result: { resultStatus: "S" }, paymentId: "P1" });
    await expect(
      antom.createPayment({
        orderNumber: "SB-7004",
        amountSatang: 100,
        channel: "ALIPAY",
        returnUrl: "https://siambox.shop/x",
      }),
    ).rejects.toThrow(/AntomNoRedirectUrl/);
  });

  it("surfaces a failed result rather than pretending it worked", async () => {
    stubFetch({ result: { resultStatus: "F", resultCode: "PARAM_ILLEGAL" } });
    await expect(
      antom.createPayment({
        orderNumber: "SB-7005",
        amountSatang: 100,
        channel: "ALIPAY",
        returnUrl: "https://siambox.shop/x",
      }),
    ).rejects.toThrow(/AntomRequestFailed/);
  });

  it("normalises payment status, keeping anything unknown at PENDING", async () => {
    const ref = { gatewayRef: "P1", orderNumber: "SB-7001" };

    stubFetch({ result: { resultStatus: "S" }, paymentStatus: "SUCCESS" });
    expect((await antom.getStatus(ref)).status).toBe("PAID");

    stubFetch({ result: { resultStatus: "S" }, paymentStatus: "FAIL" });
    expect((await antom.getStatus(ref)).status).toBe("FAILED");

    stubFetch({ result: { resultStatus: "S" }, paymentStatus: "PROCESSING" });
    expect((await antom.getStatus(ref)).status).toBe("PENDING");

    stubFetch({ result: { resultStatus: "S" }, paymentStatus: "SOMETHING_NEW" });
    expect((await antom.getStatus(ref)).status).toBe("PENDING");
  });

  it("inquires by our order number, not Antom's payment id", async () => {
    const calls = stubFetch({ result: { resultStatus: "S" }, paymentStatus: "SUCCESS" });
    await antom.getStatus({ gatewayRef: "20260807ABC", orderNumber: "SB-7001" });
    expect(calls[0].url).toBe("https://antom.test/ams/api/v1/payments/inquiryPayment");
    expect((calls[0].body as any).paymentRequestId).toBe("SB-7001");
  });

  it("verifies a notification against Antom's public key", () => {
    process.env.ANTOM_PUBLIC_KEY = publicKey;
    const raw = JSON.stringify({
      notifyType: "PAYMENT_RESULT",
      paymentRequestId: "SB-7001",
      paymentId: "20260807ABC",
    });
    const time = antomRequestTime();
    const url = "https://api.siambox.shop/api/webhooks/antom";
    const content = antomSignatureContent(
      "POST",
      "/api/webhooks/antom",
      "CLIENT123",
      time,
      raw,
    );
    const signature = antomSign(content, privateKey);

    const good = webhook({
      url,
      rawBody: Buffer.from(raw),
      headers: {
        signature: `algorithm=RSA256,keyVersion=1,signature=${encodeURIComponent(signature)}`,
        "request-time": time,
      },
    });
    expect(antom.verifyWebhook(good)).toBe(true);

    // Body altered after signing.
    expect(
      antom.verifyWebhook(
        webhook({
          url,
          rawBody: Buffer.from(raw.replace("SB-7001", "SB-9999")),
          headers: good.headers,
        }),
      ),
    ).toBe(false);

    // Signature valid, but bound to a different timestamp.
    expect(
      antom.verifyWebhook(
        webhook({
          url,
          rawBody: Buffer.from(raw),
          headers: { ...good.headers, "request-time": antomRequestTime(new Date(0)) },
        }),
      ),
    ).toBe(false);

    expect(antom.verifyWebhook(webhook({ url, rawBody: Buffer.from(raw) }))).toBe(false);
  });

  it("skips verification only when no public key is configured", () => {
    delete process.env.ANTOM_PUBLIC_KEY;
    expect(antom.verifyWebhook(webhook({ body: {} }))).toBe(true);
  });

  it("reads both ids out of the notification", () => {
    expect(
      antom.parseWebhook(
        webhook({ body: { paymentRequestId: "SB-7001", paymentId: "20260807ABC" } }),
      ),
    ).toEqual({ gatewayRef: "20260807ABC", orderNumber: "SB-7001" });
    expect(antom.parseWebhook(webhook({ body: { notifyType: "PAYMENT_RESULT" } }))).toBeNull();
  });

  it("refunds against the payment id with a unique refund request id", async () => {
    const calls = stubFetch({ result: { resultStatus: "S" }, refundId: "RF-1" });
    const result = await antom.refund({
      gatewayRef: "20260807ABC",
      orderNumber: "SB-7001",
      amountSatang: 25_000,
      reason: "damaged",
    });
    expect(result).toEqual({ refundRef: "RF-1" });

    const body = calls[0].body as Record<string, any>;
    expect(calls[0].url).toBe("https://antom.test/ams/api/v1/payments/refund");
    expect(body.paymentId).toBe("20260807ABC");
    expect(body.refundAmount).toEqual({ currency: "THB", value: "25000" });
    expect(body.refundRequestId).toMatch(/^SB-7001-R-/);
  });

  it("refuses a refund with no amount instead of guessing one", async () => {
    // Antom has no refund-everything flag, so a missing amount must not silently
    // become a zero or full refund.
    await expect(
      antom.refund({ gatewayRef: "20260807ABC", orderNumber: "SB-7001" }),
    ).rejects.toThrow(/AntomRefundNeedsAmount/);
  });
});

describe("siampay", () => {
  const SECRET = "hash-secret";

  beforeEach(() => {
    process.env.SIAMPAY_MERCHANT_ID = "88888888";
    process.env.SIAMPAY_SECURE_HASH_SECRET = SECRET;
    process.env.SIAMPAY_API_BASE = "https://siampay.test";
  });

  it("hashes the ordered fields with the secret last", () => {
    const expected = createHash("sha1")
      .update("88888888|SB-8001|764|500.00|N|hash-secret")
      .digest("hex");
    expect(siamPaySecureHash(["88888888", "SB-8001", "764", "500.00", "N"], SECRET)).toBe(expected);
  });

  it("parses the flat key=value order-api response", () => {
    expect(parseOrderApiResponse("resultCode=0&orderStatus=Accepted&PayRef=12345")).toEqual({
      resultCode: "0",
      orderStatus: "Accepted",
      PayRef: "12345",
    });
  });

  it("builds a signed redirect URL without calling the network at all", async () => {
    const calls = stubFetch({});
    const created = await siampay.createPayment({
      orderNumber: "SB-8001",
      amountSatang: 50_000,
      channel: "ALIPAY",
      returnUrl: "https://siambox.shop/orders/SB-8001",
    });

    // The hosted form *is* the payment — there is no create call to make.
    expect(calls).toHaveLength(0);
    expect(created.gatewayRef).toBe("SB-8001");

    const url = new URL(created.redirectUrl);
    expect(url.origin + url.pathname).toBe("https://siampay.test/b2c2/eng/payment/payForm.jsp");
    expect(url.searchParams.get("merchantId")).toBe("88888888");
    expect(url.searchParams.get("orderRef")).toBe("SB-8001");
    // THB as the ISO numeric code, and a decimal amount — not satang.
    expect(url.searchParams.get("currCode")).toBe("764");
    expect(url.searchParams.get("amount")).toBe("500.00");
    expect(url.searchParams.get("payType")).toBe("N");
    expect(url.searchParams.get("payMethod")).toBe("ALIPAYHKONL");
    expect(url.searchParams.get("secureHash")).toBe(
      siamPaySecureHash(["88888888", "SB-8001", "764", "500.00", "N"], SECRET),
    );
  });

  it("omits payMethod for ANY so their cashier offers everything", async () => {
    const created = await siampay.createPayment({
      orderNumber: "SB-8002",
      amountSatang: 100,
      channel: "ANY",
      returnUrl: "https://siambox.shop/x",
    });
    expect(new URL(created.redirectUrl).searchParams.has("payMethod")).toBe(false);
  });

  it("acknowledges the datafeed with a literal OK so AsiaPay stops retrying", () => {
    expect(siampay.webhookAckBody).toBe("OK");
  });

  it("verifies the datafeed hash and rejects a tampered amount", () => {
    const fields = {
      src: "",
      prc: "0",
      successcode: "0",
      Ref: "SB-8001",
      PayRef: "9900001",
      Cur: "764",
      Amt: "500.00",
      payerAuth: "",
    };
    const secureHash = siamPaySecureHash(Object.values(fields), SECRET);

    const good = webhook({ body: { ...fields, secureHash } });
    expect(siampay.verifyWebhook(good)).toBe(true);
    expect(siampay.parseWebhook(good)).toEqual({
      orderNumber: "SB-8001",
      gatewayRef: "SB-8001",
    });

    // Same hash, amount swapped underneath it.
    expect(
      siampay.verifyWebhook(webhook({ body: { ...fields, Amt: "1.00", secureHash } })),
    ).toBe(false);
    expect(siampay.verifyWebhook(webhook({ body: fields }))).toBe(false); // no hash at all
  });

  it("skips verification only when no hash secret is configured", () => {
    delete process.env.SIAMPAY_SECURE_HASH_SECRET;
    expect(siampay.verifyWebhook(webhook({ body: {} }))).toBe(true);
  });

  it("ignores a datafeed with no order reference", () => {
    expect(siampay.parseWebhook(webhook({ body: { PayRef: "9900001" } }))).toBeNull();
  });

  it("queries order status through the portal login", async () => {
    process.env.SIAMPAY_LOGIN_ID = "api-user";
    process.env.SIAMPAY_PASSWORD = "api-pass";

    const calls = stubFetch("resultCode=0&orderStatus=Accepted&PayRef=9900001");
    const status = await siampay.getStatus({ gatewayRef: "SB-8001", orderNumber: "SB-8001" });
    expect(status.status).toBe("PAID");
    expect(calls[0].url).toBe("https://siampay.test/b2c2/eng/merchant/api/orderApi.jsp");

    const sent = new URLSearchParams(String(calls[0].body));
    expect(sent.get("actionType")).toBe("Query");
    expect(sent.get("orderRef")).toBe("SB-8001");
    expect(sent.get("loginId")).toBe("api-user");

    stubFetch("resultCode=0&orderStatus=Rejected");
    expect(
      (await siampay.getStatus({ gatewayRef: "SB-8001", orderNumber: "SB-8001" })).status,
    ).toBe("FAILED");

    // Anything we cannot read stays PENDING — never mark an order paid on a guess.
    stubFetch("resultCode=0&orderStatus=Pending");
    expect(
      (await siampay.getStatus({ gatewayRef: "SB-8001", orderNumber: "SB-8001" })).status,
    ).toBe("PENDING");
  });

  it("reports the order-api error instead of reading a failure as pending", async () => {
    process.env.SIAMPAY_LOGIN_ID = "api-user";
    process.env.SIAMPAY_PASSWORD = "api-pass";
    stubFetch("resultCode=-1&errMsg=Invalid+login");
    await expect(
      siampay.getStatus({ gatewayRef: "SB-8001", orderNumber: "SB-8001" }),
    ).rejects.toThrow(/SiamPayOrderApiError/);
  });

  it("refuses status and refund calls until the portal login is configured", async () => {
    // Redirect checkout needs only the merchant id + hash secret, so isEnabled() is
    // true — but Query/Refund go through a separate portal account.
    expect(siampay.isEnabled()).toBe(true);
    await expect(
      siampay.getStatus({ gatewayRef: "SB-8001", orderNumber: "SB-8001" }),
    ).rejects.toThrow(/SiamPayPortalLoginNotConfigured/);
    await expect(
      siampay.refund({ gatewayRef: "SB-8001", orderNumber: "SB-8001", amountSatang: 100 }),
    ).rejects.toThrow(/SiamPayPortalLoginNotConfigured/);
  });

  it("resolves the PayRef before refunding against it", async () => {
    process.env.SIAMPAY_LOGIN_ID = "api-user";
    process.env.SIAMPAY_PASSWORD = "api-pass";

    const calls = stubFetch(
      "resultCode=0&orderStatus=Accepted&PayRef=9900001",
      "resultCode=0&PayRef=9900002",
    );
    const result = await siampay.refund({
      gatewayRef: "SB-8001",
      orderNumber: "SB-8001",
      amountSatang: 25_000,
      reason: "damaged",
    });
    expect(result).toEqual({ refundRef: "9900002" });

    const refundCall = new URLSearchParams(String(calls[1].body));
    expect(refundCall.get("actionType")).toBe("Refund");
    // Refunds address AsiaPay's PayRef, not our order number.
    expect(refundCall.get("payRef")).toBe("9900001");
    expect(refundCall.get("amount")).toBe("250.00");
  });

  it("refuses a refund with no amount", async () => {
    process.env.SIAMPAY_LOGIN_ID = "api-user";
    process.env.SIAMPAY_PASSWORD = "api-pass";
    stubFetch("resultCode=0&PayRef=9900001");
    await expect(
      siampay.refund({ gatewayRef: "SB-8001", orderNumber: "SB-8001" }),
    ).rejects.toThrow(/SiamPayRefundNeedsAmount/);
  });
});
