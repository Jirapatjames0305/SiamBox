# Deploy — SiamBox (web + api)

Server: Alibaba ECS HK `47.76.193.127` — domains `siambox.shop`, `www.siambox.shop`, `api.siambox.shop`
บัญชี Alibaba: **siamboxsupport@gmail.com** · SSH key: `~/.ssh/siambox-alibaba`

Server **ไม่ใช่ git repo** → โค้ดขึ้นได้ทางเดียวคือ rsync จาก Mac. **ต้องทำขั้น 1 ก่อนขั้น 2 เสมอ.**

> รันทุกคำสั่งจากโฟลเดอร์ repo: `cd ~/Documents/GitHub/SiamBox`

## ขั้น 1 — ส่งโค้ดขึ้น server (rsync)

```bash
cd ~/Documents/GitHub/SiamBox
rsync -az --delete \
  --exclude '.git' --exclude 'node_modules' --exclude '.next' --exclude '.turbo' \
  --exclude 'dist' --exclude '*.pem' --exclude '.env' --exclude '*.env' \
  --exclude '.tmp' --exclude '._*' --exclude '.DS_Store' \
  -e "ssh -i ~/.ssh/siambox-alibaba" \
  ./ root@47.76.193.127:/root/SiamBox/
```

`.env` บน server ถูก exclude ไว้ → secrets ปลอดภัย ไม่ถูกทับ.

## ขั้น 2 — build + restart บน server

```bash
ssh -i ~/.ssh/siambox-alibaba root@47.76.193.127 \
  'cd /root/SiamBox/deploy && docker compose up -d --build web api caddy && docker compose ps'
```

แก้ UI/API ไม่ขึ้น ให้ตัด cache: เปลี่ยน `--build` เป็น `build --no-cache web api &&` ก่อน `up -d`.

## ขั้น 3 — ตรวจสอบ

```bash
curl -I https://siambox.shop            # คาดหวัง 200
curl https://api.siambox.shop/health    # คาดหวัง {"ok":true,...}
curl -s https://api.siambox.shop/api/products | head -c 200   # ต้องมีสินค้าออกมา
```

ถ้าผ่านทั้งหมด = เสร็จ. ดู log:

```bash
ssh -i ~/.ssh/siambox-alibaba root@47.76.193.127 \
  'cd /root/SiamBox/deploy && docker compose logs --tail=30 web api'
```

---

## กับดักที่เจอบ่อย

- `Identity file ... No such file or directory` → ไม่ได้อยู่ในโฟลเดอร์ repo. `cd ~/Documents/GitHub/SiamBox` ก่อน.
- `Permission denied (publickey)` → SSH ถูกจำกัดไว้เฉพาะ IP เดียว (ดูหัวข้อ Security Group ด้านล่าง) — ถ้า IP บ้านเปลี่ยน ต้องไปแก้ rule ก่อน
- `no configuration file provided` → `docker compose` ต้องรันใน `/root/SiamBox/deploy` (มี `docker-compose.yml`).
- UI/API ไม่เปลี่ยนทั้งที่ container restart → **ลืมขั้น 1 (rsync)** build ไปบนโค้ดเก่า.
- **หน้าเว็บขึ้นแต่ไม่มีสินค้า** → `API_INTERNAL_URL` หายไปจาก `.env` — SSR ในคอนเทนเนอร์ยิงโดเมนสาธารณะไม่ได้ (NAT hairpin) ต้องเป็น `http://api:4000`
- `zsh: parse error` / `unknown file attribute` → อย่า copy บรรทัด comment `#`, อย่าวาง `<...>` placeholder.

---

## ค่าคงที่ของเครื่อง (ตั้งไว้ 5 ส.ค. 2026)

| | |
|---|---|
| Instance | `ecs.e-c1m2.large` · 2 vCPU / 4 GB · Hong Kong Zone D |
| Disk | ESSD Entry 40 GB |
| Bandwidth | Pay-by-traffic · 5 Mbps |
| OS | Ubuntu 24.04 |
| Container | `web` (Next.js) · `api` (Express) · `caddy` (TLS + reverse proxy) |
| Database | Supabase (นอกเครื่อง) — เครื่องนี้ไม่เก็บข้อมูลอะไรเลย |
| Storage | Supabase Storage (นอกเครื่อง) |

**Security Group** — SSH เปิดเฉพาะ IP เครื่องคุณ (`171.103.220.162/32` ณ วันที่ตั้ง)
IP บ้านเป็น dynamic เปลี่ยนเมื่อไหร่ต้องเข้า console แก้ rule ก่อนถึงจะ ssh ได้
ถ้าล็อกตัวเองออก ยังเข้าได้ผ่าน **Cloud Assistant** หรือ **VNC/Connect** ในหน้า console เสมอ

**DNS** — ทั้ง 3 record ชี้ `47.76.193.127` · TTL 14400 วิ (4 ชม.)
แนะนำให้ลดเหลือ 300 วิ เพื่อให้สลับ IP ฉุกเฉินได้เร็ว

**TLS** — Caddy ขอ Let's Encrypt เองอัตโนมัติ ต่ออายุเอง ไม่ต้องทำอะไร
ต้องเปิดพอร์ต 80 ไว้เสมอ (ใช้ตอน verify) · `www` redirect ไป apex

---

## หมายเหตุ — admin

`apps/admin` **ไม่ deploy** (ไม่อยู่ใน `docker-compose.yml`). มีแค่ web + api.
