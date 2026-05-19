# SiamBox

Thailand → China cross-border ecommerce. See [siambox.md](./siambox.md) for the full product spec.

## Workspace layout

```
apps/
  web/      Next.js 15 — customer-facing site (zh/th/en)
  admin/    Next.js 15 — backoffice (orders, products, shipping)
  api/      Express + Prisma — REST API
packages/
  database/ Prisma schema + client (@siambox/database)
  shared/   Zod schemas, enums, money helpers (@siambox/shared)
  ui/       Shared UI components placeholder (@siambox/ui)
```

Phase 1 ships: web + admin + api + database. CMS (Payload) and CRM features come later.

## Prerequisites

- Node.js >= 20
- pnpm >= 9 (`corepack enable` or `npm i -g pnpm`)
- PostgreSQL 15+ (local Docker or Supabase)

## Setup

```bash
pnpm install
cp .env.example .env        # fill in DATABASE_URL
pnpm db:generate
pnpm db:migrate             # creates the schema in your DB
```

## Run

```bash
pnpm dev                    # runs all apps in parallel via Turborepo
# or individually:
pnpm --filter @siambox/api dev      # http://localhost:4000
pnpm --filter @siambox/web dev      # http://localhost:3000
pnpm --filter @siambox/admin dev    # http://localhost:3001
```

## Useful commands

```bash
pnpm db:studio              # Prisma Studio
pnpm --filter @siambox/database seed
pnpm typecheck
pnpm build
```

## Order status flow

```
PENDING_PAYMENT → PAID → PACKING → SHIPPED → IN_CUSTOMS → OUT_FOR_DELIVERY → DELIVERED
```

Cancellation/refund branch off any pre-delivery state.
