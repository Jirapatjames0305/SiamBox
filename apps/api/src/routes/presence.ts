import { Router } from "express";
import { z } from "zod";
import geoip from "geoip-lite";

export type OnlineSession = {
  sessionId: string;
  ip: string;
  country: string | null;
  path: string;
  locale: string | null;
  userAgent: string | null;
  firstSeenAt: number;
  lastSeenAt: number;
};

// A session counts as online while it keeps pinging (web pings every 30s).
const ONLINE_WINDOW_MS = 90_000;
// Backstop against session-id flooding — presence is best-effort, dropping is fine.
const MAX_SESSIONS = 5000;

const sessions = new Map<string, OnlineSession>();

function prune() {
  const cutoff = Date.now() - ONLINE_WINDOW_MS;
  for (const [id, s] of sessions) {
    if (s.lastSeenAt < cutoff) sessions.delete(id);
  }
}

const pingSchema = z.object({
  sessionId: z.string().min(8).max(64),
  path: z.string().max(200),
  locale: z.string().max(10).optional(),
});

export const presenceRouter = Router();

// Country for an IP, used by the web middleware to pick which catalogue to show.
// `ip` may be passed explicitly because the caller is the web container relaying a
// visitor's address; without it we fall back to the caller's own address.
// Accuracy is country-level and a VPN defeats it — the storefront lets people switch.
presenceRouter.get("/geo", (req, res) => {
  const ip = typeof req.query.ip === "string" && req.query.ip ? req.query.ip : (req.ip ?? "");
  res.json({ data: { ip, country: geoip.lookup(ip)?.country ?? null } });
});

presenceRouter.post("/ping", (req, res) => {
  const body = pingSchema.parse(req.body);
  const now = Date.now();
  prune();

  const existing = sessions.get(body.sessionId);
  if (existing) {
    existing.path = body.path;
    if (body.locale) existing.locale = body.locale;
    existing.lastSeenAt = now;
  } else if (sessions.size < MAX_SESSIONS) {
    const ip = req.ip ?? "";
    sessions.set(body.sessionId, {
      sessionId: body.sessionId,
      ip,
      country: geoip.lookup(ip)?.country ?? null,
      path: body.path,
      locale: body.locale ?? null,
      userAgent: req.header("user-agent") ?? null,
      firstSeenAt: now,
      lastSeenAt: now,
    });
  }
  res.json({ ok: true });
});

export function listOnlineSessions(): OnlineSession[] {
  prune();
  return [...sessions.values()].sort((a, b) => b.lastSeenAt - a.lastSeenAt);
}
