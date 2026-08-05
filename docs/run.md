# คำสั่งที่ใช้บ่อย

```bash
./dev.sh              # เปิดทั้งระบบ (เคลียร์พอร์ตให้ก่อน)
./dev.sh stop         # ปิด + เคลียร์พอร์ต (ข้อมูลยังอยู่)
./dev.sh logs api     # ดู log — ใส่ชื่อ service หรือไม่ใส่ก็ได้
./dev.sh restart api  # restart ตัวเดียว
./dev.sh psql         # เข้า database
./dev.sh studio       # Prisma Studio → :5555
./dev.sh reset        # ล้าง DB ทิ้ง แล้วเริ่มใหม่
./dev.sh rebuild      # หลังแก้ package.json / lockfile
```

| | |
|---|---|
| หน้าร้าน | http://localhost:3000 |
| หลังบ้าน | http://localhost:3001 — token `1234` |
| API | http://localhost:4000/health · http://localhost:4000/swagger |
| Postgres | `localhost:5434` — siambox / siambox / siambox |

## ดึงข้อมูลจาก production

```bash
PROD_DATABASE_URL='postgresql://...' ./scripts/clone-prod-db.sh
```

## แก้ `.env` แล้วต้อง recreate ไม่ใช่แค่ restart

```bash
docker compose up -d --force-recreate api
```

## เช็คด่วน

```bash
curl localhost:4000/api/products | head -c 200                                   # สินค้าออกไหม
curl -H "Authorization: Bearer 1234" localhost:4000/api/admin/payment-providers  # gateway
```

---

## Production

Server `47.76.193.127` (Alibaba HK) — https://siambox.shop

```bash
# ส่งโค้ดขึ้น แล้ว build ใหม่ (ต้องทำ rsync ก่อนเสมอ)
rsync -az --delete --exclude '.git' --exclude 'node_modules' --exclude '.next' \
  --exclude '.turbo' --exclude 'dist' --exclude '*.pem' --exclude '.env' \
  --exclude '*.env' --exclude '.tmp' --exclude '._*' --exclude '.DS_Store' \
  -e "ssh -i ~/.ssh/siambox-alibaba" ./ root@47.76.193.127:/root/SiamBox/

ssh -i ~/.ssh/siambox-alibaba root@47.76.193.127 \
  'cd /root/SiamBox/deploy && docker compose up -d --build web api caddy'
```

```bash
# ดู log
ssh -i ~/.ssh/siambox-alibaba root@47.76.193.127 \
  'cd /root/SiamBox/deploy && docker compose logs --tail=40 web api'
```

เช็คว่ายังดีอยู่:
```bash
curl -I https://siambox.shop
curl https://api.siambox.shop/health
```

รายละเอียดครบ + กับดัก → [deploy/DEPLOY.md](../deploy/DEPLOY.md)
