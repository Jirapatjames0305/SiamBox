# Deploy SiamBox → Alibaba Cloud ECS (Hong Kong)

Moves the app off Vercel/Render to an always-on Alibaba Cloud ECS instance in
**China (Hong Kong) / `cn-hongkong`**, behind Caddy for automatic HTTPS. Database
(Supabase) and storage (R2/Supabase) stay where they are.

**Order: deploy the frontend first** (Vercel is slow/unreliable in mainland China),
then move the API onto the same box later. Both run as containers behind one Caddy,
on separate subdomains.

> Why Alibaba HK: best network into mainland China that still needs **no ICP license**,
> and ports 80/443 work without ICP (mainland regions block web ports until ICP clears).
> Always-on (no Render free-tier cold start) — important for ChillPay webhooks.

## 1. Create the ECS instance (Alibaba console → ECS, region **China (Hong Kong)**)

- **Image:** Ubuntu 24.04 64-bit (x86)
- **Type:** entry 2 vCPU / 4 GB (e.g. `ecs.u1-c1m2.large` or a `t6` burstable)
- **System disk:** 40 GB ESSD (PL0 is fine)
- **Public IP / bandwidth:** assign an EIP (see step 2); start with **Pay-by-traffic**, ~5 Mbps peak
- **Logon:** create/download a **Key Pair** for SSH (or set a root password)
- **Security Group** — add inbound rules (default group blocks most ports):
  | Port | Source | Why |
  |------|--------|-----|
  | 22 (SSH) | **your IP only** | admin |
  | 80 (HTTP) | 0.0.0.0/0 | Let's Encrypt challenge + redirect |
  | 443 (HTTPS) | 0.0.0.0/0 | API traffic |

## 2. EIP — Elastic IP (stable public IP)

Create an **EIP** and bind it to the instance (or tick "Assign Public IPv4" at creation
and then convert to an EIP). A non-elastic public IP can change; the webhook + DNS need it fixed.

## 3. DNS

Add an **A record** for the frontend: `www.<yourdomain>` (or the apex) → the EIP.
(Add `api.<yourdomain>` → same EIP later when you move the API.)
**DNS-only — do NOT proxy through Cloudflare** (Cloudflare's free network is slow/blocked
in mainland China).

## 4. Provision the instance

Alibaba's Ubuntu images log in as **root** by default:

```bash
ssh -i your-key.pem root@<eip>

# get the code (read-only deploy key or a PAT for the private repo)
git clone https://github.com/<you>/SiamBox.git
cd SiamBox/deploy

bash setup-ec2.sh
```

## 5. Configure

```bash
cp .env.example .env
nano .env
```

For the frontend you only need:
- `WEB_DOMAIN` = `www.<yourdomain>` (must match the A record from step 3)
- `ACME_EMAIL`
- `NEXT_PUBLIC_API_URL` = your **current live API** (the Render URL for now)

## 6. Start the frontend

```bash
docker compose up -d --build web caddy
```

Caddy fetches the TLS cert automatically (needs port 80/443 open + DNS pointing here).

```bash
curl -I https://www.<yourdomain>        # 200 once the cert is issued
docker compose logs -f web              # watch the Next.js build/start
```

## 7. Cut over the frontend

- Point your domain's DNS (`www`/apex) at the EIP — already done in step 3.
- In **Vercel**, remove the custom domain (or leave it; once DNS points to Alibaba, Vercel no longer serves it).
- Test the site loads from China (17ce.com / boce.com) before retiring Vercel.

## 8. Add the API later (same box)

When ready to move the API off Render onto this instance:

1. Fill the API secrets in `.env` (DATABASE_URL, ADMIN_TOKEN, CHILLPAY_*, SUPABASE_*, CORS_ORIGIN, etc.) — copy from the Render dashboard.
2. Add the `api.<yourdomain>` A record → EIP.
3. Uncomment the API block in `Caddyfile`.
4. `docker compose up -d --build` (brings up `api` too; migrations run on start).
5. Set `NEXT_PUBLIC_API_URL=https://api.<yourdomain>` in `.env`, rebuild web: `docker compose up -d --build web`.
6. Update the **ChillPay dashboard** Result/Webhook URLs → `https://api.<yourdomain>/...`, then delete the Render service.

## Redeploying later

```bash
cd SiamBox && git pull && cd deploy && docker compose up -d --build
```

## Notes / follow-ups

- **CAPTCHA:** Turnstile may not load in mainland China — left disabled (blank `TURNSTILE_SECRET_KEY`). Revisit with GeeTest if spam appears.
- **China speed:** HK is outside the GFW. If load times into China are still poor, add a China CDN (Aliyun DCDN / CDNetworks) in front — no app changes needed.
