# Klyro Data Harvesting — 10 Expert Consultation Report

> Compiled from 10 specialist agents: Data Harvesting Architecture, AI Content Strategy, UX/Onboarding, SEO Migration, Privacy/Legal Compliance, Image Processing, Competitive Intelligence, Infrastructure Scalability, Quality Assurance, Growth/GTM Strategy.

---

## EXECUTIVE SUMMARY

### The Critical Reframe (all 10 agents converged here)

**Content harvesting is NOT your differentiator.** Wix, Brizy, ZipWP, Localo, Jimdo, and Durable all do versions of this already. The competitive intelligence agent found multiple platforms that already scrape Google Business Profile, Facebook, and Instagram to build websites.

**Your differentiator is the managed experience.** "We handle your entire digital presence — you do nothing except approve from Telegram." The harvesting is a feature, not the product. The product is the ongoing managed service.

### Top 10 Non-Negotiable Actions

1. **Privacy policy on every client site** — you're currently in violation of UK GDPR. Must fix before scaling.
2. **Cookie consent for Clarity** — PECR violation. Either add consent banner or switch to cookie-free Plausible only.
3. **Google attribution** — "Powered by Google" must appear near review displays. Currently missing, violates Places API ToS.
4. **Don't re-host Instagram/Facebook media** — violates platform terms. Either embed via oEmbed or have clients upload directly via Telegram.
5. **Never backdate blog posts** — Google's SpamBrain specifically detects date manipulation. Use current dates with natural past-tense references.
6. **Never invent services** — AI identifies service gaps as questions to the client, never auto-generates unconfirmed services.
7. **Use Cloudflare Workflows for harvesting** — single Worker invocation would exceed CPU limits. Workflows give step-level persistence and auto-retry.
8. **Validate contact info at onboarding** — phone format, postcode lookup via Postcodes.io, email MX check. Wrong phone number = lost customers.
9. **Fix hardcoded gaschampion.co.uk URLs** — schema.ts, Base.astro canonical tags, robots.txt all hardcode the domain. Breaks SEO for every non-Gas-Champion client.
10. **Get professional indemnity insurance** — £300-800/year. Covers AI generating false claims about qualifications.

### Cost Summary (all agents agree)

| Item | Cost per client | Notes |
|------|----------------|-------|
| AI content generation (onboarding) | ~$6-10 | Using Claude Sonnet for quality |
| Image processing (50-100 images) | ~$0.10 | Workers AI vision for alt text |
| Google Places API | ~$0.10 | Reviews, photos, business data |
| Infrastructure (monthly, at 500 clients) | ~$15/month total | Cloudflare free tiers cover almost everything |

---

## REVISED PLAN (incorporating all expert feedback)

### Phase 1: Legal/Compliance (BEFORE any more scaling)
- Add privacy policy template to all client sites
- Add cookie consent for Clarity (or switch to Plausible-only)
- Add Google attribution to review displays
- Stop re-hosting Instagram media in R2
- Create client service agreement + DPA template
- Add review removal request mechanism
- Get professional indemnity insurance

### Phase 2: Harvesting Pipeline
Architecture: **Cloudflare Workflows** (not raw Queues)
```
Workflow Instance (1 per client):
  Step 1: Scrape website (HTMLRewriter for static, CF Browser Rendering for Wix/Squarespace)
  Step 2: Google Places API (reviews, photos, business info — API key only, no client OAuth needed)
  Step 3: Facebook Page data (requires client OAuth)
  Step 4: Instagram media (requires client OAuth — download immediately, URLs expire in ~1hr)
  Steps 5-N: Download images in batches of 10
  Step N+1: AI business intelligence extraction (4 parallel analysis passes)
  Step N+2: AI content generation (services, about page, FAQs)
  Step N+3: AI voice matching (extract client's authentic writing voice from Instagram)
  Step N+4: Image deduplication + quality screening
  Step N+5: Batch write everything to D1
  → Telegram notification: "Your site is ready!"
```

### Phase 3: Onboarding UX (Telegram conversation flow)
The UX agent designed the complete flow. Key decisions:
- **Under 60 seconds of active input** from the tradesperson (5 taps + 2 text entries)
- **No OAuth in Phase 1** — scrape public Google/Facebook data. OAuth only for ongoing sync (post-launch).
- **Site goes live BEFORE all data is harvested** — show what you have, improve in background
- **The "wow moment"**: send a screenshot of their homepage in the Telegram chat before they even click the link
- **Abandonment handling**: max 2 nudges, then silence. Always pick up where they left off.
- **Free preview — no signup needed**: type business name → see your site. Only pay to keep it live.

### Phase 4: Image Pipeline
- Store one original per image (EXIF-stripped), resize on serve via Cloudflare Image Resizing
- Format detection from magic bytes (JPEG, PNG, WebP, HEIC, GIF)
- EXIF stripping for JPEG + PNG + WebP (already built for JPEG, need PNG/WebP)
- Alt text via Workers AI vision model (~$0.0001/image)
- Content screening (flag inappropriate images, don't auto-reject)
- Logo extraction from Facebook profile > website > Google > Instagram (priority order)
- Deduplication via SHA-256 + dimension/size fuzzy matching

### Phase 5: SEO Migration (for clients with existing sites)
- Per-client redirect maps in D1 (old URLs → new URLs, all 301s)
- Redirect middleware in SSR Worker (check before page render)
- Content preservation: map every ranking query to a new page
- Dynamic per-tenant sitemaps (replace @astrojs/sitemap)
- BlogPosting schema on blog pages (currently missing)
- 404 tracking to catch missed redirects
- Maintain redirects for 2+ years

### Phase 6: Quality Assurance
- Content validator (banned phrases, legal flags, field lengths) — runs before every draft
- Phone/email/postcode validation at onboarding
- Image quality gates (minimum resolution, aspect ratio, file size)
- Legal content review (detect superlative claims, guarantee language)
- SEO checks via weekly cron (title length, meta descriptions, schema, internal links)
- Admin daily digest via Telegram (new sites, flagged content, weekly stats)
- Total admin QA time: ~45 min/week for 100 clients

### Phase 7: Go-to-Market
- **The homepage IS the demo**: single search box, type business name, watch site build in 30 seconds
- **Self-serve first**: no sales calls, no forms. Telegram deep link or WhatsApp.
- **Channel priority**: referrals (£10-15 CAC) > Facebook trade groups > Facebook ads (£20-40 CAC) > Google Ads > trade counter partnerships
- **Simply Business partnership** is the #1 distribution target (900K+ trade customers)
- **90-day target**: 5,000 previews, 100-200 paying customers, £2,900-5,800 MRR

---

## MY ASSESSMENT OF EXPERT RECOMMENDATIONS

### Adopting fully:
- Legal/compliance priorities (Agent 5) — non-negotiable, must fix now
- Cloudflare Workflows architecture (Agent 8) — clearly the right approach
- UX conversation flow (Agent 3) — exceptionally detailed, implementable as-is
- Image pipeline design (Agent 6) — practical, works within Workers constraints
- QA framework (Agent 9) — right balance of automation vs human review
- AI content strategy (Agent 2) — voice matching, content calibration, cost model all solid

### Adopting with modifications:
- SEO migration (Agent 4) — excellent but over-engineered for initial launch. Implement redirect maps and 404 tracking first, defer image sitemaps and Search Console automation until Phase 5
- GTM strategy (Agent 10) — the free preview funnel is powerful but the legal constraints (PECR) limit cold outreach. Focus on self-serve + referrals first, direct mail later
- Competitive intelligence (Agent 7) — the "managed digital presence" reframe is correct. But the threat from Wix Harmony and Durable is real — speed to market matters

### Partially adopting:
- Data harvesting architecture (Agent 1) — excellent technical design but Cloudflare Browser Rendering is still beta. Start with HTMLRewriter-only scraping (covers ~60% of trade sites), add Browser Rendering when stable. The Durable Objects orchestration is over-engineered — Workflows are simpler.

### Decided against:
- Full perceptual image hashing (Agent 6 Tier 3) — diminishing returns, SHA-256 + fuzzy matching is sufficient
- Automated face blurring (Agent 6) — flag for review instead, let humans decide
- Competitor content scraping (Agent 1 section on competitor analysis) — legal risk too high, focus on the client's own data only
- Complex OAuth for Google at onboarding (Agent 3) — public Places API gets 90% of the data without requiring client login. Add OAuth only for ongoing review sync post-launch.
