# ย้าย server ไปบัญชี Alibaba Cloud ใหม่

> ## ✅ ย้ายเสร็จแล้ว — 5 ส.ค. 2026
>
> | | เก่า | ใหม่ |
> |---|---|---|
> | บัญชี | jongjongd…@gmail.com | **siamboxsupport@gmail.com** |
> | IP | `47.76.219.75` (Stopped) | **`47.76.193.127`** |
> | Instance | `i-j6c8dyjcl7nldeci3m63` | `i-j6c8kaxgsfx4upnkzrmb` |
> | SSH key | `KeySiamBox.pem` | `~/.ssh/siambox-alibaba` |
>
> สเปก · โดเมน · `.env` เหมือนเดิมทุกอย่าง ยืนยันแล้วว่า `siambox.shop`,
> `www.siambox.shop`, `api.siambox.shop` ใช้งานได้ครบ สินค้าขึ้น 152 รายการ
>
> **เครื่องเก่ายังไม่ปล่อย** — ปล่อยดับไว้จนราว 10 ส.ค. 2026 เผื่อต้องสลับกลับ
> (`deploy/.env` ตัวจริงยังอยู่ในนั้น — ถ้าจะดึงต้อง Start ก่อนปล่อย)
>
> คำสั่ง deploy ประจำวันอยู่ที่ [DEPLOY.md](DEPLOY.md) — ไฟล์นี้เก็บไว้เป็นบันทึก
> และเป็นคู่มือถ้าต้องย้ายอีกครั้ง

เป้าหมายเดิม: เปลี่ยนบัญชี Alibaba (อีเมลใหม่) แต่ **คอนฟิกทุกอย่างเหมือนเดิม** —
โดเมนเดิม, `.env` เดิม, region เดิม (HK)

---

## ⚠️ ก่อนอื่น — สิ่งเดียวที่หายแล้วกู้ไม่ได้

**`/root/SiamBox/deploy/.env` บนเครื่องเก่า**

ไฟล์นี้ **ไม่ได้อยู่ใน git** (ถูก exclude ทั้งใน `.gitignore` และในคำสั่ง rsync)
ข้างในมี `DATABASE_URL`, `ADMIN_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, keys ของ payment gateway
ถ้าปิดเครื่องเก่าไปก่อนคัดลอก จะต้องไล่ตั้งใหม่ทุกตัว

**คัดลอกออกมาเก็บไว้เป็นอย่างแรก:**

```bash
cd ~/Documents/GitHub/SiamBox
scp -i KeySiamBox.pem root@47.76.219.75:/root/SiamBox/deploy/.env ./deploy-env-backup
chmod 600 deploy-env-backup          # มี secrets — อย่า commit
```

> `deploy-env-backup` ถูก gitignore ไว้แล้ว แต่ยังเป็น secrets จริง — ลบทิ้งหลังย้ายเสร็จ

เก็บ log ของ Caddy ด้วยถ้าต้องใช้ทำสถิติย้อนหลัง (ไม่จำเป็นต่อการทำงาน):

```bash
scp -i KeySiamBox.pem -r root@47.76.219.75:/root/SiamBox/deploy/logs ./caddy-logs-backup
```

---

## สิ่งที่ **ไม่ต้อง** ย้าย

การย้ายครั้งนี้ง่ายกว่าที่คิด เพราะเครื่องเป็นแค่ตัวรันแอป ไม่ได้เก็บข้อมูลอะไร

| | อยู่ที่ไหน | ต้องทำอะไร |
|---|---|---|
| ฐานข้อมูล | Supabase (ap-southeast-1) | ไม่ต้องแตะ |
| รูปสินค้า / สลิป | Supabase Storage | ไม่ต้องแตะ |
| โค้ด | git + rsync จากเครื่อง Mac | rsync ขึ้นเครื่องใหม่ |
| โดเมน | ผู้ให้บริการ DNS (ไม่ใช่ Alibaba) | ชี้ A record ไป IP ใหม่ |
| TLS certificate | Caddy ออกให้เอง | ออกใหม่อัตโนมัติหลัง DNS ชี้มา |

**ไม่มี database หรือไฟล์อัปโหลดอยู่บนเครื่อง** → ไม่ต้อง dump/restore อะไรทั้งสิ้น

---

## ขั้นตอน

### 1. ลด DNS TTL ล่วงหน้า (ทำก่อน 1 วัน)

ไปที่ผู้ให้บริการ DNS ตั้ง TTL ของ `siambox.shop` และ `api.siambox.shop` เป็น **60 วินาที**
ถ้าไม่ทำ ตอนสลับ IP ลูกค้าบางส่วนจะยังวิ่งไปเครื่องเก่านานหลายชั่วโมง

### 2. สร้าง ECS บนบัญชีใหม่

- **Region: China (Hong Kong) / `cn-hongkong`** — ต้องเป็นที่เดิม
  เหตุผล: เน็ตเข้าจีนดีที่สุดโดย **ไม่ต้องมีใบ ICP** (region ในจีนแผ่นดินใหญ่บล็อกพอร์ต 80/443 จนกว่า ICP จะผ่าน)
- **สเปกจริงของเครื่องเก่า** (อ่านจากหน้า instance detail ของบัญชีเดิม 5 ส.ค. 2026)
  — ตั้งให้ตรงทุกช่องเพื่อให้ได้ราคาเท่าเดิม:

  | ช่อง | ค่า |
  |---|---|
  | Instance Type | **`ecs.e-c1m2.large`** (Economy Type e · 2 vCPU / 4 GiB) |
  | Zone | Hong Kong **Zone D** (`cn-hongkong-d`) |
  | Network Type | VPC |
  | Billing Method | Subscription |
  | System Disk | **ESSD Entry** 40 GiB |
  | Bandwidth Billing | **Pay-By-Traffic** |
  | Bandwidth | 5 Mbps |
  | Image | Ubuntu 24.04 64-bit (`ubuntu_24_04_x64_20G_alibase_20260522.vhd`) |
  | I/O Optimized | True |

  > เครื่องเก่า: instance `i-j6c8dyjcl7nldeci3m63` · IP `47.76.219.75` · สร้าง 21 มิ.ย. 2026
  > · security group `sg-j6c8dyjcl7nldecokv7v` · สถานะ **Stopped**
- **SSH key: import ของเราเอง อย่าให้ Alibaba สร้าง** — สร้างไว้แล้วที่ `~/.ssh/siambox-alibaba`
  ใน Console ไปที่ ECS → Key Pairs → **Import Key Pair** แล้ววาง public key:
  ```bash
  cat ~/.ssh/siambox-alibaba.pub    # คัดลอกทั้งบรรทัดไปวาง
  ```
  ตั้งชื่อว่า `siambox-alibaba` แล้วเลือก key นี้ตอนสร้าง ECS
  (ถ้าให้ Alibaba สร้างให้ จะดาวน์โหลด `.pem` ได้ครั้งเดียว หายแล้วต้องสร้าง instance ใหม่)
- ผูก **EIP** (Elastic IP) — จดเลข IP ใหม่ไว้
- **Security group** เปิด: `80/tcp`, `443/tcp` เปิดทุกที่ · `22/tcp` เปิดเฉพาะ IP ของคุณ

```bash
ssh -i ~/.ssh/siambox-alibaba root@<IP ใหม่>
```

### 3. ติดตั้ง Docker บนเครื่องใหม่

```bash
# บนเครื่อง Mac — ส่งโค้ดขึ้นไปก่อน
cd ~/Documents/GitHub/SiamBox
rsync -az --delete \
  --exclude '.git' --exclude 'node_modules' --exclude '.next' --exclude '.turbo' \
  --exclude 'dist' --exclude '*.pem' --exclude '.env' --exclude '*.env' \
  --exclude '.tmp' --exclude '._*' --exclude '.DS_Store' \
  -e "ssh -i ~/.ssh/siambox-alibaba" \
  ./ root@<IP ใหม่>:/root/SiamBox/

# บนเครื่องใหม่
ssh -i ~/.ssh/siambox-alibaba root@<IP ใหม่> 'cd /root/SiamBox/deploy && bash setup-ec2.sh'
```

### 4. วาง `.env` เดิมกลับ (คอนฟิกเหมือนเดิมทุกตัว)

```bash
scp -i ~/.ssh/siambox-alibaba ./deploy-env-backup root@<IP ใหม่>:/root/SiamBox/deploy/.env
```

**ไม่ต้องแก้ค่าอะไรเลย** ถ้าใช้โดเมนเดิม — `WEB_DOMAIN`, `API_DOMAIN`, `NEXT_PUBLIC_API_URL`,
`CORS_ORIGIN` ผูกกับโดเมน ไม่ได้ผูกกับ IP

สิ่งเดียวที่ต้องแก้ในไฟล์คืออีเมล — ตั้งเป็นอีเมลของบัญชีใหม่:

```
ACME_EMAIL=siamboxsupport@gmail.com
```

(มีผลแค่การแจ้งเตือนใบรับรองหมดอายุจาก Let's Encrypt ไม่กระทบการทำงาน)

### 5. ทดสอบก่อนสลับโดเมนจริง

อย่าสลับ DNS ของโดเมนหลักทันที — ใช้ซับโดเมนชั่วคราวทดสอบให้ครบก่อน

```
DNS: new.siambox.shop  A  <IP ใหม่>   (TTL 60)
```

บนเครื่องใหม่ เพิ่มบล็อกทดสอบใน `deploy/Caddyfile` ชั่วคราว:

```
new.siambox.shop {
	reverse_proxy web:3000
}
```

```bash
cd /root/SiamBox/deploy && docker compose up -d --build
curl -I https://new.siambox.shop        # 200 = Caddy ออกใบรับรองสำเร็จ + แอปทำงาน
docker compose logs --tail=50 web api
```

วิธีนี้ยืนยันได้ครบทั้ง Docker build, TLS, และแอป **โดยที่ลูกค้ายังใช้เครื่องเก่าอยู่**
ทดสอบเสร็จแล้วลบบล็อกนี้กับ DNS record ทิ้ง

### 6. สลับ DNS

ที่ผู้ให้บริการ DNS เปลี่ยน A record ทั้งสองตัวไป IP ใหม่:

```
siambox.shop        A  <IP ใหม่>
api.siambox.shop    A  <IP ใหม่>
```

Caddy บนเครื่องใหม่จะขอใบรับรองอัตโนมัติภายในไม่กี่วินาทีหลัง DNS กระจาย

```bash
docker compose logs -f caddy     # ดูว่าออกใบรับรองสำเร็จ
curl -I https://siambox.shop
curl https://api.siambox.shop/health
```

### 7. ตรวจให้ครบก่อนปิดเครื่องเก่า

```bash
curl -I https://siambox.shop                                    # 200
curl https://api.siambox.shop/health                            # {"ok":true,...}
curl https://api.siambox.shop/api/products | head -c 200        # มีสินค้าออกมา
```

- เปิดหน้าร้านดูว่าสินค้าขึ้นครบ
- ล็อกอินหลังบ้าน (`api.siambox.shop` + ADMIN_TOKEN เดิม)
- เช็คว่าเปิดจากจีนได้ — 17ce.com หรือ boce.com
- ถ้าเปิด payment gateway แล้ว: **เปลี่ยน webhook URL ใน dashboard ของ provider** ถ้า URL เปลี่ยน
  (ถ้าใช้โดเมนเดิม ไม่ต้องแก้ — แต่ Ksher ต้องเช็ค `KSHER_WEBHOOK_URL` ว่ายังตรง)

**ทิ้งเครื่องเก่าไว้อีก 3–7 วัน** ค่อยปิด — เผื่อต้องสลับกลับ

### 8. เก็บงาน

```bash
rm deploy-env-backup                    # ลบ secrets ที่คัดลอกมาพัก
```

แก้ [DEPLOY.md](DEPLOY.md) — เปลี่ยน IP `47.76.219.75` และชื่อไฟล์ key เป็นของใหม่ทุกจุด

---

## กับดักที่เจอบ่อย

| อาการ | สาเหตุ |
|---|---|
| Caddy ออกใบรับรองไม่ได้ | DNS ยังไม่ชี้มา · security group ไม่ได้เปิด 80 (Let's Encrypt ต้องใช้ 80 ตอน verify) · DNS ตั้งเป็น proxy/CDN ไม่ใช่ DNS-only |
| `too many certificates already issued` | Let's Encrypt จำกัด **5 ใบต่อโดเมนต่อสัปดาห์** — ถ้าลองสลับไปมาหลายรอบจะโดน รอครบ 7 วัน หรือทดสอบด้วยซับโดเมนอื่นแทน |
| `Permission denied (publickey)` | ลืม `chmod 600` ไฟล์ `.pem` ใหม่ |
| build ค้างหรือ OOM | สเปกเครื่องเล็ก — `setup-ec2.sh` ใส่ swap 2 GB ให้แล้ว ต้องแน่ใจว่ารันแล้ว |
| API ต่อ database ไม่ได้ | ถ้าเคยตั้ง IP allowlist ไว้ที่ Supabase ต้องเพิ่ม IP ใหม่ (ค่าเริ่มต้นของ Supabase เปิดสาธารณะ ปกติไม่ต้องทำ) |
| หน้าเว็บขึ้นแต่ไม่มีสินค้า | `NEXT_PUBLIC_API_URL` ใน `.env` ผิด หรือ `CORS_ORIGIN` ไม่มีโดเมนหน้าร้าน |

---

## สิ่งที่ต้องทำเองบน Console (ผมทำให้ไม่ได้)

- สมัครบัญชี Alibaba ใหม่ + ยืนยันตัวตน
- สร้าง ECS / EIP / security group / SSH key
- แก้ DNS record
- ถ้าเครื่องเก่าจ่ายรายปีไว้ อย่าลืมขอคืนเงินหรือยกเลิก auto-renew บนบัญชีเก่า


---

## 📌 กับดักที่เจอจริงตอนย้ายรอบนี้ (5 ส.ค. 2026)

เรียงตามลำดับที่เจอ — ถ้าย้ายอีกครั้งให้อ่านหัวข้อนี้ก่อน จะประหยัดเวลาไปมาก

### 1. Alibaba บอกว่า bind key แล้ว แต่เครื่องไม่มี `authorized_keys` เลย

Console แสดงว่า key pair ผูกกับ instance เรียบร้อย และกด bind ซ้ำก็ขึ้นว่า
*"The key pair is already bound to the instance"* — แต่ ssh เข้าไม่ได้

ตรวจด้วย Cloud Assistant พบว่า `/root/.ssh/authorized_keys` **ไม่มีอยู่จริง**

**วิธีที่ได้ผล:** ข้ามระบบ bind ไปเลย ใช้ **ECS → Cloud Assistant → Send Command**
(Shell, run as root) เขียน public key ลงเครื่องตรง ๆ:

```bash
mkdir -p /root/.ssh && chmod 700 /root/.ssh
echo '<public key บรรทัดเดียว>' >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys && chown -R root:root /root/.ssh
systemctl restart ssh 2>/dev/null || systemctl restart sshd
```

Cloud Assistant ไม่ต้องใช้ ssh เลย — เป็นทางเข้าสำรองที่ใช้ได้เสมอแม้ล็อกตัวเองออก

### 2. fingerprint ที่ Alibaba แสดง เทียบกับของเราไม่ได้

Alibaba ใช้สูตรของตัวเอง ไม่ตรงกับทั้ง `ssh-keygen -E md5` และ MD5 ของ DER
**อย่าเสียเวลาเทียบ** — ใช้ Cloud Assistant อ่าน `ssh-keygen -lf /root/.ssh/authorized_keys`
บนเครื่องจริงเลยเร็วกว่าและชัดเจนกว่า

### 3. API crash วนลูป — รหัส database ผิด

`Error: P1000: Authentication failed against database server`

`DATABASE_URL` ที่กรอกไว้ใน `apps/api/.env` ใช้รหัส Supabase เก่าที่ถูก reset ไปแล้ว
ทดสอบรหัสก่อนเสมอ ก่อนส่งขึ้น server:

```bash
docker run --rm -e PGURL="postgresql://user:pass@host:5432/postgres" postgres:17-alpine \
  sh -c 'psql "$PGURL" -tAc "select 1"'
```

> `psql` ไม่รู้จัก query param ของ Prisma (`connection_limit`, `pool_timeout`) — ตัดออกก่อนทดสอบ

### 4. Caddy ไม่ยอมขอใบรับรองหลังสลับ DNS

Caddy พยายามขอตั้งแต่ตอน DNS ยังชี้เครื่องเก่า → ล้มเหลว → เข้า backoff รอยาว
พอ DNS เปลี่ยนแล้วมัน **ไม่ลองใหม่ทันที**

```bash
docker compose restart caddy      # บังคับให้เริ่มขอใหม่ ได้ใบรับรองภายใน ~1 นาที
```

### 5. หน้าเว็บขึ้นแต่ไม่มีสินค้า — NAT hairpin

SSR รันอยู่ในคอนเทนเนอร์ พอยิง `https://api.siambox.shop` มันวิ่งออกไปหา public IP
ของเครื่องตัวเองแล้ววนกลับ → **timeout**

แก้ด้วย `API_INTERNAL_URL=http://api:4000` ใน `.env` (โค้ดฝั่ง `apps/web/src/lib/api.ts`
จะใช้ตัวนี้เฉพาะตอน render ฝั่ง server ส่วน browser ยังใช้ `NEXT_PUBLIC_API_URL` เหมือนเดิม)

ต้อง **rebuild web** ด้วย ไม่ใช่แค่ restart — static page ที่ generate ตอน build
ด้วยค่าเดิมจะว่างเปล่าค้างอยู่

### 6. `www.siambox.shop` ใช้ไม่ได้

`Caddyfile` มีแค่ `{$WEB_DOMAIN}` กับ `{$API_DOMAIN}` → ไม่มีใบรับรองสำหรับ `www`
ใครพิมพ์ `www.` เข้ามาเจอ TLS error ทันที เพิ่มบล็อก redirect แล้วใน `Caddyfile`

### 7. TTL 14400 วิ ทำให้ cache ค้าง 4 ชั่วโมง

**ลด TTL เหลือ 300 วิ ล่วงหน้าอย่างน้อย 1 วันก่อนย้าย** (ขั้นที่ 1 ในคู่มือนี้ —
รอบนี้ข้ามไป เลยต้องรอ cache หมดอายุเอง)

เวลาทดสอบให้ข้าม DNS ไปเลย จะได้แยกปัญหา server กับปัญหา DNS ออกจากกัน:

```bash
curl -s --resolve siambox.shop:443:<IP ใหม่> https://siambox.shop/
```
