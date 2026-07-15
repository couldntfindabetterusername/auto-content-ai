# Deployment Guide

## Free Deployment Model

Deploys the full AutoContent stack at zero or near-zero cost using free tiers.

**Warning: suitable for low traffic / personal use only.**
**Warning: heavy PDF/Chromium export jobs may exceed free-tier memory limits (512 MB–1 GB).**

### Services

| Component | Provider (recommended) | Free tier |
|-----------|------------------------|-----------|
| Frontend  | Vercel / Netlify / Cloudflare Pages | ✅ free |
| Backend   | Render (free) / Koyeb (free) | ✅ free (spins down on idle) |
| Postgres  | Neon / Supabase | ✅ free |
| Redis     | Upstash | ✅ free (10K commands/day) |
| Worker    | Runs inside the API container | — |

### Architecture

In free deployment mode, the API server and background worker run as **two processes inside one container**, managed by `api/scripts/start-combined.sh`. The queue behavior is unchanged — the API enqueues jobs to Redis, the worker dequeues and processes them. They just share a container instead of being separate services.

### Required Environment Variables

Set these on your backend host (Render/Koyeb):

```env
NODE_ENV=production
PORT=3000

# External Postgres (Neon/Supabase — include ?sslmode=require)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# External Redis with TLS (Upstash — use rediss:// not redis://)
REDIS_URL=rediss://default:password@host:6379

# Public URL of your deployed frontend
FRONTEND_URL=https://your-app.vercel.app

# Google OAuth (callback must point to THIS backend's public URL)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://your-backend.onrender.com/api/auth/google/callback
SESSION_SECRET=a-long-random-secret

# LLM providers
YOUTUBE_API_KEY=...
GEMINI_API_KEY=...
LLM_PROVIDER=gemini
```

Set these on your frontend host (Vercel/Netlify/Cloudflare):

```env
VITE_API_URL=https://your-backend.onrender.com
```

### Deployment Steps

#### 1. Database — Neon

1. Create a Neon project at neon.tech
2. Copy the connection string (includes `?sslmode=require`)
3. Set as `DATABASE_URL` on the backend host

Migrations run automatically on startup (`api/src/db/index.ts` runs them via Drizzle).

#### 2. Redis — Upstash

1. Create a Redis database at upstash.com
2. Copy the **TLS connection string** (`rediss://...`)
3. Set as `REDIS_URL` on the backend host

#### 3. Backend — Render Free

1. Create a new **Web Service** pointing to this repo
2. Set **Dockerfile path**: `Dockerfile.api`
3. Set all env vars from the list above
4. The default CMD in `Dockerfile.api` starts API + worker together

#### 4. Frontend — Vercel

1. Import this repo, set **Root Directory** to `web`
2. Set `VITE_API_URL` to your Render backend URL
3. Deploy — Vite build picks up the env var at build time

#### 5. Google OAuth

Add both callback URLs to your Google Cloud Console OAuth client:
- `http://localhost:3000/api/auth/google/callback` (local dev)
- `https://your-backend.onrender.com/api/auth/google/callback` (production)

Also add your frontend URL to **Authorized JavaScript origins**.

### Local Test (free deployment mode)

Test the free compose file locally before pushing to Render:

```bash
# Ensure .env has DATABASE_URL and REDIS_URL pointing to real external services
docker compose -f docker-compose.free.yml up --build
```

This runs only the API container (no local postgres/redis/worker/web).
Verify at `http://localhost:3000/health`.

---

## Full Local Docker Compose (default)

```bash
docker compose up --build
```

Runs all services: `web + api + worker + postgres + redis`.
Frontend at `http://localhost:5173`.

---

## VPS / Paid PaaS (separate containers)

Use the base `docker-compose.yml`. Override the worker CMD if needed:

```yaml
worker:
  command: node dist/workers/worker.js
```

The API-only container can be started with:

```bash
# override CMD at runtime
docker run ... CMD node dist/main
```

Or set `start:api` script:

```bash
npm run start:api   # node dist/main (API only)
npm run start:worker:prod  # node dist/workers/worker.js (worker only)
```
