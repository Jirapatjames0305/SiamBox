# ------------------------------------------------------------
# SiamBox API — production image
# Multi-stage: install + Prisma generate → slim runtime
# Runs with `tsx` so workspace .ts packages resolve without
# a separate build step.
# ------------------------------------------------------------

# ---------- builder ----------
FROM node:20-slim AS builder

# OpenSSL is needed by Prisma; libc6 by sharp's prebuilt binary
RUN apt-get update -y && apt-get install -y --no-install-recommends \
  openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy manifests first for better layer caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install only what the API needs (api + its workspace deps + their deps)
RUN pnpm install --frozen-lockfile \
  --filter @siambox/api... \
  --filter @siambox/database \
  --filter @siambox/shared

# Copy source
COPY packages/database packages/database
COPY packages/shared packages/shared
COPY apps/api apps/api

# Generate Prisma client into node_modules
RUN pnpm --filter @siambox/database exec prisma generate


# ---------- runner ----------
FROM node:20-slim AS runner

RUN apt-get update -y && apt-get install -y --no-install-recommends \
  openssl ca-certificates dumb-init \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app
ENV NODE_ENV=production

# Bring over installed deps + source (tsx runs .ts directly)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/shared ./packages/shared

# Render injects $PORT; the API reads API_PORT, set in render.yaml to match.
EXPOSE 4000

# Run migrations on every deploy, then start the API.
# tsx is installed as a devDep of @siambox/api and resolved via pnpm.
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "pnpm --filter @siambox/database exec prisma migrate deploy && pnpm --filter @siambox/api exec tsx src/index.ts"]
