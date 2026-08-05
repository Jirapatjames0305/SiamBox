#!/usr/bin/env bash
#
# ย้ายไปเครื่องใหม่ (บัญชี Alibaba ใหม่) — ทำขั้นที่ 3–5 ของ deploy/MIGRATE.md ให้อัตโนมัติ
#
#   ./deploy/migrate-to-new-host.sh <IP ใหม่> <ไฟล์ .pem ใหม่> [ไฟล์ env ที่คัดลอกมา]
#
# ตัวอย่าง:
#   ./deploy/migrate-to-new-host.sh 8.210.1.2 ~/.ssh/siambox-alibaba deploy-env-backup
#
# ทำอะไรบ้าง: rsync โค้ด → ติดตั้ง Docker (setup-ec2.sh) → วาง .env → build + start
# ไม่แตะ DNS และไม่แตะเครื่องเก่า — สองอย่างนั้นทำเองตาม MIGRATE.md
#
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="${1:-}"
KEY="${2:-}"
ENV_FILE="${3:-deploy-env-backup}"

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; }
die()  { printf '\033[31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

[ -n "$HOST" ] && [ -n "$KEY" ] || die "ใช้: $0 <IP ใหม่> <ไฟล์ .pem> [ไฟล์ env]"
[ -f "$KEY" ] || die "ไม่พบไฟล์ key: $KEY"
[ -f "$ENV_FILE" ] || die "ไม่พบไฟล์ env: $ENV_FILE
คัดลอกจากเครื่องที่รันอยู่ปัจจุบันก่อน:
  scp -i ~/.ssh/siambox-alibaba root@47.76.193.127:/root/SiamBox/deploy/.env ./$ENV_FILE"

# ssh ปฏิเสธ key ที่คนอื่นอ่านได้ — กันพลาดที่เจอบ่อยที่สุดตอนดาวน์โหลด .pem มาใหม่
chmod 600 "$KEY"
SSH=(ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "root@$HOST")

bold "0/4 เช็คว่า ssh เข้าได้"
"${SSH[@]}" 'echo ok' >/dev/null || die "ssh เข้าไม่ได้ — เช็ค IP, security group (22/tcp), และ key"
ok "เข้าเครื่อง $HOST ได้"

bold "1/4 ส่งโค้ดขึ้นเครื่องใหม่"
# ตรงกับรายการ exclude ใน DEPLOY.md — .env และ .pem ต้องไม่ถูกส่งไปโดยเด็ดขาด
rsync -az --delete \
  --exclude '.git' --exclude 'node_modules' --exclude '.next' --exclude '.turbo' \
  --exclude 'dist' --exclude '*.pem' --exclude '.env' --exclude '*.env' \
  --exclude '.tmp' --exclude '._*' --exclude '.DS_Store' \
  -e "ssh -i $KEY -o StrictHostKeyChecking=accept-new" \
  ./ "root@$HOST:/root/SiamBox/"
ok "rsync เสร็จ"

bold "2/4 ติดตั้ง Docker + swap"
"${SSH[@]}" 'cd /root/SiamBox/deploy && bash setup-ec2.sh'
ok "เครื่องพร้อม"

bold "3/4 วาง .env"
scp -i "$KEY" -o StrictHostKeyChecking=accept-new "$ENV_FILE" "root@$HOST:/root/SiamBox/deploy/.env"
"${SSH[@]}" 'chmod 600 /root/SiamBox/deploy/.env'
ok "วาง .env แล้ว (สิทธิ์ 600)"

bold "4/4 build + start"
"${SSH[@]}" 'cd /root/SiamBox/deploy && docker compose up -d --build && docker compose ps'

echo
bold "ตรวจสอบ"
# DNS ยังชี้เครื่องเก่าอยู่ ณ จุดนี้ — ยิงตรงเข้า IP ใหม่โดยระบุ Host header เอง
# (จะได้ผลก็ต่อเมื่อโดเมนใน .env ตรงกับที่ตั้ง ซึ่งเป็นเงื่อนไขของการย้ายแบบคงคอนฟิกเดิม)
WEB_DOMAIN="$(grep -E '^WEB_DOMAIN=' "$ENV_FILE" | cut -d= -f2- | tr -d '"'"'"' ')"
API_DOMAIN="$(grep -E '^API_DOMAIN=' "$ENV_FILE" | cut -d= -f2- | tr -d '"'"'"' ')"
if [ -n "$API_DOMAIN" ]; then
  code="$(curl -s -o /dev/null -m 10 -w '%{http_code}' --resolve "$API_DOMAIN:80:$HOST" \
          "http://$API_DOMAIN/health" || echo 000)"
  echo "  API (ผ่าน HTTP ตรงเข้า IP ใหม่): $code"
fi
echo "  Web domain: ${WEB_DOMAIN:-<ไม่พบใน env>}"
echo
warn "ยังไม่ได้สลับ DNS — ทำขั้นที่ 5-6 ใน deploy/MIGRATE.md ต่อ"
warn "อย่าเพิ่งปิดเครื่องเก่า รอ 3-7 วันหลังสลับ DNS สำเร็จ"
