# Deploy — SiamBox (web + api)

Server: Alibaba ECS HK `47.76.219.75` — domains `siambox.shop`, `api.siambox.shop`.
Server **ไม่ใช่ git repo** → โค้ดขึ้นได้ทางเดียวคือ rsync จาก Mac. **ต้องทำขั้น 1 ก่อนขั้น 2 เสมอ.**

> รันทุกคำสั่งจากโฟลเดอร์ repo: `cd ~/Documents/GitHub/SiamBox`

## ขั้น 1 — ส่งโค้ดขึ้น server (rsync)

```bash
cd ~/Documents/GitHub/SiamBox
rsync -az --delete \
  --exclude '.git' --exclude 'node_modules' --exclude '.next' --exclude '.turbo' \
  --exclude 'dist' --exclude '*.pem' --exclude '.env' --exclude '*.env' \
  --exclude '._*' --exclude '.DS_Store' \
  -e "ssh -i KeySiamBox.pem" \
  ./ root@47.76.219.75:/root/SiamBox/
```

`.env` บน server ถูก exclude ไว้ → secrets ปลอดภัย ไม่ถูกทับ.

## ขั้น 2 — build + restart บน server

```bash
ssh -i KeySiamBox.pem root@47.76.219.75 \
  'cd /root/SiamBox/deploy && docker compose up -d --build web api caddy && docker compose ps'
```

แก้ UI/API ไม่ขึ้น ให้ตัด cache: เปลี่ยน `--build` เป็น `build --no-cache web api &&` ก่อน `up -d`.

## ขั้น 3 — ตรวจสอบ

```bash
curl -I https://siambox.shop            # คาดหวัง 200
curl https://api.siambox.shop/health    # คาดหวัง {"ok":true,...}
```

ถ้าผ่านทั้งคู่ = เสร็จ. ดู log: `ssh -i KeySiamBox.pem root@47.76.219.75 'cd /root/SiamBox/deploy && docker compose logs --tail=30 web api'`

---

## กับดักที่เจอบ่อย

- `Identity file ... No such file or directory` → ไม่ได้อยู่ในโฟลเดอร์ repo. `cd ~/Documents/GitHub/SiamBox` ก่อน.
- `no configuration file provided` → `docker compose` ต้องรันใน `/root/SiamBox/deploy` (มี `docker-compose.yml`).
- UI/API ไม่เปลี่ยนทั้งที่ container restart → **ลืมขั้น 1 (rsync)** build ไปบนโค้ดเก่า.
- `zsh: parse error` / `unknown file attribute` → อย่า copy บรรทัด comment `#`, อย่าวาง `<...>` placeholder.

## หมายเหตุ — admin

`apps/admin` **ไม่ deploy** (ไม่อยู่ใน `docker-compose.yml`). มีแค่ web + api.
