# Sub-project 4: Onboarding Automation

> Automate new client setup: signup → AI generates all website content → site live in minutes.

## Current Gaps

1. Admin wizard only asks for: business name, client ID, Pages project name
2. No trade_type collection during admin setup
3. No AI content generation at signup
4. No business details collection during client onboarding
5. site_config must be manually seeded as JSON
6. No trade type catalog (service templates per trade)

## What Gets Built

### 1. Trade Type Catalog
A static mapping of trade types to default services, credentials, themes, and content templates:
- `gas-engineer` → Gas Safe credentials, boiler services, emergency-ready theme
- `plumber` → WaterSafe credentials, plumbing services, neighbourhood-hero theme
- `electrician` → NICEIC/NAPIT credentials, electrical services, smart-home-tech theme
- etc.

### 2. Extended Admin Wizard
When admin creates a new client, also ask:
- Trade type (from catalog)
- Owner name
- Phone number
- Email
- Town/postcode
- Registration number (optional)

### 3. AI Site Config Generator
New prompt that generates the entire site_config JSON from:
- Business name, owner name, trade type, location, years experience
- Uses trade catalog for services/credentials/theme defaults
- AI generates: tagline, subtitle, description, about text, FAQs, guarantees
- Services come from trade catalog (pre-written, not AI-generated — more reliable)

### 4. Extended Client Onboarding
After claiming invite, before Google/Social/Hours steps, add:
- Confirm/edit business details (pre-filled from admin input)
- Pick theme (3 options filtered by trade type, or accept default)
- Preview site link
- Then existing Google → Social → Hours flow

### 5. Auto-Provisioning Pipeline
When admin completes the wizard:
1. Create DB record with all fields
2. Run AI content generation (background)
3. Set theme from trade catalog default
4. Site is immediately accessible at `{id}.klyro.co.uk` (SSR serves it)
5. Generate invite link
6. Send invite to admin for forwarding to client

## Implementation Priority
1. Trade type catalog (data, no code)
2. AI site config generator (new prompt + service)
3. Extended admin wizard (more questions)
4. Auto-provisioning (wire it together)
5. Extended client onboarding (polish)
