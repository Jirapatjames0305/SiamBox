# ------------------------------------------------------------
# SiamBox Web (Next.js 15) — production image
# Mirrors apps/api: install workspace deps → build → run `next start`.
# Copies the pnpm-built node_modules as-is (no standalone) for reliable
# workspace + transpilePackages resolution.
# ------------------------------------------------------------

# ---------- builder ----------
FROM node:20-slim AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Manifests first for layer caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
# Root tsconfig that apps/web + packages/shared extend (needed by `next build`'s type check)
COPY tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile \
  --filter @siambox/web... \
  --filter @siambox/shared

COPY packages/shared packages/shared
COPY apps/web apps/web

# NEXT_PUBLIC_* are inlined into the client bundle at build time.
# Point this at the LIVE API URL (Render now, or https://api.<domain> later).
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter @siambox/web build


# ---------- runner ----------
FROM node:20-slim AS runner

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/web ./apps/web

EXPOSE 3000
# `start` script = next start --port 3000. NEXT_PUBLIC_API_URL is also read
# server-side at runtime for SSR fetches, so pass it as an env var too.
CMD ["pnpm", "--filter", "@siambox/web", "start"]
