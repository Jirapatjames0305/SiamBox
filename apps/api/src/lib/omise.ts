import Omise from "omise";

// Lazy singleton — env vars are loaded by index.ts AFTER ESM module hoisting,
// so we can't read process.env at module top level.
let _client: ReturnType<typeof Omise> | null = null;

export function isOmiseEnabled(): boolean {
  return Boolean(process.env.OMISE_SECRET_KEY && process.env.OMISE_PUBLIC_KEY);
}

export function getOmise(): ReturnType<typeof Omise> {
  if (_client) return _client;
  const secretKey = process.env.OMISE_SECRET_KEY;
  const publicKey = process.env.OMISE_PUBLIC_KEY;
  if (!secretKey || !publicKey) {
    throw Object.assign(new Error("PaymentGatewayDisabled"), { status: 503 });
  }
  _client = Omise({ secretKey, publicKey });
  return _client;
}

export function cnyCentsToSatang(cnyCents: number): number {
  const rate = Number(process.env.CNY_TO_THB_RATE ?? "4.9");
  return Math.round(cnyCents * rate);
}
