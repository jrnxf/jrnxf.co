# Cloudflare Worker: GitHub Proxy — Setup Notes

## The Problem

The site was migrated from Next.js to a Vite SPA. In Next.js, GitHub API calls ran
**server-side** using a `PERSONAL_GITHUB_TOKEN` env var — the token never left the server.

In a client-side SPA, that token would be shipped in the JS bundle (visible to anyone
in devtools). Without auth, GitHub's REST API rate-limits to 60 req/hr per IP → 403s.

## The Solution

A Cloudflare Worker acts as a thin proxy:

```
Browser (jrnxf.co)  →  api.jrnxf.co/repos  →  GitHub API (authenticated)
```

The token lives as a **Cloudflare secret** (encrypted, never in code or env files).

## What Was Done

### 1. Created the Worker (`worker/`)

- `worker/src/index.ts` — the actual worker code
- `worker/wrangler.toml` — Cloudflare config (name, route, compatibility date)
- `worker/package.json` — deps: `wrangler` + `@cloudflare/workers-types`
- `worker/tsconfig.json` — TypeScript config for the worker environment

### 2. Worker Code Walkthrough (`worker/src/index.ts`)

**Env interface** — declares `GITHUB_TOKEN` as a secret binding. Cloudflare injects
this at runtime from encrypted storage (set via `wrangler secret put`).

**CORS handling** — the worker only allows requests from `jrnxf.co` and `localhost:5173`.
Browsers send a preflight `OPTIONS` request for cross-origin fetches; the worker
responds with the appropriate `Access-Control-*` headers.

**GitHub API calls** — for each pinned repo name, the worker fetches
`https://api.github.com/repos/jrnxf/{name}` with the `Authorization: Bearer` header.
This gives 5,000 req/hr instead of 60.

**Caching** — the response has `Cache-Control: public, max-age=600` (10 min).
Cloudflare's edge cache respects this, so most requests never hit GitHub at all.

### 3. Custom Domain Setup

In `wrangler.toml`:
```toml
routes = [
  { pattern = "api.jrnxf.co/*", zone_name = "jrnxf.co" }
]
```

When you deploy with this config, Wrangler:
1. Looks up the `jrnxf.co` zone in your Cloudflare account
2. Creates a DNS record for `api.jrnxf.co` pointing to the worker
3. Provisions an SSL certificate (via Cloudflare's edge)

No manual DNS changes needed — `wrangler deploy` handles it.

### 4. Updated the SPA (`src/lib/github.ts`)

Changed from calling GitHub directly to calling the worker:
```ts
const WORKER_URL = import.meta.env.DEV
  ? 'http://localhost:8787'     // wrangler dev
  : 'https://api.jrnxf.co'     // production
```

The `languageColor` mapping stays client-side (not worth an API field).

### 5. Deployed

```sh
cd worker
npm install                      # install wrangler + types
npx wrangler login               # browser-based OAuth (one-time)
npx wrangler deploy              # uploads code, sets up route + DNS
npx wrangler secret put GITHUB_TOKEN  # paste token, stored encrypted
```

## Key Concepts

- **Wrangler** — Cloudflare's CLI for managing Workers. Handles deploy, secrets,
  dev server, logs, etc.
- **Secrets vs env vars** — `wrangler secret put` stores values encrypted. They're
  available as `env.SECRET_NAME` in the worker but never visible in dashboards or logs.
  Regular env vars (in `wrangler.toml` under `[vars]`) are plaintext and committed to git.
- **Routes vs Custom Domains** — routes map a URL pattern on an existing zone to a worker.
  Custom Domains (an alternative) create a dedicated hostname. Routes are simpler when
  you already have the zone.
- **`wrangler dev`** — runs the worker locally on port 8787, simulating the Cloudflare
  runtime. Secrets need to be provided via `.dev.vars` file (gitignored) for local dev.

## Local Development

Create `worker/.dev.vars` (already gitignored by wrangler):
```
GITHUB_TOKEN=ghp_your_token_here
```

Then:
```sh
cd worker && npx wrangler dev
```

The SPA's dev server (port 5173) will call `localhost:8787` automatically.

## Maintenance

- **Rotate token** — `npx wrangler secret put GITHUB_TOKEN` and paste the new one
- **Add repos** — edit the `REPOS` array in `worker/src/index.ts` and redeploy
- **Check logs** — `npx wrangler tail` streams live request logs
- **Update wrangler** — `npm install wrangler@latest` in the worker dir
