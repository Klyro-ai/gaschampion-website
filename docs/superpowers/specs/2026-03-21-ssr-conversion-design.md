# Sub-project 2: SSR Conversion

> Convert from static Astro builds on Cloudflare Pages to Server-Side Rendering on Cloudflare Workers, enabling one deployment to serve all clients.

## Goal

One Astro SSR app serves all client websites. Incoming hostname determines which client's data to render. No per-client builds needed — content changes go live via cache purge.

## Architecture

### Two-Worker Model (keep separation of concerns)

- **API Worker** (`klyro-worker`): Telegram webhooks, content API, cron, queues. Already exists.
- **SSR Worker** (`klyro-site`): Serves all client websites. New. Reads data from API Worker.

The SSR Worker does NOT get D1 bindings. It fetches from the API Worker, same as the current static build. This keeps the data layer in one place and avoids duplicating DB access logic.

### Hostname Routing

The SSR Worker resolves hostname → client_id:

1. Request arrives at `smithplumbing.co.uk` or `smithplumbing.klyro.co.uk`
2. SSR Worker calls `GET /api/lookup?hostname=smithplumbing.co.uk` on the API Worker
3. API Worker looks up `custom_hostname` or subdomain pattern in `clients` table
4. Returns `client_id` + `theme_id`
5. SSR Worker fetches `/api/{client_id}/config`, `/api/{client_id}/blog`, etc.
6. Renders the page with that client's data
7. Response is cached at the edge (Cache-Control headers)

### Caching Strategy

- HTML pages: `Cache-Control: public, s-maxage=300` (5 min edge cache)
- When content changes (blog published), API Worker purges the SSR cache via Cloudflare API
- Static assets (CSS, JS, images): cached indefinitely (hashed filenames)

### What Changes

| Component | Current (Static) | New (SSR) |
|-----------|-----------------|-----------|
| astro.config.mjs | `output: undefined` (static) | `output: 'server'`, `adapter: cloudflare()` |
| tenant.ts | Fetches at build time, module cache | Fetches per request, uses hostname for client_id |
| klyro-api.ts | Uses env var `KLYRO_CLIENT_ID` | Receives client_id from hostname resolver |
| Dynamic routes | `getStaticPaths()` | Direct params (SSR handles routing) |
| Deploy | `wrangler pages deploy dist/` | `wrangler deploy` (Worker) |
| wrangler.toml (root) | N/A | New — defines SSR Worker |

### What Stays the Same

- All Astro components (`.astro` files) — zero changes to templates
- All React components (`.tsx` files)
- Theme system (CSS variables)
- API Worker — no changes needed
- klyro-api.ts functions (just need client_id parameterized)

## Files

### New Files
| File | Purpose |
|------|---------|
| `wrangler.toml` (project root) | SSR Worker config |
| `src/lib/hostname-resolver.ts` | Hostname → client_id lookup |

### Modified Files
| File | Change |
|------|--------|
| `astro.config.mjs` | Add cloudflare adapter, set output: 'server' |
| `package.json` | Add @astrojs/cloudflare, wrangler as devDeps |
| `src/lib/tenant.ts` | Accept client_id parameter instead of env var |
| `src/lib/klyro-api.ts` | Accept client_id parameter, add imageUrl helper |
| `src/pages/services/[slug].astro` | Remove getStaticPaths |
| `src/pages/blog/[...slug].astro` | Remove getStaticPaths |
| All page files | Pass hostname context to tenant resolver |
| `workers/src/api/index.ts` | Add hostname lookup endpoint |
