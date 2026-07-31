// Minimal HS256 JWT sign/verify — 2C2P wraps every request and response in one.
// Implemented here rather than pulled in as a dependency: we only need one algorithm,
// and payment code is easier to audit when the signing is in front of you.

import { createHmac, timingSafeEqual } from "node:crypto";

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(str: string): Buffer {
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export function signJwtHS256(payload: Record<string, unknown>, secret: string): string {
  const header = b64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const signingInput = `${header}.${body}`;
  const signature = b64url(createHmac("sha256", secret).update(signingInput).digest());
  return `${signingInput}.${signature}`;
}

/** Returns the decoded payload, or null when the token is malformed or mis-signed. */
export function verifyJwtHS256(token: string, secret: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header = "", body = "", signature = ""] = parts;
  const expected = createHmac("sha256", secret).update(`${header}.${body}`).digest();
  const received = fromB64url(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    return JSON.parse(fromB64url(body).toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Reads the payload without checking the signature — never use on untrusted input. */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(fromB64url(parts[1] ?? "").toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}
