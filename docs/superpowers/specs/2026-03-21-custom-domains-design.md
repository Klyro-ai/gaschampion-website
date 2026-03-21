# Sub-project 3: Custom Domains

> Enable clients to use their own domain (e.g., smithplumbing.co.uk) or a Klyro subdomain (smithplumbing.klyro.co.uk).

## Prerequisites (Manual — User Must Do)

1. Add `klyro.co.uk` zone to Cloudflare account (change nameservers at registrar)
2. Enable Cloudflare for SaaS on the zone (dashboard: SSL/TLS > Custom Hostnames)
3. Create DNS records:
   - `proxy-fallback` → AAAA 100:: (proxied) — fallback origin
   - `*` → AAAA 100:: (proxied) — wildcard for subdomains
4. Set fallback origin to `proxy-fallback.klyro.co.uk`
5. Add Worker route `*/*` → `klyro-site`
6. Create CF API token with SSL/Certificates edit permission, store as worker secret `CF_API_TOKEN`
7. Store zone ID as worker secret `CF_ZONE_ID`

## What Gets Built

### Subdomains (automatic, zero config per client)
- Wildcard DNS `*.klyro.co.uk` catches all subdomains
- `getClientByHostname()` already matches `{id}.klyro.co.uk` pattern
- New clients get `{id}.klyro.co.uk` working instantly when their DB record is created

### Custom Domains (via /domain bot command)
- Client types `/domain` → enters their domain → bot registers it via CF API → gives DNS instructions → polls for activation → notifies when live

### DB Changes
```sql
ALTER TABLE clients ADD COLUMN cf_hostname_id TEXT;
ALTER TABLE clients ADD COLUMN domain_status TEXT DEFAULT 'none';
CREATE INDEX idx_clients_custom_hostname ON clients(custom_hostname);
```

### New Files
- `workers/src/services/cloudflare-domains.ts` — CF API wrapper for custom hostnames
- `workers/src/telegram/client/domain-settings.ts` — /domain bot command handler

### Modified Files
- `workers/src/api/index.ts` — add /domain command routing + domain callbacks
- `workers/src/types.ts` — add CF secrets to Env
- `workers/wrangler.toml` — document new secrets
