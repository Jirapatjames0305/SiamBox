#!/usr/bin/env bash
#
# Clone the production database into the local Docker dev database.
#
#   PROD_DATABASE_URL='postgresql://user:pass@host:5432/db?sslmode=require' \
#     ./scripts/clone-prod-db.sh
#
# or put PROD_DATABASE_URL in .env.production (gitignored) and just run it.
#
# What it does:
#   1. pg_dump production — read-only, nothing is written to prod
#   2. wipe and recreate the LOCAL dev database
#   3. restore the dump
#   4. run `prisma migrate deploy` so the restored (possibly older) schema is
#      brought up to the code's current migration state
#
# pg_dump/psql run inside a postgres client image, so no Postgres client
# is needed on the host and the client version always matches the local server.
#
set -euo pipefail
cd "$(dirname "$0")/.."

# Must be >= the production server's major version — pg_dump refuses to dump a
# newer server. Keep in step with the db image in docker-compose.yml.
PG_IMAGE=postgres:17-alpine
DUMP_DIR=".tmp"
DUMP_FILE="$DUMP_DIR/prod-$(date +%Y%m%d-%H%M%S).dump"

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; }
die()  { printf '\033[31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

# ---------- source (production) ----------
[ -f .env.production ] && . ./.env.production
: "${PROD_DATABASE_URL:?ต้องตั้ง PROD_DATABASE_URL (หรือใส่ใน .env.production)}"

# ---------- target (local docker) ----------
# Hard-coded on purpose: the only database this script can drop is the local dev
# one. The source is read with pg_dump and never written to, whatever it points at.
LOCAL_USER=siambox
LOCAL_DB=siambox
case "$PROD_DATABASE_URL" in
  *@db:5432/siambox*)
    die "PROD_DATABASE_URL ชี้มาที่ local dev database เอง — ไม่มีอะไรให้ clone" ;;
  *@localhost:*|*@127.0.0.1:*)
    # Legitimate when prod Postgres is firewalled and reached through
    #   ssh -N -L 5433:localhost:5432 user@server
    warn "source เป็น localhost — สมมติว่าเป็น SSH tunnel ไป production" ;;
esac

docker compose ps --status running --services 2>/dev/null | grep -qx db \
  || die "db container ไม่ได้รัน — สั่ง ./dev.sh ก่อน"

bold "1/4 ดึงข้อมูลจาก production (อ่านอย่างเดียว)"
mkdir -p "$DUMP_DIR"
# Only our own schema. A Supabase database also carries auth/storage/graphql/realtime
# schemas owned by roles that do not exist locally — dumping them just produces noise
# and restore errors. Override with PROD_DUMP_SCHEMA if the app ever uses more.
DUMP_SCHEMA="${PROD_DUMP_SCHEMA:-public}"
# --no-owner/--no-acl: prod roles do not exist locally.
# Custom format (-Fc) so pg_restore can skip individual objects cleanly on error.
# The URL travels as an env var, not an argv, so the password never shows up in
# `docker ps` / `ps aux`. Single-quoted body → expanded by the container's shell.
docker run --rm -i \
  -e PGURL="$PROD_DATABASE_URL" \
  -e SCHEMA="$DUMP_SCHEMA" \
  -e DUMPFILE="$(basename "$DUMP_FILE")" \
  -v "$PWD/$DUMP_DIR:/dump" "$PG_IMAGE" \
  sh -c 'pg_dump --no-owner --no-acl --schema="$SCHEMA" --format=custom --file="/dump/$DUMPFILE" "$PGURL"' \
  || die "pg_dump ล้มเหลว — เช็ค PROD_DATABASE_URL / firewall / sslmode"
ok "dump ไว้ที่ $DUMP_FILE ($(du -h "$DUMP_FILE" | cut -f1))"

bold "2/4 ล้าง database ของ local"
# Terminate stragglers first — the API holds a pool and DROP DATABASE would block.
docker compose stop api >/dev/null 2>&1 || true
docker compose exec -T db psql -U "$LOCAL_USER" -d postgres -v ON_ERROR_STOP=1 <<SQL >/dev/null
SELECT pg_terminate_backend(pid) FROM pg_stat_activity
 WHERE datname = '$LOCAL_DB' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS "$LOCAL_DB";
CREATE DATABASE "$LOCAL_DB" OWNER "$LOCAL_USER";
SQL
# The dump carries its own `CREATE SCHEMA public`, which collides with the one a new
# database is born with. Dropping it first keeps the restore output free of errors
# that would otherwise mask real ones.
docker compose exec -T db psql -U "$LOCAL_USER" -d "$LOCAL_DB" -v ON_ERROR_STOP=1 \
  -c 'DROP SCHEMA IF EXISTS public CASCADE;' >/dev/null
ok "สร้าง database ว่างใหม่แล้ว"

bold "3/4 คืนข้อมูลลง local"
# Prod may carry extensions/roles we cannot recreate; those errors are expected and
# not fatal, so pg_restore runs without --exit-on-error and we check the data after.
docker compose cp "$DUMP_FILE" db:/tmp/prod.dump >/dev/null
docker compose exec -T db pg_restore --no-owner --no-acl \
  -U "$LOCAL_USER" -d "$LOCAL_DB" /tmp/prod.dump 2>&1 | grep -vE "^$" | tail -5 || true
docker compose exec -T db rm -f /tmp/prod.dump >/dev/null 2>&1 || true
ok "restore เสร็จ"

bold "4/4 อัปเดต schema ให้ตรงกับโค้ดปัจจุบัน"
# Production is usually behind the repo — this applies whatever migrations it is
# missing (e.g. beam_payment_link_id → gateway_ref) to the restored data.
docker compose run --rm --no-deps api \
  pnpm --filter @siambox/database exec prisma migrate deploy
ok "migration ครบแล้ว"

docker compose start api >/dev/null 2>&1 || true

bold "สรุป"
docker compose exec -T db psql -U "$LOCAL_USER" -d "$LOCAL_DB" -c "
  SELECT 'products' AS ตาราง, count(*) FROM products
  UNION ALL SELECT 'orders',    count(*) FROM orders
  UNION ALL SELECT 'payments',  count(*) FROM payments
  UNION ALL SELECT 'users',     count(*) FROM users;"
echo
warn "$DUMP_FILE มีข้อมูลลูกค้าจริง — .tmp/ ถูก gitignore ไว้ ลบทิ้งเมื่อไม่ใช้แล้ว"
