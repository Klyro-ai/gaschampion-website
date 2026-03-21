# Sub-project 1: Database-Driven Content

> Migrate all hardcoded business data from `src/data/business.ts` to D1, enabling multi-tenant content serving.

## Goal

Replace the static `business.ts` imports (used by 17 files) with a D1-backed tenant resolver, so the same Astro codebase can serve different business data per client. This is the foundation for SSR multi-tenancy (Sub-project 2).

## Architecture

### Data Storage: One JSON Column

Rather than adding ~20 individual columns to the `clients` table, store the entire business configuration as a single `site_config TEXT` column containing a JSON blob. This matches the `business.ts` structure exactly and avoids constant schema migrations as we add fields.

**Why JSON blob over individual columns:**
- The data is always read as a whole (every page needs most fields)
- No queries filter by individual business fields (we look up by `client_id` or `hostname`)
- Adding new config fields requires zero schema changes
- The structure is complex (nested objects, arrays) — normalising into columns adds complexity for no query benefit

**What stays as individual columns:** Fields that are used for routing, lookup, or filtering:
- `custom_hostname TEXT` — for SSR hostname→client routing (Sub-project 2)
- `theme_id TEXT DEFAULT 'champion-blueprint'` — for theme selection
- `trade_type TEXT` — for trade templates and AI content generation

### Schema Migration

```sql
ALTER TABLE clients ADD COLUMN site_config TEXT;
ALTER TABLE clients ADD COLUMN custom_hostname TEXT;
ALTER TABLE clients ADD COLUMN theme_id TEXT DEFAULT 'champion-blueprint';
ALTER TABLE clients ADD COLUMN trade_type TEXT;
```

### site_config JSON Structure

Matches `business.ts` exactly:

```typescript
interface SiteConfig {
  shortName: string;
  tagline: string;
  subtitle: string;
  description: string;
  owner: string;
  ownerBackground: string;
  phone: string;
  phoneLandline?: string;
  email: string;
  address: {
    street: string;
    town: string;
    county: string;
    postcode: string;
    full: string;
  };
  registrationNumber?: string; // Gas Safe, NICEIC, etc.
  registrationBody?: string;   // "Gas Safe Register", "NICEIC", etc.
  yearsExperience: number;
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  serviceAreas: string[];
  stats: {
    reviewCount: number;
    averageRating: number;
    completedJobs: number;
    yearsInBusiness: number;
    responseSla: string;
  };
  credentials: Array<{ name: string; number: string | null }>;
  guarantees: string[];
  services: Array<{
    id: string;
    name: string;
    shortDesc: string;
    description: string;
    icon: string;
    features: string[];
    fromPrice: string;
  }>;
  servicePlans?: Array<{
    name: string;
    price: string;
    period: string;
    features: string[];
    popular: boolean;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}
```

### Worker API: Serve Client Config

Add a new API endpoint (authenticated, used at build/SSR time):

```
GET /api/:clientId/config → { config: SiteConfig, theme: ThemeConfig, client: Client }
```

This returns everything a page needs to render for a given client.

### Astro Data Layer

Replace `src/data/business.ts` with `src/lib/tenant.ts`:

```typescript
// For current static build: fetch from API at build time
// For future SSR: read from D1 binding directly
export async function getTenantConfig(): Promise<SiteConfig> {
  // Phase 1 (now): fetch from worker API using env vars
  const data = await fetchKlyro('/config');
  return data.config;
}
```

All 17 files that import from `business.ts` will import from `tenant.ts` instead. The interface stays the same — components don't change, just the data source.

### Gas Champion Data Migration

Seed Gas Champion's `site_config` with the current `business.ts` data as JSON. This is a one-time operation — the existing site works identically, just reading from D1 instead of a static file.

## Files Changed

### New Files
| File | Purpose |
|------|---------|
| `workers/migrations/0004_site_config.sql` | Add columns |
| `workers/src/types.ts` | Add SiteConfig interface |
| `src/lib/tenant.ts` | Tenant config resolver |

### Modified Files
| File | Change |
|------|--------|
| `workers/src/api/index.ts` | Add GET /api/:clientId/config endpoint |
| `workers/src/db/client.ts` | Add getSiteConfig() method |
| `src/data/business.ts` | Delete (replaced by tenant.ts) |
| 17 files importing business.ts | Change import to tenant.ts |

### Files Importing business.ts (all need updating)
These will be identified by grepping for `from '../data/business'` and `from '../../data/business'`.

## Testing Strategy

- Unit test: `getSiteConfig()` returns valid SiteConfig from D1
- Unit test: `/api/:clientId/config` endpoint returns correct data
- Integration test: Astro pages render correctly with tenant data
- Verification: Gas Champion site looks identical before and after migration

## What This Does NOT Include

- SSR conversion (Sub-project 2)
- Custom domain routing (Sub-project 3)
- AI content generation for new clients (Sub-project 4)
- Theme switching UI (future)

## Dependencies

- None — this is the foundation sub-project
- The existing static build continues to work throughout (fetches config from API at build time)
