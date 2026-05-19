# SiamBox — Deployment Guide

Free-tier stack:

| Component | Host | Cost |
|-----------|------|------|
| `apps/web`   | Vercel           | Free (Hobby plan) |
| `apps/admin` | Vercel           | Free (Hobby plan) |
| `apps/api`   | Render (Docker)  | Free (sleeps after 15 min idle) |
| Postgres     | Supabase         | Free (500 MB) |
| Image store  | Cloudflare R2    | Free (10 GB) |

---

## 1. Database — Supabase

1. Create a project at https://supabase.com → note the **DB password**.
2. Settings → Database → **Connection string → URI**. Use the *Session pooler*
   (port 5432) for Prisma migrations:
   ```
   postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require
   ```
3. Append `&pgbouncer=true&connection_limit=1` if you hit pool limits during migrations.
4. Save this URL — it goes into the API as `DATABASE_URL`.

Run the initial migration once locally against the prod DB:

```bash
DATABASE_URL='<prod url>' pnpm --filter @siambox/database exec prisma migrate deploy
```

(After this, every Render deploy runs `prisma migrate deploy` automatically — see Dockerfile `CMD`.)

---

## 2. API — Render

The repo ships a Docker-based blueprint at [`render.yaml`](render.yaml).

1. Push the repo to GitHub.
2. Render dashboard → **Blueprints** → **New Blueprint Instance** → pick the repo.
3. Render reads `render.yaml`, creates the `siambox-api` web service.
4. Fill in the `sync: false` env vars in the dashboard (values copied from your
   local `.env`):
   - `DATABASE_URL` — from Supabase
   - `ADMIN_TOKEN` — long random string
   - `CORS_ORIGIN` — `https://siambox.pages.dev,https://admin-siambox.pages.dev`
     (update after the Pages URLs are minted in step 3)
   - `OMISE_PUBLIC_KEY`, `OMISE_SECRET_KEY`
   - `OMISE_RETURN_BASE` — public web URL (set after Pages deploys)
   - `CNY_TO_THB_RATE` — e.g. `5.0`
   - `R2_*` — when you migrate uploads to R2
5. Click **Apply**. First build takes ~6–8 min.
6. Health check: visit `https://siambox-api.onrender.com/health` → expect `{"ok":true,...}`.

**Free-plan caveats:**
- Service sleeps after 15 min of no traffic; first request after sleep takes
  ~30 s. The Pages frontend handles cold starts gracefully (loading states).
- **Filesystem is ephemeral** — `apps/api/uploads/` is wiped on every deploy.
  Product images uploaded through `/api/admin/uploads` will disappear. Migrate
  the upload route to write directly to R2 before adding real inventory.

---

## 3. Web + Admin — Vercel

Both apps are standard Next.js App Router projects — Vercel builds them
natively, no extra adapter required.

### 3a. siambox-web

1. https://vercel.com → sign in with the GitHub account that owns the repo.
2. **Add New… → Project** → **Import** the `SiamBox` repo.
3. Configure:
   - **Framework Preset**: *Next.js* (auto-detected)
   - **Root Directory**: `apps/web`
   - **Build / Output / Install commands**: leave as defaults
4. Environment Variables (Production + Preview + Development):
   - `NEXT_PUBLIC_API_URL` = `https://siambox-api.onrender.com`
5. Click **Deploy**. URL: `https://siambox-web.vercel.app`.

### 3b. siambox-admin

Same as 3a but:
- **Root Directory**: `apps/admin`
- Env: `NEXT_PUBLIC_ADMIN_API_URL` = `https://siambox-api.onrender.com`
- URL: `https://siambox-admin.vercel.app`

### 3c. After Vercel URLs exist

Go back to Render and update:
- `CORS_ORIGIN` → add the actual `.vercel.app` URLs
- `OMISE_RETURN_BASE` → the web URL (`https://siambox-web.vercel.app`)

Then trigger a redeploy on Render (Manual Deploy → Deploy latest commit).

---

## 4. R2 bucket (storage)

1. Cloudflare → **R2** → **Create bucket** → `siambox-uploads`.
2. Bucket → **Settings** → **Public access** → enable, copy the public URL.
3. **Manage R2 API Tokens** → Create token with R/W on the bucket.
4. Add `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`
   to Render env vars.
5. *(Code change required)* Update `apps/api/src/routes/admin.ts` upload route
   to push to R2 instead of `apps/api/uploads/`. Tracked separately.

---

## 5. Domains (optional)

Vercel → project → **Settings → Domains**:
- `siambox.com` → `siambox-web`
- `admin.siambox.com` → `siambox-admin`

Render → service → **Settings → Custom Domains** → add `api.siambox.com`.

Then update env vars to use the custom domains and trigger one more redeploy.

---

## Local development (unchanged)

```bash
pnpm install
cp .env.example .env       # fill in your local values
pnpm db:migrate            # creates the local schema
pnpm dev                   # turbo runs web (3000) + admin (3001) + api (4000)
```

---

## Troubleshooting

**Prisma `migrate deploy` fails on first boot**
The DB is empty and migrations haven't been applied. Run once locally against
the prod `DATABASE_URL` (see step 1) before the first Render deploy.

**API returns CORS error from the browser**
`CORS_ORIGIN` on Render must include the exact origin (scheme + host) that the
browser sends, comma-separated. Update on Render and redeploy.

**Render build OOM during `pnpm install`**
The free plan has 512 MB. The `--filter @siambox/api...` in the Dockerfile
already trims this; if it still OOMs, drop sharp's dev deps or move build
to a paid tier.
