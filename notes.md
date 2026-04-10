# jrnxf.co Infrastructure & Tooling Notes

## Architecture

Everything runs on Cloudflare:

```
Browser → jrnxf.co (Cloudflare Pages)
           ├── /              → static Vite SPA (dist/)
           └── /api/repos     → Pages Function (functions/api/repos.ts)
                                  └── GitHub API (authenticated)
```

Single origin. No CORS. No separate API subdomain.

## How We Got Here

### Phase 1: Next.js on Vercel (original)

GitHub data fetched server-side via GraphQL API with `PERSONAL_GITHUB_TOKEN` in
`process.env`. Token stayed on the server. Worked fine.

### Phase 2: Vite SPA + Standalone Worker

Migrated to Vite SPA. GitHub API calls moved client-side → 403s from rate limiting
(60 req/hr unauthenticated). Can't embed token in client JS (visible in devtools).

Solution: Cloudflare Worker at `api.jrnxf.co` as a proxy. Token stored as a
Cloudflare secret. SPA calls the worker, worker calls GitHub with auth.

**Problem:** cross-origin setup required CORS handling, `www.jrnxf.co` vs `jrnxf.co`
caused CORS mismatches, and the worker was a separate deploy/config to maintain.

### Phase 3: Cloudflare Pages with Functions (current)

Consolidated everything into one Cloudflare Pages project:

- Static SPA served from `dist/`
- API function at `functions/api/repos.ts` → automatically maps to `/api/repos`
- Same origin = no CORS needed
- One deploy, one config, one secret store

**What was removed:**

- `worker/` directory (standalone worker)
- `api.jrnxf.co` subdomain + DNS record
- All CORS logic
- Vercel deployment

## Cloudflare Pages Setup

### Project Structure

```
jrnxf.co/
├── functions/
│   └── api/
│       └── repos.ts        # → /api/repos (file-based routing)
├── src/                    # Vite SPA source
├── dist/                   # build output (served as static)
├── wrangler.toml           # Pages config
└── vite.config.ts          # Vite+ config
```

### `wrangler.toml`

```toml
name = "jrnxf-co"
compatibility_date = "2024-12-01"
pages_build_output_dir = "dist"
```

That's it. Pages Functions are auto-discovered from `functions/`.

### Pages Function (`functions/api/repos.ts`)

Uses the `PagesFunction` type. The `env` parameter gives access to secrets.
File-based routing: `functions/api/repos.ts` → `/api/repos`.

No CORS headers needed since the function runs on the same origin as the SPA.

### Secrets

```sh
npx wrangler pages secret put GITHUB_TOKEN --project-name jrnxf-co
```

Secrets are encrypted, injected at runtime via `env.GITHUB_TOKEN`.

### Custom Domains

Added via Cloudflare API (wrangler CLI doesn't support this yet):

- `jrnxf.co` → Pages project
- `www.jrnxf.co` → Pages project

Cloudflare auto-manages DNS records + SSL since the zone is on their nameservers.

### Deploying

```sh
vp build                                           # build the SPA
npx wrangler pages deploy dist --branch main       # deploy to Cloudflare Pages
```

Or connect the GitHub repo in the Cloudflare dashboard for auto-deploys on push.

## Gotchas We Hit Along the Way

### Cloudflare Worker Phase

1. **`Authorization: Bearer` vs `Authorization: token`** — GitHub fine-grained PATs
   need `token` prefix, not `Bearer`. Got 401 Bad Credentials until we switched.

2. **`satisfies` keyword** — wrangler v3 bundler choked on `satisfies ExportedHandler<Env>`.
   Caused error 1042 (unhandled exception at startup).

3. **Error 1042** — Cloudflare's generic "worker threw" error. No details in response.
   Diagnosed by adding a temporary `/debug` endpoint.

4. **Routes vs Custom Domains** — `routes` with `zone_name` does NOT create DNS records.
   `custom_domain = true` does. Also, custom domains don't support wildcards or paths.

5. **CORS with www** — site served from `www.jrnxf.co` but worker only allowed
   `jrnxf.co` → CORS block. Had to add `www.jrnxf.co` to allowed origins.

### Cloudflare Pages Phase

6. **Pages secrets need redeploy** — after `wrangler pages secret put`, you must
   redeploy for the secret to be available to the function.

7. **Preview URLs lag** — fresh Pages deploys take a minute before preview URLs work.
   Production URL (`*.pages.dev`) works faster.

8. **Custom domains via API only** — `wrangler pages` CLI has no `add-domain` command.
   Used the Cloudflare REST API directly:
   ```
   POST /accounts/{id}/pages/projects/{name}/domains
   {"name": "jrnxf.co"}
   ```

## Vite+ Migration

### What is Vite+?

A unified toolchain from the Vite team that wraps Vite, Vitest, Oxlint, Oxfmt, and
Rolldown into a single CLI (`vp`). Replaces separate eslint/prettier/tsc configs with
one `vite.config.ts`.

### What it replaced

- **ESLint** → Oxlint (Rust-based, much faster)
- **Prettier** → Oxfmt (Rust-based formatter)
- **`tsc -b` for type checking** → built into `vp check`
- **lint-staged** → `staged` block in `vite.config.ts`
- **Separate configs** → everything in `vite.config.ts`

### Installation

```sh
curl -fsSL https://vite.plus | bash   # install vp CLI
vp migrate                            # auto-migrates existing Vite project
```

`vp migrate` did:

- Rewrote `import { defineConfig } from 'vite'` → `from 'vite-plus'` in config
- Updated `package.json` scripts to use `vp` commands
- Added `staged` block for commit hooks
- Set up git hooks via `vp config` (in `prepare` script)
- Overrode `vite` package to `@voidzero-dev/vite-plus-core`

### Configuration in `vite.config.ts`

```ts
import { defineConfig } from 'vite-plus';

export default defineConfig({
  staged: {
    '*': 'vp check --fix', // run on all staged files before commit
  },
  fmt: {
    singleQuote: true, // match existing code style
  },
  lint: {
    options: {
      typeAware: true, // oxlint uses TS type info for smarter rules
      typeCheck: true, // also run type checking (replaces tsc -b)
    },
  },
});
```

### Commands

| Command          | What it does                          |
| ---------------- | ------------------------------------- |
| `vp dev`         | Start dev server                      |
| `vp build`       | Production build                      |
| `vp check`       | Format + lint + typecheck in one pass |
| `vp check --fix` | Same but auto-fix what's fixable      |
| `vp lint`        | Lint only                             |
| `vp fmt`         | Format only                           |
| `vp test`        | Run Vitest                            |

### Gotchas

1. **`__dirname` not available in ESM** — `vp check` loads config as ESM. Used
   `new URL('./src', import.meta.url).pathname` instead.

2. **`baseUrl` removed** — oxc's type checker rejects `baseUrl` in tsconfig.
   Removed it; `paths` with `@/*` still works without it.

3. **Floating promises** — type-aware linting caught unhandled promise. Fixed with
   `void` prefix.

4. **Run `vp` directly** — don't run through `bun run` or other package managers.
   `vp` manages its own Node runtime (v24 with native .ts support).

## Maintenance

- **Rotate token** — `npx wrangler pages secret put GITHUB_TOKEN --project-name jrnxf-co`
- **Add repos** — edit the `REPOS` array in `functions/api/repos.ts` and redeploy
- **Deploy** — `vp build && npx wrangler pages deploy dist --branch main`
- **Check logs** — use Cloudflare dashboard → Pages → jrnxf-co → Functions logs
- **Local dev** — create `.dev.vars` with `GITHUB_TOKEN=...`, then `npx wrangler pages dev dist`
