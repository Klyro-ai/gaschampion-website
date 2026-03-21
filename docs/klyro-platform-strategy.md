# Klyro Platform Strategy — Compiled Research Report

> 5 research agents analysed infrastructure, onboarding, pricing, workflow automation, and technical differentiators. This document synthesises the best ideas, resolves conflicts, and presents the recommended path.

---

## The Big Picture

Klyro is a **Telegram-managed website platform for tradespeople**. A plumber sends a photo from a job, gets an AI-written blog post, taps Approve, and it's live on their SEO-optimised website. No dashboard, no login, no complexity.

The existing Gas Champion implementation proves the concept. The question is: how do you turn this into a product that serves 500+ clients with minimal operational overhead?

---

## 1. ARCHITECTURE — The Critical Decision

### Recommendation: Switch from Static Builds to SSR

All agents converged on this. The current static Astro + Pages rebuild model **does not scale**.

**Why static breaks at scale:**
- Cloudflare Pages has ~500 builds/month limit per account
- 100 clients publishing weekly = 400+ builds/month (at the limit)
- Each publish takes 30-60 seconds (build + deploy) vs instant with SSR
- Managing 100+ Pages projects is operationally painful

**The SSR model:**
- One Astro app on Cloudflare Workers serves ALL clients
- Incoming request hostname → D1 lookup → render with that client's data/theme
- Content changes = cache purge (instant), not rebuild (30-60 sec)
- Cloudflare for SaaS handles custom domains (first 100 free, then $0.10/hostname/month)

**Cost at scale:**

| Clients | Cloudflare Cost | Revenue (avg £29/mo) | Margin |
|---------|----------------|---------------------|--------|
| 50 | ~£4/mo | £1,450/mo | 99.7% |
| 100 | ~£8/mo | £2,900/mo | 99.7% |
| 500 | ~£50/mo | £14,500/mo | 99.7% |

The infrastructure cost is essentially zero. The real costs are your time and customer acquisition.

**Migration path:** 5-7 weeks of dev work (database-driven content → SSR conversion → Cloudflare for SaaS → onboarding automation).

---

## 2. ONBOARDING — Signup to Live Site in Under 10 Minutes

### The Flow

**Step 1 — Intake (2 min):** Web form or admin bot collects: business name, phone, email, town, trade type, logo (optional).

**Step 2 — Auto-generation (under 60 sec):**
- AI generates all website copy: about page, service descriptions, FAQs, 3 starter blog posts, meta descriptions
- Theme auto-selected from logo colours (extract dominant colour → closest theme) or trade-type default
- Client record created in D1
- Custom hostname provisioned via Cloudflare API
- Site live on `{client}.klyro.co.uk` immediately

**Step 3 — Client self-onboards via Telegram (3-5 min):**
- Clicks invite link → opens @KlyroWebsiteBot
- Connects Google Reviews (search or paste URL)
- Connects Facebook/Instagram (OAuth button)
- Sets notification preferences
- First content sync triggers automatically

**Step 4 — Custom domain (24-48 hrs):** Client adds CNAME record. Automated polling for DNS verification.

**What can't be automated:** Logo provision, Facebook/Instagram OAuth (requires user interaction), custom domain DNS (requires client's registrar access).

---

## 3. PRICING — Three Tiers

### Recommended Structure

| Tier | Price | Target |
|------|-------|--------|
| **Starter** — £19/mo | Basic site, contact form, SEO setup, Telegram updates | No website currently |
| **Professional** — £29/mo | Multi-page site, AI blog posts (4/mo), Google reviews, gallery, monthly SEO report | Wants to rank on Google |
| **Growth** — £49/mo | Unlimited AI posts, Google + Facebook reviews, Instagram sync, priority support, quarterly SEO audit | Established, wants max visibility |

**Why this works:**
- £19/mo is less than a single Checkatrade lead
- £29/mo undercuts every managed web service (£49-£239/mo) while delivering more than basic template sites (£8-£15/mo)
- Annual billing discount (2 months free) reduces churn and improves cash flow

**Competitor positioning:**
- Checkatrade: £60-£140/mo + per-lead fees — Klyro is your own site, not a directory
- Wix/Squarespace: £12-£29/mo — but requires self-management, which tradespeople don't do
- Managed services: £49-£239/mo — Klyro matches features at a fraction of the price

**Revenue projections (conservative):**

| Timeline | Clients | Monthly Revenue | Annual Revenue |
|----------|---------|----------------|----------------|
| Month 12 | 75 | £2,175 | £26,100 |
| Month 24 | 250 | £7,250 | £87,000 |
| Month 36 | 500 | £14,500 | £174,000 |

**LTV:CAC ratio: ~19:1** (£960 LTV at 33-month avg lifetime vs £50 target CAC). Exceptional unit economics.

---

## 4. WORKFLOW AUTOMATION — One Person Managing 100+ Clients

### Priority-Ranked Automation (what to build first)

**Tier 1 — Automate immediately (highest ROI):**

1. **Review auto-approval** — Auto-approve 4-5 star reviews, alert client + admin on negative reviews. Eliminates 95% of review management.

2. **Daily admin digest via Telegram** — New reviews across all clients, errors, token expiry warnings, churn risks. The founder never has to manually check anything.

3. **Cache purge on publish** — Replace the build/deploy cycle with instant cache invalidation (SSR model). Content live in seconds.

**Tier 2 — Build next:**

4. **Auto-publish for trusted clients** — Skip the Approve step. Send photo + caption = blog post live in 30 seconds. "Undo" button for 1 hour.

5. **Token health monitoring** — Track OAuth token expiry, auto-refresh Instagram tokens, proactive re-auth alerts 7 days before Facebook expiry.

6. **Client self-service via Telegram** — `/settings`, `/posts`, `/gallery manage`, `/billing`. Clients answer their own questions.

**Tier 3 — Build when scaling past 30 clients:**

7. **Stripe billing** — Automated subscriptions, dunning for failed payments, client-facing `/billing` command.

8. **Rolling platform deploys** — Update all client sites via a single admin command. Canary to 3 test clients first, then roll out.

9. **Monitoring + alerting** — Site uptime checks, error rate spikes, build failure alerts — all via admin Telegram bot.

**Key principle:** Do NOT build a web dashboard. The Telegram-first admin interface is sufficient for 100+ clients and is the product differentiator. Build a web dashboard only when you hire a second person.

---

## 5. TECHNICAL DIFFERENTIATORS — What Makes Klyro Hard to Copy

### The Moat

The defensible advantage is not any single feature — it's the **interaction model**. Every feature flows through the same pattern:

> AI generates → Telegram presents → tradesperson taps Approve/Edit/Reject

This pattern scales to any content type. Competitors would need to abandon their dashboard paradigm to replicate it.

### Features Ranked by Impact + Feasibility

**Build immediately (1-2 weeks):**

1. **Lead capture → Telegram notification** (Impact: 10/10) — Contact form submissions forwarded to client's Telegram with "Call Back" / "Quote Sent" / "Not Interested" buttons. Lightweight CRM with zero logins. *This is the single most valuable feature for acquiring clients.*

2. **AI review responses** (Impact: 9/10) — New review arrives → AI drafts a response → client taps "Post Reply" in Telegram. Tradespeople can respond to reviews from their van between jobs.

3. **Weekly analytics summary** (Impact: 8/10) — "Your site got 340 visits. 12 people tapped your phone number. Top Google search: 'boiler repair haverhill'." Sent via Telegram. No one looks at dashboards.

**Build next (weeks 3-6):**

4. **Auto-generated location + service pages** (Impact: 9/10) — A plumber covering 15 towns with 8 services gets 120 unique landing pages with local schema markup. One Telegram message: "I now cover Newmarket" → all pages generated. *This is the local SEO nuclear option.*

5. **Smart seasonal content prompts** — "It's October — want me to draft a post about preparing boilers for winter?" AI-prioritised notifications that turn Klyro from a tool into a marketing assistant.

6. **Photo intelligence** — EXIF GPS extraction → auto-suggest location for blog posts. Image classification → auto-tag gallery photos. Before/after comparison detection.

**Later roadmap:**

7. **Google Business Profile automation** — Auto-post blog posts as GBP updates, sync photos, monitor suggested edits.

8. **Social media auto-posting** — Blog published → generate Facebook/Instagram post → approve via Telegram.

### Features Decided Against

- **WhatsApp alternative** (Agent 5) — Deprioritised. WhatsApp Business API costs up to $0.24/message in Europe, requires a BSP account, and has an inferior bot API compared to Telegram. If needed later, build a lightweight WhatsApp→Telegram bridge rather than duplicating all bot logic.

- **Competitive intelligence** (Agent 5) — Skipped entirely. Tradespeople don't make decisions based on competitor analysis. Engineering effort better spent on lead generation features.

- **Web dashboard** (Agent 4) — Deliberately avoided. The Telegram-only interface IS the differentiator. Building a dashboard makes Klyro just another Wix competitor.

---

## 6. GO-TO-MARKET — How to Get Clients

**Phase 1 — First 50 clients (months 1-6):**
- Direct outreach: Google "[trade] [town]", find businesses with no/bad websites, message them
- Referral programme: existing client gets £20 off for each referral signup
- Facebook/local community groups: build credibility, mention Klyro
- Trade supply shops: flyers at Screwfix, Toolstation, Plumb Center

**Phase 2 — 50-200 clients (months 6-18):**
- Content marketing: "How tradespeople can get more leads online"
- Trade show presence: live demos at Toolfair, PHEX, InstallerSHOW
- Partnerships: trade associations (CIPHE, NICEIC), trade insurance providers

**Phase 3 — 200-500+ clients (months 18-36):**
- Paid ads: Facebook targeting self-employed + trade interests, Google Ads
- Affiliate programme: trade bloggers, YouTube reviewers
- White-label: offer to web agencies serving the trades market

**The killer demo:** Show a tradesperson: "Send me a photo of a job." 60 seconds later, show them the published blog post on a live website. That is the conversion moment.

---

## 7. IMPLEMENTATION ROADMAP

| Phase | What | Timeline |
|-------|------|----------|
| **Phase 1** | Database-driven content: migrate `business.ts` to D1, create trade templates | Weeks 1-2 |
| **Phase 2** | SSR conversion: Astro on Cloudflare Workers, hostname routing, cache strategy | Weeks 2-4 |
| **Phase 3** | Cloudflare for SaaS: custom domains, automated provisioning | Weeks 4-5 |
| **Phase 4** | Onboarding automation: AI content generation, full provisioning pipeline | Weeks 5-6 |
| **Phase 5** | Lead capture + review responses + analytics (the acquisition features) | Weeks 6-8 |
| **Phase 6** | Stripe billing + admin digest + monitoring | Weeks 8-10 |
| **Phase 7** | Location pages + GBP automation + content expansion | Weeks 10-14 |

---

## 8. KEY RISKS

| Risk | Mitigation |
|------|-----------|
| SSR migration breaks existing Gas Champion site | Canary deploy: run SSR alongside static until verified |
| AI content quality inconsistent | Content moderation layer + prompt engineering + client style learning |
| Telegram adoption barrier | Most UK tradespeople already use it; offer WhatsApp bridge later if needed |
| Cloudflare platform dependency | Low risk — CF is stable and cheap. Data is portable (D1 is SQLite) |
| One-person operational bottleneck | Automation tiers designed to eliminate manual work progressively |

---

## Summary: The 30-Second Pitch

Klyro is a website platform where tradespeople manage everything from Telegram. Send a photo, get an AI blog post. Reviews sync automatically. Gallery updates from Instagram. No dashboard, no login, no hassle. £29/month — less than a single Checkatrade lead.

Infrastructure costs near zero (Cloudflare free tier). One person can manage 100+ clients. The Telegram-first interaction model is a genuine moat that Wix and Squarespace cannot replicate without abandoning their core product.

**Year 1 target:** 75 clients, £26k ARR
**Year 3 target:** 500 clients, £174k ARR
**Break-even:** ~15-20 clients
