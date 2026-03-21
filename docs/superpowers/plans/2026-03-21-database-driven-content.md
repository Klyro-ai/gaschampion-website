# Sub-project 1: Database-Driven Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all hardcoded business data from `src/data/business.ts` to D1 database, enabling the same Astro codebase to serve different clients.

**Architecture:** Add a `site_config` JSON column to the `clients` table storing the full business configuration. Add a Worker API endpoint to serve it. Replace the static `business.ts` imports across 19 files with a build-time API fetch via `src/lib/tenant.ts`. Gas Champion's existing data is seeded into D1.

**Tech Stack:** Cloudflare D1, Cloudflare Workers (Hono), Astro

**Spec:** `docs/superpowers/specs/2026-03-21-database-driven-content-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `workers/migrations/0004_site_config.sql` | Add site_config, custom_hostname, theme_id, trade_type columns |
| `workers/migrations/0005_seed_gaschampion.sql` | Seed Gas Champion's business data into site_config |
| `src/lib/tenant.ts` | Build-time tenant config resolver — fetches from API, exports same shape as business.ts |

### Modified Files
| File | Changes |
|------|---------|
| `workers/src/types.ts` | Add `SiteConfig` interface |
| `workers/src/db/client.ts` | Add `getSiteConfig()` and `updateSiteConfig()` methods |
| `workers/src/api/index.ts` | Add `GET /api/:clientId/config` endpoint |
| `src/layouts/Base.astro` | Import from `tenant.ts` instead of `business.ts` |
| `src/components/static/TopBar.astro` | Import from `tenant.ts` |
| `src/components/static/Header.astro` | Import from `tenant.ts` |
| `src/components/static/Footer.astro` | Import from `tenant.ts` |
| `src/components/static/MobileNav.astro` | Import from `tenant.ts` |
| `src/components/static/Hero.astro` | Import from `tenant.ts` |
| `src/components/static/WhyChooseUs.astro` | Import from `tenant.ts` |
| `src/components/static/CTABanner.astro` | Import from `tenant.ts` |
| `src/components/static/ServicePlans.astro` | Import from `tenant.ts` |
| `src/components/interactive/FAQ.tsx` | Import from `tenant.ts` |
| `src/components/interactive/AppIslands.tsx` | Import from `tenant.ts` |
| `src/lib/schema.ts` | Import from `tenant.ts` |
| `src/pages/index.astro` | Import from `tenant.ts` |
| `src/pages/about.astro` | Import from `tenant.ts` |
| `src/pages/contact.astro` | Import from `tenant.ts` |
| `src/pages/reviews.astro` | Import from `tenant.ts` |
| `src/pages/service-areas.astro` | Import from `tenant.ts` |
| `src/pages/services/index.astro` | Import from `tenant.ts` |
| `src/pages/services/[slug].astro` | Import from `tenant.ts` |

### Deleted Files
| File | Reason |
|------|--------|
| `src/data/business.ts` | Replaced by `src/lib/tenant.ts` |
| `src/content/blog/` (3 .md files) | Dead code — blog is API-driven now |
| `src/content.config.ts` | Dead code — content collections no longer used |

---

## Task 1: D1 Migration — Add site_config Column

**Files:**
- Create: `workers/migrations/0004_site_config.sql`
- Modify: `workers/src/types.ts`

- [ ] **Step 1: Create migration file**

Create `workers/migrations/0004_site_config.sql`:
```sql
ALTER TABLE clients ADD COLUMN site_config TEXT;
ALTER TABLE clients ADD COLUMN custom_hostname TEXT;
ALTER TABLE clients ADD COLUMN theme_id TEXT DEFAULT 'champion-blueprint';
ALTER TABLE clients ADD COLUMN trade_type TEXT;
```

- [ ] **Step 2: Add SiteConfig interface to types.ts**

Add after the `InviteToken` interface at the end of `workers/src/types.ts`:

```typescript
export interface SiteConfig {
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
  registrationNumber?: string;
  registrationBody?: string;
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

- [ ] **Step 3: Run migration on remote D1**

```bash
cd workers && npx wrangler d1 execute klyro-db --remote --file=migrations/0004_site_config.sql
```

- [ ] **Step 4: Commit**

```bash
git add workers/migrations/0004_site_config.sql workers/src/types.ts
git commit -m "feat: add site_config column and SiteConfig interface"
```

---

## Task 2: Seed Gas Champion Data

**Files:**
- Create: `workers/migrations/0005_seed_gaschampion.sql`

- [ ] **Step 1: Create seed migration**

Create `workers/migrations/0005_seed_gaschampion.sql`. This sets the `site_config` column for the `gaschampion` client with the full business.ts data as JSON, and sets `theme_id` and `trade_type`:

```sql
UPDATE clients SET
  site_config = '{"shortName":"Gas Champion","tagline":"Expert Boiler & Heating Services","subtitle":"Gas Safe Registered Engineers in Haverhill, Suffolk","description":"Gas Champion provides expert boiler repairs, installations, servicing, and heating solutions across Haverhill, Saffron Walden, Bury St Edmunds, and Sudbury. Gas Safe registered with 18+ years of experience.","owner":"Lee","ownerBackground":"Former British Gas technician with 11 years experience","phone":"07828 943 186","phoneLandline":"01440 575 525","email":"info@gaschampion.co.uk","address":{"street":"31 High Street","town":"Haverhill","county":"Suffolk","postcode":"CB9 8AD","full":"31 High Street, Haverhill, Suffolk, CB9 8AD"},"registrationNumber":"636427","registrationBody":"Gas Safe Register","yearsExperience":18,"socialMedia":{"facebook":"https://facebook.com/gaschampion","twitter":"https://twitter.com/GasChampionLtd"},"serviceAreas":["Haverhill","Saffron Walden","Bury St Edmunds","Sudbury","Clare","Steeple Bumpstead","Kedington","Great Yeldham","Halstead","Newmarket","Cambridge (South)"],"stats":{"reviewCount":80,"averageRating":5.0,"completedJobs":2000,"yearsInBusiness":18,"responseSla":"Same day"},"credentials":[{"name":"Gas Safe Registered","number":"636427"},{"name":"Fully Insured","number":null},{"name":"DBS Checked","number":null},{"name":"Ex-British Gas Engineer","number":null}],"guarantees":["No fix, no fee guarantee","All work guaranteed for 12 months","Transparent pricing — no hidden costs","Same-day emergency service available"],"services":[{"id":"boiler-repair","name":"Boiler Repair","shortDesc":"Fast, reliable boiler fault diagnosis and repair","description":"Is your boiler playing up? Our expert engineers diagnose and fix all boiler faults quickly. With 18+ years of experience and ex-British Gas training, we can repair all major brands including Worcester, Vaillant, Baxi, Ideal, and more. Same-day emergency service available.","icon":"wrench","features":["All major brands repaired","Same-day emergency callouts","No fix, no fee guarantee","Transparent pricing upfront"],"fromPrice":"£75"},{"id":"boiler-installation","name":"Boiler Installation","shortDesc":"New boiler installations and replacements","description":"Whether you need a complete new boiler installation or a like-for-like replacement, we provide expert fitting with manufacturers'' warranties. We''ll help you choose the right boiler for your home and budget, with finance options available.","icon":"flame","features":["Free home survey and quote","All major brands supplied and fitted","Up to 10-year manufacturer warranty","Finance options available"],"fromPrice":"£1,800"},{"id":"boiler-servicing","name":"Boiler Servicing","shortDesc":"Annual boiler servicing to keep your warranty valid","description":"Regular boiler servicing extends your boiler''s life, maintains efficiency, and keeps your manufacturer warranty valid. Our thorough service includes a full safety check, flue gas analysis, and detailed report.","icon":"clipboard-check","features":["Full safety inspection","Flue gas analysis","Efficiency check","Detailed written report"],"fromPrice":"£70"},{"id":"gas-safety","name":"Gas Safety Certificates","shortDesc":"CP12 landlord certificates and homeowner inspections","description":"Legal requirement for all landlords — we provide Gas Safety Certificates (CP12) for rental properties and safety inspections for homeowners. Quick turnaround with certificates emailed same day.","icon":"shield-check","features":["CP12 certificates for landlords","Homeowner safety inspections","Same-day certificate delivery","Multi-property discounts"],"fromPrice":"£60"},{"id":"powerflush","name":"System Powerflush","shortDesc":"Remove sludge and restore heating efficiency","description":"Sludge buildup is responsible for 20% of boiler breakdowns. Our powerflushing service removes rust, sludge, and debris from your central heating system, restoring efficiency and preventing costly repairs.","icon":"droplets","features":["Removes sludge and debris","Restores heating efficiency","Prevents future breakdowns","Chemical inhibitor included"],"fromPrice":"£350"},{"id":"smart-home","name":"Smart Thermostats","shortDesc":"Hive, Nest, Tado & Honeywell installation","description":"Upgrade your heating controls with a smart thermostat. Control your heating from your phone, save up to 23% on energy bills, and enjoy perfect comfort. We install and set up Hive, Nest, Tado, and Honeywell systems.","icon":"smartphone","features":["All major brands installed","Full setup and tutorial","Up to 23% energy savings","Voice control compatible"],"fromPrice":"£180"},{"id":"radiators","name":"Radiator Installation","shortDesc":"New radiators, moves, and pipework alterations","description":"Need a new radiator, want to move an existing one, or upgrade to designer radiators? We handle all radiator installations and pipework alterations with minimal disruption to your home.","icon":"thermometer","features":["New radiator fitting","Radiator relocations","Pipework alterations","Thermostatic valve upgrades"],"fromPrice":"£150"},{"id":"hot-water","name":"Hot Water Cylinders","shortDesc":"Vented and unvented cylinder maintenance and installation","description":"Expert installation, repair, and maintenance of vented and unvented hot water cylinders. Whether you need a new cylinder, an upgrade, or emergency repairs, we''ve got you covered.","icon":"droplet","features":["Vented & unvented systems","Emergency repairs","New installations","Annual maintenance"],"fromPrice":"£200"},{"id":"gas-fires","name":"Gas Fire Servicing","shortDesc":"Gas fire servicing, repairs, and safety checks","description":"Keep your gas fire safe and efficient with regular servicing. We service and repair all types of gas fires, including wall-mounted, inset, and freestanding models.","icon":"flame","features":["All types serviced","Safety inspections","Fault diagnosis and repair","Carbon monoxide testing"],"fromPrice":"£65"},{"id":"plumbing","name":"General Plumbing","shortDesc":"Taps, toilets, pipes — general plumbing repairs","description":"From leaking taps to burst pipes, we handle all general plumbing repairs and installations. No job too small — we''re here to help with any plumbing issue in your home.","icon":"wrench","features":["Leak repairs","Tap and toilet fixes","Pipe repairs and replacements","No job too small"],"fromPrice":"£55"}],"servicePlans":[{"name":"Silver","price":"£8.99","period":"/month","features":["Annual boiler service","Gas safety check","Priority booking","10% off repairs","Annual reminder"],"popular":false},{"name":"Gold","price":"£14.99","period":"/month","features":["Annual boiler service","Gas safety check","Priority booking","20% off repairs","Annual reminder","System health check","Radiator bleed and balance","Emergency callout priority"],"popular":true}],"faqs":[{"question":"How often should I service my boiler?","answer":"Your boiler should be serviced annually by a Gas Safe registered engineer. Regular servicing keeps your boiler running efficiently, extends its lifespan, and is usually required to maintain your manufacturer''s warranty."},{"question":"Do landlords need a Gas Safety Certificate?","answer":"Yes — it''s a legal requirement for all landlords to have a valid Gas Safety Certificate (CP12) for rental properties. This must be renewed annually and a copy given to tenants within 28 days."},{"question":"How quickly can you attend an emergency?","answer":"We offer same-day emergency callouts for customers without heating or hot water. We aim to attend within a few hours during working days, and prioritise our service plan customers."},{"question":"What areas do you cover?","answer":"We cover Haverhill, Saffron Walden, Bury St Edmunds, Sudbury, and surrounding villages across the Suffolk, Essex, and Cambridgeshire borders. If you''re unsure, give us a call."},{"question":"What brands of boiler do you work on?","answer":"We repair and service all major boiler brands including Worcester Bosch, Vaillant, Baxi, Ideal, Glow-worm, Potterton, and more. For installations, we can supply and fit most leading brands."},{"question":"Is a powerflush worth it?","answer":"If your radiators have cold spots, your boiler is making noise, or your heating is slow to warm up, a powerflush can make a huge difference. Sludge buildup causes 20% of boiler breakdowns, so it''s also a great preventative measure."},{"question":"Do you offer finance for new boilers?","answer":"Yes, we offer finance options for new boiler installations so you can spread the cost. We''ll discuss all options during your free home survey."},{"question":"Can you install smart thermostats?","answer":"Absolutely! We install and set up Hive, Nest, Tado, and Honeywell smart thermostats. We''ll show you how to use it and help you get the most from your new smart heating controls. Customers save up to 23% on energy bills."}]}',
  theme_id = 'champion-blueprint',
  trade_type = 'gas-engineer'
WHERE id = 'gaschampion';
```

Note: Single quotes in JSON values are escaped as `''` for SQL.

- [ ] **Step 2: Run seed on remote D1**

```bash
cd workers && npx wrangler d1 execute klyro-db --remote --file=migrations/0005_seed_gaschampion.sql
```

- [ ] **Step 3: Verify data**

```bash
cd workers && npx wrangler d1 execute klyro-db --remote --command="SELECT id, theme_id, trade_type, LENGTH(site_config) as config_len FROM clients WHERE id = 'gaschampion'" --json
```

Expected: `config_len` > 5000 (the JSON blob is large), `theme_id` = 'champion-blueprint', `trade_type` = 'gas-engineer'.

- [ ] **Step 4: Commit**

```bash
git add workers/migrations/0005_seed_gaschampion.sql
git commit -m "feat: seed Gas Champion site_config data"
```

---

## Task 3: DB Layer — getSiteConfig Method

**Files:**
- Modify: `workers/src/db/client.ts`
- Test: `workers/test/db/client.test.ts`

- [ ] **Step 1: Write failing test**

Add to `workers/test/db/client.test.ts` inside the main describe block:

```typescript
describe('getSiteConfig', () => {
  it('returns parsed site_config for a client', async () => {
    // Seed site_config for test client
    await env.DB.prepare(
      "UPDATE clients SET site_config = ? WHERE id = ?"
    ).bind(JSON.stringify({ shortName: 'Test Co', tagline: 'Test tagline', services: [] }), 'test-client-001').run();

    const config = await clientDb.getSiteConfig();
    expect(config).not.toBeNull();
    expect(config!.shortName).toBe('Test Co');
    expect(config!.tagline).toBe('Test tagline');
  });

  it('returns null if no site_config set', async () => {
    // test-client-001 starts with no site_config
    const config = await clientDb.getSiteConfig();
    expect(config).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd workers && npx vitest run test/db/client.test.ts
```

- [ ] **Step 3: Implement getSiteConfig**

Add to the `ClientDB` class in `workers/src/db/client.ts`, as a new property group after `notifications`:

```typescript
config = {
  getSiteConfig: async (): Promise<import('../types').SiteConfig | null> => {
    const row = await this.db
      .prepare('SELECT site_config FROM clients WHERE id = ?')
      .bind(this.clientId)
      .first<{ site_config: string | null }>();
    if (!row?.site_config) return null;
    return JSON.parse(row.site_config);
  },

  updateSiteConfig: async (config: import('../types').SiteConfig): Promise<void> => {
    await this.db
      .prepare("UPDATE clients SET site_config = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(JSON.stringify(config), this.clientId)
      .run();
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd workers && npx vitest run test/db/client.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add workers/src/db/client.ts workers/test/db/client.test.ts
git commit -m "feat: add getSiteConfig and updateSiteConfig to DB layer"
```

---

## Task 4: API Endpoint — GET /api/:clientId/config

**Files:**
- Modify: `workers/src/api/index.ts`

- [ ] **Step 1: Add the config endpoint**

Add after the gallery endpoint and before the image serving endpoint in `workers/src/api/index.ts`:

```typescript
// GET /api/:clientId/config — full site configuration for build/SSR
app.get('/api/:clientId/config', async (c) => {
  const clientId = c.req.param('clientId');

  const client = await c.env.DB.prepare(
    'SELECT * FROM clients WHERE id = ?'
  ).bind(clientId).first();

  if (!client) return c.json({ error: 'Client not found' }, 404);

  const siteConfig = client.site_config ? JSON.parse(client.site_config as string) : null;
  if (!siteConfig) return c.json({ error: 'Site not configured' }, 404);

  return c.json({
    config: siteConfig,
    client: {
      id: client.id,
      business_name: client.business_name,
      theme_id: client.theme_id || 'champion-blueprint',
      trade_type: client.trade_type,
      custom_hostname: client.custom_hostname,
    },
  });
});
```

- [ ] **Step 2: Run all tests to verify nothing breaks**

```bash
cd workers && npx vitest run
```

- [ ] **Step 3: Deploy worker**

```bash
cd workers && npx wrangler deploy
```

- [ ] **Step 4: Verify endpoint works**

```bash
curl -s -H "X-API-Key: YOUR_BUILD_API_KEY" https://klyro-worker.dark-grass-ae74.workers.dev/api/gaschampion/config | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['config']['shortName'], d['client']['theme_id'])"
```

Expected output: `Gas Champion champion-blueprint`

- [ ] **Step 5: Commit**

```bash
git add workers/src/api/index.ts
git commit -m "feat: add GET /api/:clientId/config endpoint"
```

---

## Task 5: Tenant Resolver — src/lib/tenant.ts

**Files:**
- Create: `src/lib/tenant.ts`

- [ ] **Step 1: Create tenant.ts**

Create `src/lib/tenant.ts` that fetches config from the API at build time and re-exports in the same shape as `business.ts`:

```typescript
import { fetchKlyro } from './klyro-api';
import type { SiteConfig } from '../../workers/src/types';

let _cachedConfig: SiteConfig | null = null;

async function loadConfig(): Promise<SiteConfig> {
  if (_cachedConfig) return _cachedConfig;

  const data = await fetchKlyro<{ config: SiteConfig }>('/config');
  _cachedConfig = data.config;
  return _cachedConfig;
}

// Re-export in the same shape as the old business.ts
// so existing component imports need minimal changes

export async function getTenantData() {
  const config = await loadConfig();

  const business = {
    name: config.shortName ? `${config.shortName} Ltd` : config.shortName,
    shortName: config.shortName,
    tagline: config.tagline,
    subtitle: config.subtitle,
    description: config.description,
    owner: config.owner,
    ownerBackground: config.ownerBackground,
    phone: config.phone,
    phoneLandline: config.phoneLandline || '',
    email: config.email,
    address: config.address,
    gasSafeNumber: config.registrationNumber || '',
    yearsExperience: config.yearsExperience,
    socialMedia: config.socialMedia,
    serviceAreas: config.serviceAreas,
    stats: config.stats,
    credentials: config.credentials,
    guarantees: config.guarantees,
  } as const;

  return {
    business,
    services: config.services,
    servicePlans: config.servicePlans || [],
    faqs: config.faqs,
    reviews: [] as const, // Reviews now come from the API, not static data
  };
}
```

Note: `fetchKlyro` already exists in `src/lib/klyro-api.ts` and handles the API URL, key, and client ID from env vars.

- [ ] **Step 2: Verify the module resolves**

```bash
cd /path/to/project && npx astro check 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/tenant.ts
git commit -m "feat: add tenant config resolver"
```

---

## Task 6: Migrate Astro Pages — Replace business.ts Imports

**Files:**
- Modify: 10 page files and 9 component files (19 total)
- Delete: `src/data/business.ts`

This is the largest task. Every `.astro` file that imports from `business.ts` needs to call `getTenantData()` in frontmatter instead. React `.tsx` components need a different approach since they can't use async — they'll receive data via props.

- [ ] **Step 1: Update Base.astro layout**

Change the import and add async data fetch:

```astro
---
import '../styles/global.css'
import { getTenantData } from '../lib/tenant'
import { generateLocalBusinessSchema, generateFAQSchema } from '../lib/schema'
import Analytics from '../components/static/Analytics.astro'

interface Props {
  title?: string
  description?: string
}

const { business } = await getTenantData()
const { title, description } = Astro.props
const pageTitle = title
  ? `${title} | ${business.shortName}`
  : `${business.name} | ${business.tagline} in ${business.address.town}, ${business.address.county}`
const pageDesc = description || business.description
---
```

- [ ] **Step 2: Update all static components**

For each `.astro` component (`TopBar`, `Header`, `Footer`, `MobileNav`, `Hero`, `WhyChooseUs`, `CTABanner`, `ServicePlans`), replace:

```astro
import { business } from '../../data/business'
```

with:

```astro
import { getTenantData } from '../../lib/tenant'
const { business } = await getTenantData()
```

For components that also import `services`, `servicePlans`, etc., destructure those too:

```astro
const { business, services } = await getTenantData()
```

Files and their imports:
- `TopBar.astro`: `{ business }`
- `Header.astro`: `{ business }`
- `Footer.astro`: `{ business, services }`
- `MobileNav.astro`: `{ business }`
- `Hero.astro`: `{ business }`
- `WhyChooseUs.astro`: `{ business }`
- `CTABanner.astro`: `{ business }`
- `ServicePlans.astro`: `{ business, servicePlans }`

- [ ] **Step 3: Update page files**

Same pattern for pages:
- `index.astro`: `{ business, services, reviews }` — Note: reviews will be empty from tenant, page should fetch from API
- `about.astro`: `{ business }`
- `contact.astro`: `{ business }`
- `reviews.astro`: `{ business }` — reviews come from API already
- `service-areas.astro`: `{ business }`
- `services/index.astro`: `{ business, services }`
- `services/[slug].astro`: `{ business, services }`

- [ ] **Step 4: Update React components (FAQ.tsx, AppIslands.tsx)**

These are client-side React components that can't do async imports. They import `faqs` from `business.ts`. The simplest approach: pass faqs as a prop from the parent Astro page, or inline the data as a `<script>` tag.

For `FAQ.tsx` and `AppIslands.tsx`: check if they are used in Astro pages that already have the tenant data. If so, pass faqs as props. If they import directly, convert to accept props.

- [ ] **Step 5: Update schema.ts**

`src/lib/schema.ts` imports `business`, `services`, `reviews`, `faqs`. Make it accept these as parameters instead:

```typescript
export function generateLocalBusinessSchema(business: any, services: any, reviews: any) { ... }
export function generateFAQSchema(faqs: any) { ... }
```

Then update `Base.astro` to pass the data.

- [ ] **Step 6: Delete old files**

```bash
rm src/data/business.ts
rm -rf src/content/blog/
rm src/content.config.ts
```

- [ ] **Step 7: Build and verify**

```bash
npm run build
```

The site should build successfully and produce identical output to before.

- [ ] **Step 8: Deploy and verify**

```bash
npx wrangler pages deploy dist --project-name gaschampion-website --branch main
```

Check https://gaschampion-website.pages.dev — should look identical.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: migrate all business.ts imports to tenant.ts (D1-backed)"
```

---

## Task 7: Cleanup and Verification

- [ ] **Step 1: Run full test suite**

```bash
cd workers && npx vitest run
```

All tests should pass (minus the 3 pre-existing failures).

- [ ] **Step 2: Verify no remaining business.ts references**

```bash
grep -r "from.*data/business" src/ --include="*.ts" --include="*.astro" --include="*.tsx"
```

Expected: no results.

- [ ] **Step 3: Verify API config endpoint returns valid data**

```bash
curl -s -H "X-API-Key: $API_KEY" https://klyro-worker.dark-grass-ae74.workers.dev/api/gaschampion/config | python3 -c "import sys,json; d=json.load(sys.stdin); c=d['config']; print(f'Services: {len(c[\"services\"])}, FAQs: {len(c[\"faqs\"])}, Areas: {len(c[\"serviceAreas\"])}')"
```

Expected: `Services: 10, FAQs: 8, Areas: 11`

- [ ] **Step 4: Final commit and push**

```bash
git push origin main
```
