#!/usr/bin/env bash
#
# SiamBox — local dev stack launcher.
#
#   ./dev.sh              start everything (frees the ports first)
#   ./dev.sh stop         stop + free every port (alias: down). Database survives.
#   ./dev.sh ports        free the ports only, leave containers alone
#   ./dev.sh reset        stop and wipe the database + node_modules, then start fresh
#   ./dev.sh rebuild      rebuild images (after a package.json / lockfile change)
#   ./dev.sh logs [svc]   follow logs — all services, or just one
#   ./dev.sh restart svc  restart one service
#   ./dev.sh studio       Prisma Studio on http://localhost:5555
#   ./dev.sh ps           what is running
#   ./dev.sh psql         open a psql shell on the dev database
#
set -euo pipefail
cd "$(dirname "$0")"

WEB_PORT=3000
ADMIN_PORT=3001
API_PORT=4000
DB_PORT="${DB_PORT:-5434}"

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; }
die()  { printf '\033[31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

require_docker() {
  command -v docker >/dev/null 2>&1 || die "ไม่พบ docker — ติดตั้ง Docker Desktop ก่อน"
  docker info >/dev/null 2>&1 || die "Docker daemon ไม่ได้รัน — เปิด Docker Desktop ก่อน"
}

PORTS=("$WEB_PORT" "$ADMIN_PORT" "$API_PORT" "$DB_PORT")

# Kills host processes squatting on our ports (a stray `pnpm dev` is the usual
# culprit). Containers are left alone: our own are handled by `docker compose down`,
# and another project's container is not ours to stop.
kill_squatters() {
  local busy=0
  for port in "${PORTS[@]}"; do
    local pids
    pids="$(lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
    [ -z "$pids" ] && continue

    local owner
    owner="$(ps -o comm= -p "$(echo "$pids" | head -1)" 2>/dev/null || echo '?')"
    case "$owner" in
      *docker*|*Docker*|*com.docke*)
        warn "พอร์ต $port ถูกคอนเทนเนอร์จองอยู่ ($owner) — ไม่แตะ"
        busy=1
        ;;
      *)
        echo "$pids" | xargs kill 2>/dev/null || true
        sleep 1
        echo "$pids" | xargs kill -9 2>/dev/null || true
        ok "ปิด process บนพอร์ต $port แล้ว ($owner)"
        ;;
    esac
  done
  return "$busy"
}

# Reports what is still listening. Returns non-zero if anything is, so the caller
# can say "not clean" instead of claiming success it did not verify.
report_ports() {
  local still=""
  for port in "${PORTS[@]}"; do
    lsof -nP -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 && still="$still $port"
  done
  if [ -n "$still" ]; then
    warn "ยังมีอะไรจองพอร์ตอยู่:$still"
    lsof -nP -iTCP:"$(echo "${PORTS[*]}" | tr ' ' ',')" -sTCP:LISTEN 2>/dev/null | tail -n +1
    warn "ถ้าเป็นคอนเทนเนอร์โปรเจคอื่น ให้ตั้ง DB_PORT=<พอร์ตอื่น> ใน .env แล้วรันใหม่"
    return 1
  fi
  ok "พอร์ต $WEB_PORT / $ADMIN_PORT / $API_PORT / $DB_PORT ว่างแล้ว"
}

free_ports() {
  bold "เคลียร์พอร์ต"
  kill_squatters || true
  # Our own stack is stopped cleanly so `up` starts from a known state.
  docker compose down --remove-orphans >/dev/null 2>&1 || true
  report_ports || true
}

# Full stop: containers down AND any stray host process killed, then verified.
stop_all() {
  bold "หยุด stack"
  docker compose down --remove-orphans
  ok "คอนเทนเนอร์หยุดแล้ว (ข้อมูลใน database ยังอยู่)"
  bold "เคลียร์พอร์ต"
  kill_squatters || true
  report_ports
}

wait_for_api() {
  bold "รอ API พร้อม"
  # First boot runs migrations + seed, so allow generous time before giving up.
  for _ in $(seq 1 90); do
    if curl -fsS -m 3 "http://localhost:$API_PORT/health" >/dev/null 2>&1; then
      ok "API ตอบแล้ว"
      return 0
    fi
    sleep 2
  done
  warn "API ยังไม่ตอบใน 3 นาที — ดู log ด้วย: ./dev.sh logs api"
  return 1
}

print_urls() {
  echo
  bold "พร้อมใช้งาน"
  echo "  Web      http://localhost:$WEB_PORT"
  echo "  Admin    http://localhost:$ADMIN_PORT       (token: ${ADMIN_TOKEN:-dev-admin-token})"
  echo "  API      http://localhost:$API_PORT/health"
  echo "  Swagger  http://localhost:$API_PORT/swagger"
  echo "  Postgres localhost:$DB_PORT                 (siambox / siambox / siambox)"
  echo
  echo "  ดู log:  ./dev.sh logs        หยุด: ./dev.sh down"
  echo
}

up() {
  require_docker
  free_ports
  bold "เริ่ม stack"
  docker compose up -d "$@"
  wait_for_api || true
  # Next.js compiles on first request; a warm-up keeps the first click fast.
  curl -fsS -m 60 -o /dev/null "http://localhost:$WEB_PORT/" 2>/dev/null && ok "Web คอมไพล์แล้ว" || true
  print_urls
  docker compose ps --format "table {{.Service}}\t{{.Status}}"
}

case "${1:-up}" in
  up|"")     up ;;
  rebuild)   require_docker; free_ports; bold "build ใหม่"; docker compose build; up ;;
  reset)
    require_docker
    bold "ล้างข้อมูลทั้งหมด"
    # -v drops the postgres volume, so the next boot re-migrates and re-seeds.
    docker compose down -v --remove-orphans
    ok "ลบ database + node_modules volumes แล้ว"
    up
    ;;
  down|stop) require_docker; stop_all ;;
  ports)     require_docker; bold "เคลียร์พอร์ต"; kill_squatters || true; report_ports ;;
  logs)      require_docker; shift; docker compose logs -f --tail=100 "$@" ;;
  restart)   require_docker; shift; [ $# -gt 0 ] || die "ระบุ service: api | web | admin | db"; docker compose restart "$@" ;;
  ps)        require_docker; docker compose ps ;;
  studio)    require_docker; bold "Prisma Studio → http://localhost:5555"; docker compose --profile tools up studio ;;
  psql)      require_docker; docker compose exec db psql -U siambox -d siambox ;;
  -h|--help|help)
    sed -n '3,14p' "$0" | sed 's/^# \{0,1\}//'
    ;;
  *)         die "ไม่รู้จักคำสั่ง '$1' — ดู ./dev.sh help" ;;
esac
