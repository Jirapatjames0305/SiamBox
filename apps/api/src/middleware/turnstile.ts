import type { RequestHandler } from "express";

const SECRET = process.env.TURNSTILE_SECRET_KEY;
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Verifies a Cloudflare Turnstile token before letting a public form submission through.
// The frontend sends the widget token in the `cf-turnstile-token` header.
//
// If TURNSTILE_SECRET_KEY is unset (local dev), verification is skipped so the API still
// works without Cloudflare. Set the secret in production to enforce it.
export const verifyTurnstile: RequestHandler = async (req, res, next) => {
  if (!SECRET) {
    next();
    return;
  }

  const token = req.header("cf-turnstile-token");
  if (!token) {
    res.status(400).json({ error: "CaptchaRequired" });
    return;
  }

  try {
    const body = new URLSearchParams({ secret: SECRET, response: token });
    if (req.ip) body.append("remoteip", req.ip);

    const resp = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    const outcome = (await resp.json()) as { success: boolean };

    if (!outcome.success) {
      res.status(403).json({ error: "CaptchaFailed" });
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
};
