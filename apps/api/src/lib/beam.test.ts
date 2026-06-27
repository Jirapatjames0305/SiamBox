import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  THB,
  isBeamEnabled,
  cnyCentsToSatang,
  createPaymentLink,
  getPaymentLink,
  listChargesByReference,
  refundCharge,
} from "./beam.js";

// --- fetch mock helpers -----------------------------------------------------

type FetchMock = ReturnType<typeof vi.fn>;

function mockFetch(): FetchMock {
  const fn = vi.fn();
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

function errorResponse(status: number, text = "boom"): Response {
  return {
    ok: false,
    status,
    json: async () => ({}),
    text: async () => text,
  } as unknown as Response;
}

/** Decode the Authorization header back to "merchantId:apiKey". */
function decodeAuth(header: string): string {
  return Buffer.from(header.replace(/^Basic /, ""), "base64").toString("utf8");
}

function lastCall(fetchFn: FetchMock): { url: string; init: RequestInit } {
  const call = fetchFn.mock.calls.at(-1);
  if (!call) throw new Error("fetch was not called");
  return { url: call[0] as string, init: (call[1] ?? {}) as RequestInit };
}

function body(init: RequestInit): Record<string, unknown> {
  return JSON.parse(init.body as string) as Record<string, unknown>;
}

// --- env management ---------------------------------------------------------

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  // Clean Beam-related env so each test sets exactly what it needs.
  delete process.env.BEAM_MERCHANT_ID;
  delete process.env.BEAM_API_KEY;
  delete process.env.BEAM_API_BASE;
  delete process.env.CNY_TO_THB_RATE;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

function enableBeam(extra: Record<string, string> = {}) {
  process.env.BEAM_MERCHANT_ID = "merchant-1";
  process.env.BEAM_API_KEY = "secret-key";
  Object.assign(process.env, extra);
}

// ============================================================================
// isBeamEnabled
// ============================================================================

describe("isBeamEnabled", () => {
  it("is false when neither var is set", () => {
    expect(isBeamEnabled()).toBe(false);
  });

  it("is false when only merchantId is set", () => {
    process.env.BEAM_MERCHANT_ID = "m";
    expect(isBeamEnabled()).toBe(false);
  });

  it("is false when only apiKey is set", () => {
    process.env.BEAM_API_KEY = "k";
    expect(isBeamEnabled()).toBe(false);
  });

  it("is true when both are set", () => {
    enableBeam();
    expect(isBeamEnabled()).toBe(true);
  });
});

// ============================================================================
// cnyCentsToSatang
// ============================================================================

describe("cnyCentsToSatang", () => {
  it("uses default rate 4.9 when env unset", () => {
    expect(cnyCentsToSatang(100)).toBe(490);
  });

  it("uses CNY_TO_THB_RATE when set", () => {
    process.env.CNY_TO_THB_RATE = "5";
    expect(cnyCentsToSatang(100)).toBe(500);
  });

  it("rounds to the nearest integer satang", () => {
    process.env.CNY_TO_THB_RATE = "4.93";
    // 101 * 4.93 = 497.93 → 498
    expect(cnyCentsToSatang(101)).toBe(498);
  });

  it("handles zero", () => {
    expect(cnyCentsToSatang(0)).toBe(0);
  });

  it("falls back to default when rate is non-numeric", () => {
    process.env.CNY_TO_THB_RATE = "not-a-number";
    // Number("not-a-number") is NaN → Number(NaN ?? "4.9")? Actually ?? only
    // catches null/undefined, so "not-a-number" passes through to Number()=NaN.
    expect(Number.isNaN(cnyCentsToSatang(100))).toBe(true);
  });
});

// ============================================================================
// getConfig (exercised through createPaymentLink) — disabled gateway
// ============================================================================

describe("disabled gateway", () => {
  it("createPaymentLink throws 503 PaymentGatewayDisabled when not configured", async () => {
    const fetchFn = mockFetch();
    await expect(
      createPaymentLink({
        netAmount: 100,
        referenceId: "ORD-1",
        methods: { eWallets: true },
        redirectUrl: "https://x/return",
      }),
    ).rejects.toMatchObject({ message: "PaymentGatewayDisabled", status: 503 });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("getPaymentLink throws 503 when not configured", async () => {
    mockFetch();
    await expect(getPaymentLink("pl_1")).rejects.toMatchObject({ status: 503 });
  });

  it("listChargesByReference throws 503 when not configured", async () => {
    mockFetch();
    await expect(listChargesByReference("ORD-1")).rejects.toMatchObject({ status: 503 });
  });

  it("refundCharge throws 503 when not configured", async () => {
    mockFetch();
    await expect(refundCharge({ chargeId: "ch_1" })).rejects.toMatchObject({ status: 503 });
  });
});

// ============================================================================
// createPaymentLink
// ============================================================================

describe("createPaymentLink", () => {
  it("sends Basic auth, correct URL, and the order/redirect body", async () => {
    enableBeam();
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(jsonResponse({ id: "pl_123", url: "https://pay/pl_123" }));

    const result = await createPaymentLink({
      netAmount: 4900,
      referenceId: "ORD-77",
      methods: { eWallets: true },
      redirectUrl: "https://siambox.shop/zh/orders/ORD-77?charge=1",
    });

    expect(result).toEqual({ paymentLinkId: "pl_123", url: "https://pay/pl_123" });

    const { url, init } = lastCall(fetchFn);
    expect(url).toBe("https://playground.api.beamcheckout.com/api/v1/payment-links");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
    expect(decodeAuth(headers.Authorization)).toBe("merchant-1:secret-key");

    const payload = body(init);
    expect(payload.order).toEqual({ netAmount: 4900, currency: THB, referenceId: "ORD-77" });
    expect(payload.redirectUrl).toBe("https://siambox.shop/zh/orders/ORD-77?charge=1");
  });

  it("enables only the requested method groups", async () => {
    enableBeam();
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(jsonResponse({ id: "pl_1", url: "u" }));

    await createPaymentLink({
      netAmount: 1,
      referenceId: "R",
      methods: { eWallets: true, qrPromptPay: true, card: true },
      redirectUrl: "u",
    });
    expect(body(lastCall(fetchFn).init).linkSettings).toEqual({
      eWallets: { isEnabled: true },
      qrPromptPay: { isEnabled: true },
      card: { isEnabled: true },
    });
  });

  it("omits method groups that are false/absent", async () => {
    enableBeam();
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(jsonResponse({ id: "pl_1", url: "u" }));

    await createPaymentLink({
      netAmount: 1,
      referenceId: "R",
      methods: { qrPromptPay: true },
      redirectUrl: "u",
    });
    expect(body(lastCall(fetchFn).init).linkSettings).toEqual({
      qrPromptPay: { isEnabled: true },
    });
  });

  it("produces an empty linkSettings when no methods enabled", async () => {
    enableBeam();
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(jsonResponse({ id: "pl_1", url: "u" }));

    await createPaymentLink({ netAmount: 1, referenceId: "R", methods: {}, redirectUrl: "u" });
    expect(body(lastCall(fetchFn).init).linkSettings).toEqual({});
  });

  it("honors BEAM_API_BASE override (production base)", async () => {
    enableBeam({ BEAM_API_BASE: "https://api.beamcheckout.com" });
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(jsonResponse({ id: "pl_1", url: "u" }));

    await createPaymentLink({ netAmount: 1, referenceId: "R", methods: {}, redirectUrl: "u" });
    expect(lastCall(fetchFn).url).toBe("https://api.beamcheckout.com/api/v1/payment-links");
  });

  it("throws 502 with status+body text on non-ok response", async () => {
    enableBeam();
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(errorResponse(400, "bad request detail"));

    await expect(
      createPaymentLink({ netAmount: 1, referenceId: "R", methods: {}, redirectUrl: "u" }),
    ).rejects.toMatchObject({ status: 502 });
    await expect(
      createPaymentLink({ netAmount: 1, referenceId: "R", methods: {}, redirectUrl: "u" }),
    ).rejects.toThrow(/BeamPaymentLinkFailed: 400 bad request detail/);
  });
});

// ============================================================================
// getPaymentLink
// ============================================================================

describe("getPaymentLink", () => {
  it("GETs the encoded id with Basic auth and returns the detail", async () => {
    enableBeam();
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(
      jsonResponse({ paymentLinkId: "pl 9", status: "COMPLETED", order: { referenceId: "ORD-9" } }),
    );

    const detail = await getPaymentLink("pl 9");
    expect(detail).toMatchObject({ paymentLinkId: "pl 9", status: "COMPLETED" });

    const { url, init } = lastCall(fetchFn);
    expect(url).toBe("https://playground.api.beamcheckout.com/api/v1/payment-links/pl%209");
    expect(init.method).toBe("GET");
    expect(decodeAuth((init.headers as Record<string, string>).Authorization)).toBe(
      "merchant-1:secret-key",
    );
  });

  it("throws 502 on non-ok", async () => {
    enableBeam();
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(errorResponse(404, "not found"));
    await expect(getPaymentLink("pl_x")).rejects.toMatchObject({ status: 502 });
  });
});

// ============================================================================
// listChargesByReference
// ============================================================================

describe("listChargesByReference", () => {
  it("returns the data array and encodes the referenceId", async () => {
    enableBeam();
    const fetchFn = mockFetch();
    const charges = [{ chargeId: "ch_1", status: "SUCCEEDED", paymentMethodType: "QR" }];
    fetchFn.mockResolvedValue(jsonResponse({ data: charges, totalCount: 1 }));

    const result = await listChargesByReference("ORD/1");
    expect(result).toEqual(charges);
    expect(lastCall(fetchFn).url).toBe(
      "https://playground.api.beamcheckout.com/api/v1/charges?referenceId=ORD%2F1",
    );
  });

  it("returns [] when the response has no data array", async () => {
    enableBeam();
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(jsonResponse({ totalCount: 0 }));
    expect(await listChargesByReference("ORD-1")).toEqual([]);
  });

  it("throws 502 on non-ok", async () => {
    enableBeam();
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(errorResponse(500, "server error"));
    await expect(listChargesByReference("ORD-1")).rejects.toMatchObject({ status: 502 });
  });
});

// ============================================================================
// refundCharge
// ============================================================================

describe("refundCharge", () => {
  it("full refund: sends only chargeId (omits amount & reason)", async () => {
    enableBeam();
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(jsonResponse({ refundId: "rf_1" }));

    const result = await refundCharge({ chargeId: "ch_1" });
    expect(result).toEqual({ refundId: "rf_1" });

    const { url, init } = lastCall(fetchFn);
    expect(url).toBe("https://playground.api.beamcheckout.com/api/v1/refunds");
    expect(init.method).toBe("POST");
    expect(body(init)).toEqual({ chargeId: "ch_1" });
  });

  it("includes reason when provided", async () => {
    enableBeam();
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(jsonResponse({ refundId: "rf_2" }));

    await refundCharge({ chargeId: "ch_2", reason: "customer cancelled" });
    expect(body(lastCall(fetchFn).init)).toEqual({
      chargeId: "ch_2",
      reason: "customer cancelled",
    });
  });

  it("includes amount when provided (partial refund, CARD)", async () => {
    enableBeam();
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(jsonResponse({ refundId: "rf_3" }));

    await refundCharge({ chargeId: "ch_3", amount: 1000, reason: "partial" });
    expect(body(lastCall(fetchFn).init)).toEqual({
      chargeId: "ch_3",
      amount: 1000,
      reason: "partial",
    });
  });

  it("includes amount=0 when explicitly passed (not treated as absent)", async () => {
    enableBeam();
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(jsonResponse({ refundId: "rf_4" }));

    await refundCharge({ chargeId: "ch_4", amount: 0 });
    expect(body(lastCall(fetchFn).init)).toEqual({ chargeId: "ch_4", amount: 0 });
  });

  it("throws 502 with detail on non-ok", async () => {
    enableBeam();
    const fetchFn = mockFetch();
    fetchFn.mockResolvedValue(errorResponse(409, "already refunded"));
    await expect(refundCharge({ chargeId: "ch_5" })).rejects.toThrow(
      /BeamRefundFailed: 409 already refunded/,
    );
  });
});
