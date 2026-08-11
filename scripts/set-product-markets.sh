#!/usr/bin/env bash
#
# Assign each product to the markets it may be listed in.
#
#   PROD_DATABASE_URL='postgresql://...' ./scripts/set-product-markets.sh          # production
#   ./scripts/set-product-markets.sh --local                                       # docker dev db
#
# The split comes from docs/market-hongkong.md:
#   • Hong Kong is a free port — general food, cosmetics and household goods pass
#     without an import permit and without product registration.
#   • Herbal Products / Herbal Lozenges are likely proprietary Chinese medicines under
#     the Chinese Medicine Ordinance (Cap 549) and need registration with the Chinese
#     Medicines Board first, so they stay mainland-only.
#
# Idempotent — safe to re-run after adding products.
#
set -euo pipefail
cd "$(dirname "$0")/.."

PG_IMAGE=postgres:17-alpine
HERBAL="'Herbal Products','Herbal Lozenges'"

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
die()  { printf '\033[31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

SQL="
UPDATE products SET markets = ARRAY['CN','HK']::TEXT[]
 WHERE active AND (category IS NULL OR category NOT IN ($HERBAL));

UPDATE products SET markets = ARRAY['CN']::TEXT[]
 WHERE category IN ($HERBAL);

SELECT array_to_string(markets,'+') AS markets, count(*) AS products
  FROM products WHERE active GROUP BY 1 ORDER BY 2 DESC;
"

if [ "${1:-}" = "--local" ]; then
  bold "อัปเดต local (docker)"
  docker compose exec -T db psql -U siambox -d siambox -v ON_ERROR_STOP=1 -c "$SQL"
else
  [ -f .env.production ] && . ./.env.production
  : "${PROD_DATABASE_URL:?ต้องตั้ง PROD_DATABASE_URL (หรือใส่ใน .env.production) · หรือใช้ --local}"
  bold "อัปเดต production"
  # URL travels as an env var so the password never lands in `ps` output.
  docker run --rm -e PGURL="$PROD_DATABASE_URL" -e Q="$SQL" "$PG_IMAGE" \
    sh -c 'psql "$PGURL" -v ON_ERROR_STOP=1 -c "$Q"' || die "อัปเดตไม่สำเร็จ"
fi

ok "เสร็จ — สินค้าหมวดสมุนไพรถูกกันไว้เฉพาะจีนแผ่นดินใหญ่"
