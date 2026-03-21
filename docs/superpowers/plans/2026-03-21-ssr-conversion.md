# Sub-project 2: SSR Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert from static Astro builds to Server-Side Rendering on Cloudflare Workers, so one deployment serves all clients based on hostname.

**Architecture:** Add @astrojs/cloudflare adapter, create root wrangler.toml for SSR Worker, add hostname→client_id resolution via API, parameterize tenant.ts and klyro-api.ts, remove getStaticPaths from dynamic routes.

**Tech Stack:** Astro SSR, @astrojs/cloudflare, Cloudflare Workers

**Spec:** `docs/superpowers/specs/2026-03-21-ssr-conversion-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `wrangler.toml` (project root) | SSR Worker configuration |
| `src/lib/hostname-resolver.ts` | Resolve hostname → client config for each request |
| `src/middleware.ts` | Astro middleware — resolves tenant per request, stores in locals |

### Modified Files
| File | Changes |
|------|---------|
| `astro.config.mjs` | Add cloudflare adapter, output: 'server' |
| `package.json` | Add @astrojs/cloudflare dev dependency |
| `src/lib/tenant.ts` | Remove module cache, accept runtime context |
| `src/lib/klyro-api.ts` | Parameterize client_id, remove env var dependency |
| `src/env.d.ts` | Declare App.Locals type for tenant data |
| `workers/src/api/index.ts` | Add GET /api/lookup endpoint for hostname resolution |
| `src/layouts/Base.astro` | Read tenant from Astro.locals instead of getTenantData() |
| All page/component .astro files | Read from Astro.locals.tenant |
| `src/pages/services/[slug].astro` | Remove getStaticPaths, use SSR params |
| `src/pages/blog/[...slug].astro` | Remove getStaticPaths, use SSR params |

---

## Task 1: API — Hostname Lookup Endpoint

**Files:**
- Modify: `workers/src/api/index.ts`
- Modify: `workers/src/db/client.ts`

- [ ] **Step 1: Add getByHostname to DB layer**

Add to `workers/src/db/client.ts` (as a standalone function, not on ClientDB since it's pre-tenant):

```typescript
/** Look up a client by custom_hostname or subdomain pattern */
export async function getClientByHostname(
  db: D1Database,
  hostname: string
): Promise<{ id: string; business_name: string; theme_id: string; trade_type: string } | null> {
  // Try exact custom_hostname match first
  const byHostname = await db
    .prepare('SELECT id, business_name, theme_id, trade_type FROM clients WHERE custom_hostname = ? AND is_active = 1')
    .bind(hostname)
    .first();
  if (byHostname) return byHostname as any;

  // Try subdomain pattern: {client-id}.klyro.co.uk
  const subdomainMatch = hostname.match(/^([^.]+)\.klyro\.co\.uk$/);
  if (subdomainMatch) {
    const clientId = subdomainMatch[1];
    const byId = await db
      .prepare('SELECT id, business_name, theme_id, trade_type FROM clients WHERE id = ? AND is_active = 1')
      .bind(clientId)
      .first();
    if (byId) return byId as any;
  }

  return null;
}
```

- [ ] **Step 2: Add lookup endpoint**

Add to `workers/src/api/index.ts`, BEFORE the auth middleware (this endpoint is public — the SSR Worker needs it without an API key):

```typescript
// Public hostname lookup — used by SSR Worker to resolve tenant
app.get('/api/lookup', async (c) => {
  const hostname = c.req.query('hostname');
  if (!hostname) return c.json({ error: 'Missing hostname' }, 400);

  const client = await getClientByHostname(c.env.DB, hostname);
  if (!client) return c.json({ error: 'Unknown hostname' }, 404);

  return c.json({ client });
});
```

IMPORTANT: This must be BEFORE the `/api/*` auth middleware, or the middleware needs to skip it (like the image endpoint).

- [ ] **Step 3: Deploy worker**

```bash
cd workers && npx wrangler deploy
```

- [ ] **Step 4: Commit**

```bash
git add workers/src/db/client.ts workers/src/api/index.ts
git commit -m "feat: add hostname lookup endpoint for SSR tenant resolution"
```

---

## Task 2: Install Astro Cloudflare Adapter

**Files:**
- Modify: `package.json`
- Modify: `astro.config.mjs`
- Create: `wrangler.toml` (project root)
- Create/Modify: `src/env.d.ts`

- [ ] **Step 1: Install adapter**

```bash
npm install @astrojs/cloudflare
npm install -D wrangler@latest
```

- [ ] **Step 2: Update astro.config.mjs**

```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  site: 'https://gaschampion.co.uk',
  integrations: [
    react(),
    sitemap(),
  ],
  vite: {
    css: {
      postcss: './postcss.config.cjs',
    },
  },
});
```

- [ ] **Step 3: Create root wrangler.toml**

Create `wrangler.toml` at project root (NOT in workers/):

```toml
name = "klyro-site"
compatibility_date = "2025-04-01"
compatibility_flags = ["nodejs_compat"]

[vars]
KLYRO_API_URL = "https://klyro-worker.dark-grass-ae74.workers.dev"
KLYRO_API_KEY = "f90cecf50e88091412d6e608eaaebc4491c8a433931e4084112776308bb0e711"

[assets]
binding = "ASSETS"
```

Note: No D1 bindings on the SSR Worker — it reads from the API Worker.

- [ ] **Step 4: Create/update src/env.d.ts**

```typescript
/// <reference types="astro/client" />

interface TenantData {
  clientId: string;
  business: any;
  services: any[];
  servicePlans: any[];
  faqs: any[];
  apiBase: string;
  apiKey: string;
}

declare namespace App {
  interface Locals {
    tenant: TenantData;
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add astro.config.mjs wrangler.toml src/env.d.ts package.json package-lock.json
git commit -m "feat: add Astro Cloudflare SSR adapter and config"
```

---

## Task 3: Middleware — Per-Request Tenant Resolution

**Files:**
- Create: `src/middleware.ts`
- Modify: `src/lib/tenant.ts`
- Modify: `src/lib/klyro-api.ts`

- [ ] **Step 1: Create Astro middleware**

Create `src/middleware.ts`:

```typescript
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const hostname = context.request.headers.get('host') || 'localhost';
  const apiBase = import.meta.env.KLYRO_API_URL || context.locals?.runtime?.env?.KLYRO_API_URL || 'http://localhost:8787';
  const apiKey = import.meta.env.KLYRO_API_KEY || context.locals?.runtime?.env?.KLYRO_API_KEY || '';

  // Skip tenant resolution for static assets
  const url = new URL(context.request.url);
  if (url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/images/') || url.pathname === '/favicon.ico') {
    return next();
  }

  try {
    // Look up client by hostname
    const lookupUrl = `${apiBase}/api/lookup?hostname=${encodeURIComponent(hostname)}`;
    const lookupRes = await fetch(lookupUrl);

    let clientId: string;

    if (lookupRes.ok) {
      const { client } = await lookupRes.json() as { client: { id: string } };
      clientId = client.id;
    } else {
      // Fallback for dev/unknown hostnames
      clientId = import.meta.env.KLYRO_CLIENT_ID || 'gaschampion';
    }

    // Fetch tenant config
    const configUrl = `${apiBase}/api/${clientId}/config`;
    const configRes = await fetch(configUrl, {
      headers: { 'X-API-Key': apiKey },
    });

    if (!configRes.ok) {
      return new Response('Site not found', { status: 404 });
    }

    const { config } = await configRes.json() as { config: any };
    const c = config;

    context.locals.tenant = {
      clientId,
      business: {
        name: c.shortName?.includes('Ltd') ? c.shortName : `${c.shortName} Ltd`,
        shortName: c.shortName,
        tagline: c.tagline,
        subtitle: c.subtitle,
        description: c.description,
        owner: c.owner,
        ownerBackground: c.ownerBackground,
        phone: c.phone,
        phoneLandline: c.phoneLandline || '',
        email: c.email,
        address: c.address,
        gasSafeNumber: c.registrationNumber || '',
        yearsExperience: c.yearsExperience,
        socialMedia: c.socialMedia || {},
        serviceAreas: c.serviceAreas || [],
        stats: c.stats || {},
        credentials: c.credentials || [],
        guarantees: c.guarantees || [],
      },
      services: c.services || [],
      servicePlans: c.servicePlans || [],
      faqs: c.faqs || [],
      apiBase,
      apiKey,
    };
  } catch (e) {
    console.error('Tenant resolution error:', e);
    return new Response('Service unavailable', { status: 503 });
  }

  return next();
});
```

- [ ] **Step 2: Update tenant.ts to read from Astro.locals**

Replace the entire `src/lib/tenant.ts` with a simple re-export helper:

```typescript
export type { TenantData } from '../env.d.ts';

// In SSR mode, tenant data is set by middleware on Astro.locals.tenant
// Components access it via Astro.locals.tenant in .astro files
// This file provides the type and a helper for the few places that need it

export function getTenantFromLocals(locals: App.Locals) {
  return locals.tenant;
}
```

- [ ] **Step 3: Update klyro-api.ts to accept clientId**

Replace `src/lib/klyro-api.ts` to accept context:

```typescript
export function imageUrl(apiBase: string, r2Key: string): string {
  return `${apiBase}/api/image/${r2Key}`;
}

export async function fetchKlyroForClient<T>(apiBase: string, apiKey: string, clientId: string, endpoint: string): Promise<T> {
  const url = `${apiBase}/api/${clientId}${endpoint}`;
  const response = await fetch(url, {
    headers: { 'X-API-Key': apiKey },
  });

  if (!response.ok) {
    console.warn(`Klyro API error: ${response.status} for ${endpoint}`);
    return { reviews: [], posts: [], images: [], aggregate: { average: 0, count: 0 } } as T;
  }

  return response.json() as Promise<T>;
}

export async function getApprovedReviews(apiBase: string, apiKey: string, clientId: string) {
  return fetchKlyroForClient<{
    reviews: Array<{ id: string; source: string; author_name: string; rating: number; text: string; review_date: string }>;
    aggregate: { average: number; count: number };
  }>(apiBase, apiKey, clientId, '/reviews');
}

export async function getPublishedBlogPosts(apiBase: string, apiKey: string, clientId: string) {
  const data = await fetchKlyroForClient<{
    posts: Array<{ id: string; title: string; slug: string; content: string; description: string; tags: string; image_url: string | null; image_alt_text: string | null; published_at: string }>;
  }>(apiBase, apiKey, clientId, '/blog');
  return data.posts;
}

export async function getBlogPostBySlug(apiBase: string, apiKey: string, clientId: string, slug: string) {
  const url = `${apiBase}/api/${clientId}/blog/${slug}`;
  const response = await fetch(url, { headers: { 'X-API-Key': apiKey } });
  if (!response.ok) return null;
  const data = await response.json() as { post: any };
  return data?.post ?? null;
}

export async function getGalleryImages(apiBase: string, apiKey: string, clientId: string) {
  const data = await fetchKlyroForClient<{
    images: Array<{ id: string; r2_key: string; alt_text: string | null; caption: string | null; srcset: string | null }>;
  }>(apiBase, apiKey, clientId, '/gallery');
  return data.images;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/middleware.ts src/lib/tenant.ts src/lib/klyro-api.ts
git commit -m "feat: add SSR middleware for per-request tenant resolution"
```

---

## Task 4: Migrate All Pages to Use Astro.locals.tenant

**Files:** All .astro page and component files (19 files)

The pattern for every `.astro` file changes from:

```astro
import { getTenantData } from '../lib/tenant'
const { business } = await getTenantData()
```

to:

```astro
const { business } = Astro.locals.tenant
```

For pages that also use klyro-api functions (blog, gallery, reviews):

```astro
const { clientId, apiBase, apiKey, business } = Astro.locals.tenant
import { getPublishedBlogPosts } from '../lib/klyro-api'
const posts = await getPublishedBlogPosts(apiBase, apiKey, clientId)
```

For `imageUrl`:
```astro
import { imageUrl } from '../lib/klyro-api'
// Usage: imageUrl(Astro.locals.tenant.apiBase, post.image_url)
```

Dynamic routes (`services/[slug].astro`, `blog/[...slug].astro`):
- Remove `getStaticPaths()` entirely
- Use `Astro.params.slug` directly

React components (`FAQ.tsx`, `AppIslands.tsx`):
- Already receive `faqs` as props — no changes needed

`schema.ts`:
- Already parameterized — no changes needed

- [ ] **Step 1: Update all .astro components** (TopBar, Header, Footer, MobileNav, Hero, WhyChooseUs, CTABanner, ServicePlans)

Replace `getTenantData()` calls with `Astro.locals.tenant` destructuring.

- [ ] **Step 2: Update Base.astro**

Remove `getTenantData` import, use `Astro.locals.tenant`.

- [ ] **Step 3: Update all page files**

Replace `getTenantData()` with `Astro.locals.tenant`. For pages using klyro-api, pass `apiBase`, `apiKey`, `clientId`.

- [ ] **Step 4: Update blog and service dynamic routes**

Remove `getStaticPaths()`. Use `Astro.params` directly.

- [ ] **Step 5: Build and test**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: migrate all pages to SSR with Astro.locals.tenant"
```

---

## Task 5: Deploy SSR Worker and Verify

- [ ] **Step 1: Build**

```bash
npm run build
```

- [ ] **Step 2: Deploy SSR Worker**

```bash
npx wrangler deploy
```

This deploys the SSR Worker as `klyro-site`.

- [ ] **Step 3: Test**

Visit the Worker URL and verify the site renders correctly.

- [ ] **Step 4: Set up hostname routing**

For Gas Champion, set the custom_hostname in D1:

```bash
cd workers && npx wrangler d1 execute klyro-db --remote --command="UPDATE clients SET custom_hostname = 'gaschampion-website.pages.dev' WHERE id = 'gaschampion'"
```

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "feat: SSR conversion complete — one app serves all clients"
git push origin main
```
