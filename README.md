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

## Run with Docker (recommended — nothing to configure)

Postgres, api, web and admin all come up together. No `.env` to create, no local
Postgres to install: migrations and the seed run automatically on first boot.

```bash
./dev.sh                   # frees the ports, starts everything, waits until it answers
```

`docker compose up` works too — `dev.sh` just adds the port cleanup and a readiness
check, which is what stray `pnpm dev` processes otherwise break.

| | URL |
|---|---|
| Web (customer site) | http://localhost:3000 |
| Admin (backoffice) | http://localhost:3001 |
| API | http://localhost:4000 · [swagger](http://localhost:4000/swagger) |
| Postgres | `localhost:5434` — user/pass/db all `siambox` |

Admin bearer token defaults to `dev-admin-token`.

```bash
./dev.sh stop          # stop + free every port (data survives). `down` is an alias
./dev.sh ports         # free the ports only, leave containers running
./dev.sh logs api      # follow logs (omit the service for all of them)
./dev.sh restart api   # restart one service
./dev.sh studio        # Prisma Studio → localhost:5555
./dev.sh psql          # psql shell on the dev database
./dev.sh reset         # wipe the database + node_modules, then start fresh
./dev.sh rebuild       # rebuild images after a package.json / lockfile change
```

Source is bind-mounted, so edits hot-reload — both the API (`tsx watch`) and the
Next.js apps.

### Clone production data into the dev database

```bash
PROD_DATABASE_URL='postgresql://user:pass@host:5432/db?sslmode=require' \
  ./scripts/clone-prod-db.sh
```

Or put `PROD_DATABASE_URL` in `.env.production` (gitignored) and run it with no arguments.
If production Postgres is firewalled, tunnel first and point at the tunnel:

```bash
ssh -N -L 5433:localhost:5432 root@<server>          # separate terminal
PROD_DATABASE_URL='postgresql://user:pass@localhost:5433/db' ./scripts/clone-prod-db.sh
```

It reads production with `pg_dump` and never writes to it; the only database it drops
is the local dev one. After restoring, it runs `prisma migrate deploy`, so a production
schema that is behind the repo is brought up to date automatically.

Dumps land in `.tmp/` — real customer data, gitignored, delete when done.

**Overrides.** Every value has a local default; drop a `.env` next to
`docker-compose.yml` to override any of them — real Supabase keys, payment sandbox
credentials, or `DB_PORT` if 5434 is taken. It is gitignored.

Two things are off by default and both fail gracefully:

- **Payment gateway** — `PAYMENT_PROVIDER` is empty, so checkout runs the manual
  bank-transfer / QR + slip flow. Set it to `ksher`, `opn` or `2c2p` plus that
  provider's keys to enable online payment (see [docs/payment-gateway-china.md](docs/payment-gateway-china.md)).
- **Image uploads** — need `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`; without
  them uploads error out and the rest of the app is unaffected.

Production deployment is a separate stack: [deploy/](deploy/).

## Run without Docker

- Node.js >= 20
- pnpm >= 9 (`corepack enable` or `npm i -g pnpm`)
- PostgreSQL 15+ (local Docker or Supabase)

```bash
pnpm install
cp apps/api/.env.example .env   # fill in DATABASE_URL
pnpm db:generate
pnpm db:migrate                 # creates the schema in your DB
pnpm dev                        # all apps in parallel via Turborepo
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
