# Klyro Go-to-Market Strategy: The Harvesting Feature

**Prepared: March 2026**
**Market: UK Tradespeople (745,000+ self-employed in construction alone)**

---

## Executive Summary

Klyro's harvesting feature — building a professional website from a tradesperson's existing digital footprint — is a category-defining capability. The UK trades market has 745,000+ self-employed construction workers, only ~34% have an effective digital presence, yet 87% of consumers search for trade services online. This is a massive, underserved market with near-zero infrastructure cost and strong unit economics.

The strategy below is designed to exploit one core insight: **tradespeople don't want to build a website. They want the website to already exist.**

---

## 1. The Demo — "Shut Up and Take My Money"

### The 5-Second Hook

**"Type your business name. Watch your website appear."**

That's it. No explanation of AI, no feature list, no pricing. Just a search box and a promise. The visual is a browser rendering a professional website in real-time, with the tradesperson's actual business name, real photos, real reviews, and real service areas populating as they watch.

Alternative hooks for ads:
- "We found 47 photos of your work online. Want to see them on your own website?"
- "Your Google reviews are 4.8 stars. Why are they on Google's website and not yours?"
- "Dave the Plumber got a website in 90 seconds. Without doing anything."

### The 60-Second Demo (In Person or Video)

**Second 0-5:** "What's your business name?" [Type it into the search box]

**Second 5-20:** The system harvests in real-time. Show a loading animation with actual data points appearing:
- "Found Google Business Profile... 23 reviews, 4.7 stars"
- "Found Checkatrade listing... 156 reviews"
- "Found 12 photos of your work"
- "Found service areas: Bristol, Bath, Keynsham"
- "Found accreditations: Gas Safe registered"

**Second 20-40:** The website renders. A fully designed, mobile-responsive site with:
- Their actual business name and logo (if found)
- Their real reviews pulled from Google/Checkatrade/Yell
- Their actual work photos
- Their real service areas
- A working contact form
- A click-to-call button

**Second 40-55:** Show the mobile version. "This is what customers see when they Google you and click through."

**Second 55-60:** "This is live right now. Want to keep it? £29 a month. Cancel anytime."

### The Live Demo Funnel (klyro.co.uk)

Build a public-facing demo page at `klyro.co.uk/preview` (or just the homepage). Single input field: "Enter your business name or postcode." The entire homepage IS the demo.

**Critical UX detail:** The preview must render in under 30 seconds. If it takes longer, show incremental progress (each data source appearing) so the user stays engaged. The "building your website" animation is the product demo.

### Demo Variations by Channel

| Channel | Demo Format |
|---------|-------------|
| Facebook ad | 15-second video of a real tradesperson's site being built |
| Trade show | iPad at Screwfix/Toolstation counter, invite them to try |
| WhatsApp/referral | Direct link: "klyro.co.uk/preview/daves-plumbing-bristol" |
| Cold outreach | Screenshot of their half-built preview attached to message |
| YouTube | "I built 10 tradesmen's websites without them knowing" |

---

## 2. Self-Serve vs Sales-Led

### Recommendation: Self-Serve First, Sales-Led for Expansion

The entire product thesis demands self-serve. If a tradesperson can't type their name and see a website in 90 seconds, you've lost the magic.

### Self-Serve Model (Primary)

**Flow:**
1. Tradesperson lands on klyro.co.uk
2. Types business name → preview generates (no signup required)
3. Browses their preview site → sees their real data
4. Clicks "Make this live" → enters email, picks plan, pays
5. Website is live immediately with a temporary klyro subdomain
6. Custom domain setup guided via simple wizard

**Pros:**
- Zero friction. No forms, no calls, no waiting.
- The preview IS the sales pitch. It sells itself.
- Scales infinitely. One developer serves 10,000 previews.
- Tradespeople can share their preview with mates ("look what I just found").
- Data: you learn which business types convert, which data sources matter.

**Cons:**
- Some tradespeople have minimal digital footprint — preview looks thin.
- No human to handle objections or upsell.
- Payment friction (some tradespeople prefer to pay by phone/bank transfer).

**Mitigation for thin previews:** Show a "Your website is 60% complete. Add a few details to finish it" prompt. Turn the gap into engagement, not disappointment. Let them add photos, services, and an "about me" section inline during the preview.

### Sales-Led Model (Secondary, for High-Value Segments)

Reserve human sales for:
- **Multi-trade firms** (£49+ plans, multiple service pages)
- **Tradespeople found via partnerships** (insurance companies, accounting apps sending leads)
- **Reactivation** (previews generated but not converted after 7 days — a quick call: "Did you see the website we found for you?")

### Admin-Created Model (Tertiary, for Outbound)

Keep the admin creation flow for:
- Building previews for outbound campaigns (see Section 3)
- Partnership onboarding (e.g., "Simply Business sent us your details, here's your preview")
- Demos at trade events

### Verdict

**Self-serve is the primary funnel. It IS the product.** The magic of "type your name, see your website" cannot be replicated by a salesperson describing it on a phone call. The product must sell itself.

---

## 3. The "Free Preview" Funnel — Unsolicited Website Generation

### The Concept

Scrape publicly available data for tradespeople who haven't asked for a website. Generate a preview. Contact them: "We built a website from your online presence. Want to see it?"

### Effectiveness Assessment: HIGH (with correct execution)

This is the single highest-leverage growth tactic available to Klyro. Here's why:

1. **Curiosity is irresistible.** A tradesperson who receives "We found your 4.8-star Google reviews and put them on a professional website" WILL click through. The open rate on this type of message will be 40-60%.

2. **The preview does the selling.** Once they see their own name, their own reviews, their own photos on a professional website, the sale is 80% made.

3. **Social proof is built-in.** Their real reviews are already there. They don't need to be convinced the site will look good — it already does.

4. **It demonstrates the product perfectly.** No demo needed. No explanation needed. The preview IS the pitch.

### Is It Creepy?

**Risk level: Moderate. Manageable with correct framing.**

**What makes it creepy:**
- "We've been watching you" energy
- Feels like surveillance if poorly worded
- Some tradespeople will feel their data has been "taken"

**What makes it NOT creepy:**
- All data is already public (Google, Checkatrade, Yell, Facebook)
- You're giving them something valuable for free
- The framing is "look what we found" not "look what we took"

**Correct framing (example email/message):**

> Subject: Your business already has a website — you just don't know it yet
>
> Hi [Name],
>
> We pulled together your Google reviews, Checkatrade profile, and work photos into a professional website. It took us 60 seconds.
>
> **[See your free preview →]**
>
> If you like it, you can make it live for £29/month. If not, no worries — we'll delete it.
>
> Klyro — Websites for tradespeople, built from what's already online.
>
> [Unsubscribe]

**Key principles:**
- Lead with value, not with "we scraped your data"
- Give them control ("we'll delete it")
- Keep it short — the preview link does the work
- Never use the words "harvesting" or "scraping" externally

### Is It Legal?

**This is the critical question. The answer is: it depends on the contact method.**

#### Data Collection (Building the Preview)
**LEGAL.** All data sources are publicly available: Google Business Profiles, Checkatrade listings, Yell, Facebook business pages. Scraping public data for this purpose is standard practice. The preview itself doesn't require consent to create — you're not storing personal data, you're aggregating public business data.

#### Contacting Them — HERE'S WHERE IT GETS COMPLEX

**UK PECR rules for sole traders are strict.** Under the Privacy and Electronic Communications Regulations:

- **Sole traders and partnerships are treated as INDIVIDUALS, not businesses.**
- You CANNOT send unsolicited marketing emails to sole traders without prior consent.
- The "legitimate interest" basis that works for B2B emails to limited companies does NOT apply to sole traders.
- The "soft opt-in" exception only applies if you obtained their details during a sale or negotiation.

**Most UK tradespeople are sole traders.** This means cold email to their personal email addresses is technically non-compliant under PECR.

#### Legal Contact Methods

| Method | Legal? | Notes |
|--------|--------|-------|
| Email to sole trader | NO (without consent) | PECR treats them as individuals |
| Email to Ltd company | YES (with legitimate interest) | Must include opt-out |
| Postal mail | YES | PECR doesn't cover post. GDPR still applies but legitimate interest works. |
| Phone call (not TPS-registered) | YES (with caution) | Must check TPS register first |
| Facebook/Instagram DM | GREY AREA | Platform ToS may restrict, but not PECR-regulated |
| Facebook/Instagram ad targeting | YES | Standard advertising, not direct marketing |
| Google ad targeting | YES | Standard advertising |
| LinkedIn InMail | YES (platform-governed) | Not PECR-regulated |

#### Recommended Legal Approach

**Option A: Targeted Advertising (Safest, Scalable)**
Don't contact them directly. Instead:
1. Build previews for tradespeople in a target area
2. Run Facebook/Instagram ads showing a GENERIC example: "We built a website for a plumber in Bristol in 60 seconds. Want to see yours?"
3. The ad links to the self-serve preview tool
4. They type their own name → see their preview → convert

**Option B: Postal Mail (Legal, High-Impact, Lower Scale)**
Send a physical postcard/letter:
- Front: Screenshot of their preview website
- Back: "We built this from your Google reviews. See the full site at klyro.co.uk/preview/[code]"
- Legal under GDPR legitimate interest for business correspondence
- Trades people actually READ physical post (unlike email)
- Cost: ~£0.80-£1.20 per piece including print + postage
- Expected response rate: 3-8% (high for direct mail, because the preview is personalised)

**Option C: Partner Channel (Legal, Scalable)**
Have a partner (insurance company, accounting app) send the communication on your behalf, using their existing consent. "As part of your Simply Business membership, we've partnered with Klyro to build you a free website preview."

#### The Bold Play (Higher Risk, Highest Reward)

Build 10,000 preview websites. Run Facebook ads that say: "We've already built websites for 10,000 UK tradespeople. Yours might be one of them. Check now." Link to self-serve tool. This is NOT direct marketing to individuals — it's advertising. Fully legal. And the curiosity factor is enormous.

---

## 4. Referral Mechanics

### Core Insight

Tradespeople operate in tight local networks. A plumber knows an electrician, a tiler, a plasterer, a builder. They drink in the same pubs, buy materials at the same trade counters, and are in the same WhatsApp groups. **One conversion can cascade into 5-10.**

### The Referral Structure

#### Tier 1: Peer Referral ("Your Mate Dave")

**Trigger:** When a tradesperson's website goes live, prompt them:
> "Know another tradesperson who could use a website? Send them yours as an example. If they sign up, you both get a month free."

**Mechanics:**
- Referrer gets 1 month free per successful referral (capped at 6 months/year = £174 value on the £29 plan)
- Referred person gets first month free
- Referral via unique link: `klyro.co.uk/r/daves-plumbing`
- The referral link shows DAVE'S live website as the example, then prompts "Want one like this? Type your business name."

**Why this works:** The referral link IS the demo. Dave's real website, with real reviews, is the social proof. The referred tradesperson thinks "If Dave can have one, I should have one."

#### Tier 2: Cross-Trade Referral ("Recommend Trades You Trust")

**Trigger:** After 30 days, prompt:
> "Your customers ask you for recommendations — electricians, plasterers, tilers. Add them to your site and we'll build them a free preview."

**Mechanics:**
- Tradesperson adds "recommended trades" to their site (genuine cross-referral, adds value for their customers)
- Klyro generates previews for each recommended trade
- Sends them a message: "[Dave's Plumbing] recommended you on their website and we built you a free preview."
- This is WARM outreach, not cold — Dave recommended them
- Legal under soft opt-in if framed correctly as a business referral, not marketing

#### Tier 3: Customer Referral ("Your Happy Customers")

**Trigger:** When a tradesperson's website receives its first enquiry via the contact form:
> "Your website just got its first lead! Want more? Share your site on Facebook — every customer who shares it gets entered into a monthly £100 tool voucher draw."

### The Social Proof Loop

**The killer referral mechanic is the LIVE EXAMPLE.**

When you approach any tradesperson, you should be able to show them a real website for someone they know, or someone in their area, or someone in their trade. This is infinitely more powerful than a template or a generic demo.

**Build a "Sites Near You" feature:**
> "12 tradespeople in BS1 already have Klyro websites. See them here."

This creates FOMO. "Everyone around me has a website and I don't."

### Referral Targets

| Metric | Target |
|--------|--------|
| Referral rate (% of customers who refer) | 15-25% |
| Conversion rate of referred leads | 30-40% (vs 5-10% cold) |
| Viral coefficient | 0.3-0.5 (each customer brings 0.3-0.5 new customers) |
| Time to referral | Within first 30 days |
| CAC of referred customer | £5-£15 (vs £40-£80 paid) |

---

## 5. Channel Strategy — Ranked by CAC

### Tier 1: Lowest CAC (£5-£20 per acquisition)

#### 1. Organic Self-Serve / Word of Mouth
- **CAC:** £0-£5
- **Mechanism:** Tradespeople find you via Google, share previews with mates
- **Scale:** Slow to start, compounds over time
- **Action:** SEO content (see Section 9), ensure the preview tool is the homepage

#### 2. Referral Programme
- **CAC:** £10-£15 (cost of free month)
- **Mechanism:** Existing customers refer peers
- **Scale:** Proportional to customer base
- **Action:** Launch on day 1. Make it dead simple. One-click sharing.

#### 3. Facebook Groups (Organic)
- **CAC:** £0-£10 (time cost only)
- **Mechanism:** Join trade Facebook groups (Bricklayers Talk Group, Plumb Chat, Woodworking UK, local trade groups). Don't spam. Instead: "I built a free website preview tool for tradespeople. Type your business name, get a website in 60 seconds. Feedback welcome."
- **Scale:** Medium. Each group has 5,000-50,000 members. There are hundreds of these groups.
- **Action:** Identify 50 target groups. Build genuine presence. Post value, not ads.
- **Risk:** Getting banned if perceived as spam. Must be genuinely helpful.

### Tier 2: Medium CAC (£20-£50 per acquisition)

#### 4. Facebook/Instagram Paid Ads
- **CAC:** £20-£40
- **Mechanism:** Video ads showing a real tradesperson's site being built in real-time. Target: self-employed, interests in trade tools/supplies, Checkatrade, MyBuilder, etc.
- **Why it works:** 45 million UK Facebook users. Tradespeople are heavy Facebook users. Video of the preview building in real-time is inherently shareable.
- **Budget:** Start with £50/day. Test 5 different trades (plumber, electrician, builder, plasterer, carpenter). Scale winners.
- **Creative:** "We built [Trade]'s website from his Google reviews. He didn't even know. Watch what happened."

#### 5. Google Ads — "Website for [Trade]" Keywords
- **CAC:** £30-£50
- **Mechanism:** Target keywords like "website for plumbers", "tradesman website", "builder website design". CPC is £2-£5 for these (much cheaper than "plumber near me" at £9-£22).
- **Why it works:** High intent. Someone searching "website for plumbers" is actively looking for what you sell.
- **Action:** Start with exact match keywords. Send to preview tool.

#### 6. Direct Mail (Postcards)
- **CAC:** £25-£40 (at 3-5% conversion)
- **Mechanism:** Send personalised postcards showing a screenshot of their preview website. "We built this from your Google reviews. See the full site at [URL]."
- **Why it works:** Physical. Tangible. Tradespeople read post. The personalised screenshot is impossible to ignore.
- **Scale:** Target 1,000 per month in a specific area. Measure conversion. Scale what works.
- **Cost per piece:** £0.80-£1.20 (print + postage)

### Tier 3: Higher CAC but Strategic (£50-£100)

#### 7. Trade Supply Shop Partnerships
- **CAC:** £50-£80 (revenue share or placement fee)
- **Mechanism:** QR code displays at Screwfix/Toolstation counters, builders' merchants, plumbing supply shops. "Scan to see your free website preview."
- **Why it works:** Captive audience. Tradespeople visit these shops 2-3x per week. They're standing in a queue with nothing to do.
- **Scale:** 900+ Screwfix stores, 550+ Toolstation stores.
- **Approach:** Start with independent builders' merchants (easier to partner). Screwfix/Toolstation are corporate — approach once you have traction and data.

#### 8. YouTube Content
- **CAC:** £30-£60 (production cost amortised)
- **Mechanism:** Create content tradespeople actually watch: "How to get more plumbing jobs in 2026", "Why your competitor is getting all the work", "I built 10 tradesmen's websites without asking them"
- **Why it works:** Tradespeople watch YouTube in vans, on breaks, in the evening. Trade content (tool reviews, how-tos) gets significant views.
- **Action:** Partner with existing trade YouTubers for sponsored content. Or build your own channel.

#### 9. Trade WhatsApp Groups
- **CAC:** £10-£30
- **Mechanism:** Not direct spam. Instead: get one person in a group to share their new Klyro website. "Just got this built from my Google reviews in 60 seconds, mental." The group sees it, curiosity drives clicks.
- **Scale:** Hard to scale systematically, but each group is 50-200 engaged tradespeople.

### Tier 4: Long-Term / Brand Building

#### 10. Van Signage Sponsorship
- Offer free/discounted websites to tradespeople who put "Website by Klyro" on their van
- Every van is a mobile billboard seen by other tradespeople and homeowners
- Cost: the discount (£10-£15/month revenue reduction)

#### 11. Trade Association Partnerships
- Partner with the Federation of Master Builders, NICEIC, Gas Safe Register
- "All Gas Safe registered engineers get a free website preview"
- These associations actively look for member benefits

#### 12. Local SEO / Google Business Profile
- Ensure klyro.co.uk ranks for "tradesman website", "website for plumbers UK" etc.
- Create location pages: "Websites for plumbers in Manchester"
- Long-tail SEO compounds over 6-12 months

---

## 6. The Pricing Conversation

### The Checkatrade Objection

**"I already pay for Checkatrade."**

This is the #1 objection. Here's the reframe:

> "Checkatrade is brilliant for getting found. But every lead you get there, Checkatrade owns. If you stop paying, those reviews, that profile, those leads — gone. Your Klyro website means you own your online presence. Your reviews, your photos, your contact form — all yours. And when someone Googles your business name, they find YOUR website, not Checkatrade's."

**The numbers that matter:**

| | Checkatrade | MyBuilder | Bark | Klyro |
|---|---|---|---|---|
| Monthly cost | £70-£140+VAT | Pay per lead (£3-£50) | Pay per lead (£5-£30) | £19-£49 |
| Annual cost | £840-£1,680+ | £500-£2,000+ (variable) | £500-£1,500+ (variable) | £228-£588 |
| You own the leads? | No | No | No | **Yes** |
| You own the reviews? | No | No | No | **Yes** |
| Works when you stop paying? | No | No | No | **Yes (website stays)** |
| Your own Google ranking? | No (Checkatrade ranks) | No | No | **Yes** |

### The Website Builder Objection

**"I can build a website on Wix for free."**

> "You absolutely can. How long did your last attempt take? Most tradespeople I talk to started building one, got to the 'About Us' page, and gave up. With Klyro, your site is already built — from your actual reviews and photos. You just approve it."

**The time argument:**
- Wix/Squarespace: 10-20 hours to build (if you finish)
- Local web designer: 2-4 weeks + £500-£2,000 upfront
- Klyro: 60 seconds. Already done.

### The "I Get All My Work From Word of Mouth" Objection

> "That's great — it means you do good work. But what happens when someone gets your name from a mate and Googles you? If they find nothing, or worse, they find your competitor who DOES have a website? A website isn't about replacing word of mouth. It's about making word of mouth work harder."

### The "£29 Is a Lot" Objection

> "One job. Your website needs to bring you one extra job per year to pay for itself. A single boiler service. A single rewire quote. One bathroom fitting enquiry. That's all. And most of our tradespeople get their first enquiry within the first month."

### Positioning Framework

**Klyro is NOT:**
- A lead generation platform (like Checkatrade/MyBuilder)
- A DIY website builder (like Wix/Squarespace)
- A web design agency (like local freelancers)

**Klyro IS:**
- Your professional online presence, built automatically
- The thing that converts word-of-mouth into paying jobs
- The thing that makes you look as good online as you are in real life

---

## 7. Seasonal Timing

### The Annual Cycle of a UK Tradesperson

| Period | Demand for Work | Propensity to Buy a Website | Why |
|--------|----------------|----------------------------|-----|
| **January** | LOW (post-Christmas slowdown) | **HIGH** | New year, new business resolutions. Quiet period = time to think about marketing. "This year I'll get more organised." |
| **February-March** | RISING | **HIGH** | Preparing for spring rush. Want to capture early leads. Tax year ending (April) prompts business investment. |
| **April-June** | HIGH (peak season starting) | **MEDIUM** | Busy with work but seeing competitors win jobs. "That bloke's got a website and I don't." |
| **July-August** | HIGH (peak) | **LOW** | Too busy to think about it. Revenue is good so urgency is low. |
| **September-October** | HIGH (pre-winter rush) | **MEDIUM-HIGH** | Homeowners preparing for winter. Tradespeople thinking about sustaining work through quieter months. |
| **November-December** | DECLINING | **MEDIUM** | Quieter period starting. Budget planning for next year. Christmas slowdown. |

### Trigger Events (Not Seasonal)

These individual events are more powerful than seasonal patterns:

1. **After losing a job to a competitor with a better website** — "He wasn't even cheaper, but he looked more professional online." This is the #1 emotional trigger. Build messaging around it.

2. **After a bad review** — Tradespeople who get a negative Checkatrade/Google review want to control their narrative. A website lets them showcase 50 positive reviews and bury 1 negative one.

3. **After getting a Gas Safe / NICEIC / trade certification** — They want to show it off. A website is the natural place.

4. **After going self-employed** — The "setting up my business" phase includes getting insurance, buying a van, and (sometimes) getting a website. Intercept them here.

5. **After being featured on a "find a trade" list that underdelivers** — Many tradespeople sign up for Checkatrade/MyBuilder and are disappointed. They're looking for alternatives.

### Campaign Calendar

| Month | Campaign Theme | Channel |
|-------|---------------|---------|
| January | "New Year, New Website — Already Built For You" | Facebook ads, email to existing preview views |
| February | "Spring Is Coming. Are You Ready For the Rush?" | Direct mail, Google ads |
| March | "Tax Year Ending — Invest In Your Business (from £19/month)" | Partner channels (accountants) |
| April | "Your Competitors Have Websites. Do You?" | Facebook ads with competitive angle |
| September | "Winter Work Dries Up. Make Sure Customers Can Find You." | Facebook ads, direct mail |
| November | "Black Friday for Tradespeople — First 3 Months Half Price" | All channels |

---

## 8. Partnership Plays

### Tier 1: High-Value Partnerships (Launch Within 6 Months)

#### Trade Insurance Companies

**Why:** They have verified contact details for virtually every self-employed tradesperson in the UK. Simply Business alone has ~1 million customers.

**Key targets:**
- **Simply Business** (900K+ customers, already has a partner programme and affiliate programme, covers 1,500+ trades)
- **Hiscox** (480,000+ UK businesses, specialises in small business)
- **Tradesman Saver** (specialist trade insurance)
- **Markel Direct** (trade-specific insurance)

**Partnership model:**
- Simply Business emails their customer base: "As part of your Simply Business membership, we've partnered with Klyro to build you a free website preview."
- Revenue share: 20-30% of first-year subscription revenue per converted customer
- Or: flat bounty of £30-£50 per conversion
- Simply Business benefits: member benefit (reduces their churn), revenue share income

**How to approach:**
- Contact Simply Business via their partner page (simplybusiness.co.uk/partner/)
- Lead with data: "34% of tradespeople lack a digital presence. We can build one for your members in 60 seconds."
- Offer a pilot: 5,000 customers in one trade vertical, measure conversion

#### Trade Accounting Software

**Why:** They know every self-employed tradesperson who files taxes. They have active, engaged users who are already paying for business tools.

**Key targets:**
- **FreeAgent** (free with NatWest/RBS accounts — massive user base of sole traders)
- **QuickBooks** (global brand, UK-optimised)
- **Xero** (strong UK presence)

**Partnership model:**
- In-app integration: "Build your business website" button inside the accounting app
- Co-marketing: joint content about "growing your trade business"
- API integration: pull business details from accounting software to pre-populate the website
- Revenue share or flat referral fee

**FreeAgent is the priority.** Free with NatWest, so their users skew towards cost-conscious sole traders — exactly Klyro's market. FreeAgent has an open API and active integrations marketplace.

### Tier 2: Medium-Value Partnerships (Launch Within 12 Months)

#### Trade Certification Bodies

**Key targets:**
- **Gas Safe Register** (130,000+ registered engineers)
- **NICEIC** (electrical contractors)
- **Federation of Master Builders**
- **NAPIT** (electrical/plumbing)
- **OFTEC** (oil/renewable heating)

**Partnership model:**
- "All Gas Safe registered engineers get a free website with their registration number and Gas Safe logo prominently displayed."
- Gas Safe benefits: it promotes registration (website shows the badge) and adds a member benefit.
- Klyro benefits: instant credibility and a warm database of verified tradespeople.

#### Trade Van / Vehicle Branding Companies

Companies that wrap vans and create vehicle graphics for tradespeople (e.g., SignPrint, Van Image).

**Partnership model:**
- When a tradesperson orders van graphics, the company offers: "Want a website to match? We've partnered with Klyro."
- Bundle pricing: van wrap + website subscription

#### Trade Business Banking

- **Tide** (popular with sole traders)
- **Mettle** (NatWest's business account)
- **Starling Business**

These banks are actively looking for value-added services to reduce churn and increase engagement.

### Tier 3: Physical Presence Partnerships (12+ Months)

#### Builders' Merchants and Trade Counters

**Major targets:**
- Independent builders' merchants (easier to pilot)
- **Travis Perkins** (owns Toolstation)
- **Screwfix** (owned by Kingfisher)
- **Jewson** (owned by Compagnie de Saint-Gobain)
- **Selco** (trade-only)

**Partnership model:**
- QR code at the trade counter / on receipts: "Free website preview — scan here"
- Digital screens in-store showing Klyro demo
- Sponsorship of loyalty programmes

**Start with independents.** A single independent builders' merchant in Bristol can be a proof of concept. Show conversion data, then approach the nationals.

---

## 9. Content Marketing for Acquisition

### Core Strategy: Rank for What Tradespeople Actually Google

Tradespeople don't Google "website builder." They Google how to get more work. Intercept them with content that answers their real questions, then introduce Klyro as part of the solution.

### Priority Keywords and Content

#### Tier 1: High Intent, Direct

| Keyword | Monthly Volume (Est.) | Content |
|---------|-----------------------|---------|
| "website for plumbers" | 500-1,000 | Landing page + preview tool |
| "tradesman website" | 500-1,000 | Landing page + preview tool |
| "website for electricians" | 300-500 | Landing page + preview tool |
| "builder website design" | 200-400 | Landing page + preview tool |
| "how much does a tradesman website cost" | 200-400 | Comparison article (Wix vs agency vs Klyro) |

#### Tier 2: Problem-Aware, Indirect

| Keyword | Monthly Volume (Est.) | Content |
|---------|-----------------------|---------|
| "how to get more plumbing jobs" | 1,000-2,000 | Guide: 10 ways + "the fastest is having a website" |
| "how to get more electrical work" | 500-1,000 | Same format |
| "is Checkatrade worth it" | 2,000-5,000 | Honest comparison: "Checkatrade + your own website" |
| "Checkatrade alternatives" | 1,000-2,000 | List article, Klyro positioned differently |
| "how to market my plumbing business" | 500-1,000 | Comprehensive guide, website as foundation |
| "plumber Google reviews" | 300-500 | "How to get more Google reviews" + "display them on your website" |

#### Tier 3: Awareness, Top of Funnel

| Keyword | Monthly Volume (Est.) | Content |
|---------|-----------------------|---------|
| "plumber salary UK 2026" | 5,000-10,000 | Data article, soft CTA to preview tool |
| "how to become a self-employed plumber" | 2,000-5,000 | Setup guide, website mentioned as essential step |
| "how to start a plumbing business" | 1,000-3,000 | Checklist format, website included |
| "best van for plumbers" | 1,000-2,000 | Soft content, Klyro brand awareness |

### Content Formats That Work for Tradespeople

1. **Short, practical guides** (500-800 words). Not essays. Tradespeople skim.
2. **Comparison tables.** "Checkatrade vs MyBuilder vs Your Own Website" — clear, visual, scannable.
3. **Real examples.** "How [Name] the plumber went from 0 to 15 enquiries/month with a Klyro website."
4. **Video walkthroughs** (under 3 minutes). Show, don't tell.
5. **Trade-specific landing pages.** `/websites-for-plumbers`, `/websites-for-electricians`, `/websites-for-builders`. Each with trade-specific examples, pricing, and a preview tool.

### Content Calendar (First 6 Months)

**Month 1-2:** Trade-specific landing pages (plumber, electrician, builder, plasterer, carpenter, roofer = 6 pages)

**Month 3-4:** Problem-aware articles ("how to get more [trade] jobs", "is Checkatrade worth it", "Checkatrade alternatives")

**Month 5-6:** Case studies from real customers + comparison content ("tradesman website cost", "Wix vs Klyro vs web designer")

**Ongoing:** One new article per week targeting long-tail keywords in the trade space.

---

## 10. Activation Metrics — What Predicts Retention

### The Activation Moment: First Enquiry via Website

Based on patterns from similar SMB SaaS products, the single strongest predictor of retention for a tradesperson's website is: **receiving their first lead/enquiry through the website.**

Once a tradesperson gets a phone call or contact form submission that came from their Klyro website, the product has proven its value. They will not cancel.

### Activation Milestones (In Priority Order)

| Milestone | Time Target | Predicted Impact on 90-Day Retention |
|-----------|-------------|--------------------------------------|
| **1. First enquiry received** | Within 30 days | +60% retention vs those who don't |
| **2. Google indexed** | Within 7 days | +30% (they can Google their own name and find their site) |
| **3. Custom domain connected** | Within 7 days | +25% (psychological ownership: "this is MY website") |
| **4. First review displayed** | Within 3 days | +20% (the site looks legitimate and personal to them) |
| **5. Shared website link** | Within 14 days | +15% (told someone about it = invested in it) |
| **6. First photo added** | Within 14 days | +15% (personalisation = ownership) |
| **7. Google Business Profile linked** | Within 14 days | +10% (SEO benefit, more traffic) |

### The "Aha Moment" Framework

**For tradespeople, the "aha" is not a feature. It's a result.**

- "Someone found me on Google" → AHA
- "A customer said my website looks professional" → AHA
- "I got a job from someone who found my website" → AHA (this is the big one)

### Activation Playbook (First 30 Days)

**Day 0:** Website live. Send: "Your website is live! Here's what to do first: connect your domain (2 minutes)."

**Day 1:** "Your site has been submitted to Google. You should appear in search results within 3-5 days. Google your business name on Friday to check."

**Day 3:** "12 people have visited your website this week. [View analytics]" (even small numbers feel significant to a tradesperson who previously had NO data)

**Day 7:** "Your website is now on Google! Try searching '[Business Name] [Town]'. Pro tip: share your website link on your Facebook page and in your email signature."

**Day 14:** "Your website has had [X] visitors this month. Want more? Here are 3 things that help: [1] Add more photos of your work [2] Share your link in your WhatsApp status [3] Add your website URL to your van."

**Day 30:** If no enquiry yet: "Most tradespeople get their first website enquiry within 6 weeks. Here are the top 3 things that speed it up: [specific actions]."

### Metrics to Track

| Metric | Target | Why |
|--------|--------|-----|
| % who connect custom domain within 7 days | >40% | Strongest early predictor of retention |
| % who receive first enquiry within 30 days | >25% | The "magic moment" |
| % who add/edit content within 14 days | >30% | Engagement = ownership |
| % who view analytics in first 7 days | >50% | Curiosity about traffic = caring about the site |
| Time to first enquiry (median) | <21 days | If this is too long, improve SEO/traffic generation |

---

## 11. Churn Prediction

### Average Expected Churn Rate

For SMB SaaS at this price point (£19-£49/month), expect:
- **Monthly churn: 5-8%** initially (industry standard for SMB SaaS is 3-7%)
- **Target after optimisation: 3-4% monthly** (best-in-class for SMB)
- **Annual churn: 35-60%** initially, target **30-40%** after 12 months

### Churn Signals (Ranked by Predictive Power)

| Signal | Risk Level | Time Before Churn | Action |
|--------|-----------|-------------------|--------|
| **No enquiries received in 60 days** | CRITICAL | 2-4 weeks | Proactive call + free SEO boost + Google Ads credit |
| **Never connected custom domain** | HIGH | 1-2 months | Email sequence + offer to do it for them |
| **Zero logins in 30 days** | HIGH | 2-4 weeks | "Your website had [X] visitors. Did you know?" email |
| **Payment failure** | HIGH | Immediate | Dunning sequence (3 attempts + email + SMS) |
| **Support ticket about cancellation process** | CRITICAL | Days | Immediate human outreach, retention offer |
| **Declined to annual plan after 3+ months** | MEDIUM | 1-3 months | Offer annual discount (2 months free) |
| **No content changes in 90 days** | MEDIUM | 2-3 months | "Fresh content helps your Google ranking" nudge |
| **Competitor research (visited pricing page again)** | MEDIUM | 2-4 weeks | Proactive value reinforcement email |

### Churn Intervention Playbook

#### For "No Enquiries" (The #1 Churn Risk)

The tradesperson is paying £29/month and getting nothing back. This is the most dangerous situation.

**Intervention sequence:**
1. **Day 45 (no enquiry):** Email: "Your website is getting [X] visitors but no enquiries yet. Here are 3 quick wins to increase conversions: [add more photos] [add a special offer] [share on Facebook]."
2. **Day 60 (still no enquiry):** Personal email from "your Klyro account manager": "I've reviewed your website and made 3 improvements for free: [describe changes]. I've also submitted your site to 5 local directories."
3. **Day 75 (still no enquiry):** Phone call or voice message: "Hi [Name], I noticed your website hasn't had its first enquiry yet. I'd love to spend 10 minutes helping you get more traffic. Can I call you tomorrow?"
4. **Day 90 (still no enquiry):** Offer: "We're going to run a free Google Ads campaign for your business for 2 weeks, on us. Let's get your first enquiry."

**Cost of this intervention:** ~£30-£50 (staff time + ad spend). But saving a customer worth £348/year at the £29 plan is worth it. The LTV of a retained customer vs the cost of acquiring a new one makes this a no-brainer.

#### For "Never Connected Domain"

Many tradespeople find DNS settings intimidating. This is a technical barrier, not a value objection.

**Intervention:**
- Day 3: "Want us to connect your domain for you? Reply with your domain name and where you bought it, and we'll do the rest."
- Day 7: "93% of our tradespeople who connect their own domain get more enquiries. Here's a 2-minute video showing how."
- Day 14: Just do it for them. Email: "We've connected [businessname].co.uk to your website. It's live now."

#### For Payment Failures

Involuntary churn (failed payments) is typically 20-40% of all churn in SMB SaaS.

**Dunning sequence:**
1. Day 0: Retry payment. Email: "Your payment didn't go through. We'll retry in 3 days."
2. Day 3: Retry. Email: "Payment still failing. Update your card to keep your website live."
3. Day 7: Retry. Email with urgency: "Your website will go offline in 7 days if we can't process payment."
4. Day 10: SMS: "Your Klyro website will go offline in 4 days. Update payment: [link]"
5. Day 14: Site goes into "paused" mode (not deleted). Email: "Your website is paused. Reactivate anytime — all your content is saved."
6. Day 30: Final email: "We've saved your website for 30 days. After that, it will be archived. Reactivate: [link]"

**Never delete a website permanently.** Always keep it archived. Tradespeople who leave often come back 3-6 months later when they realise they need it.

### Reducing Churn Structurally

1. **Annual plans with discount.** Offer 2 months free on annual payment. Targets: convert 30%+ to annual within first 6 months. Annual customers churn at ~15%/year vs 50%+ monthly.

2. **"Website + Google" bundle.** Make the Google Business Profile integration so tight that cancelling Klyro means losing their GBP optimisation. Create switching costs.

3. **Review aggregation.** If Klyro is the place where all their reviews (Google, Checkatrade, Yell, Facebook) are displayed in one place, leaving Klyro means losing that aggregation. Sticky.

4. **Lead tracking.** Show tradespeople exactly how many enquiries came through their website each month. Make the value visible. "Your website generated 7 enquiries this month worth approximately £2,800 in potential revenue."

---

## 12. Expansion Revenue

### The Expansion Ladder

Start with the base subscription, then layer on upsells that align with the tradesperson's growth journey.

| Upsell | Price Point | Trigger | Margin |
|--------|------------|---------|--------|
| **Custom domain registration** | £12-£15/year | Signup (offer to register for them) | 60%+ |
| **Additional service area pages** | £5-£10/month | When they mention covering multiple towns | 90%+ |
| **Premium AI content** | £10-£15/month | After 30 days — "Want a blog that writes itself?" | 90%+ |
| **Google Ads management** | £49-£99/month + ad spend | After 60 days, especially if low enquiries | 50-60% |
| **Booking/scheduling system** | £10-£20/month | When they're getting regular enquiries | 80%+ |
| **Review management** | £10-£15/month | After first negative review, or proactively | 85%+ |
| **Email marketing** (to their past customers) | £10-£15/month | After 6 months, 50+ past customers | 85%+ |
| **Multi-page site upgrade** | £10-£20/month tier upgrade | When they want separate pages per service | 90%+ |
| **Priority SEO boost** | £20-£30/month | For competitive areas (London, Manchester) | 70%+ |
| **Logo design** | £49-£99 one-off | At signup if no logo found | 40-60% |

### High-Value Expansion: Google Ads Management

This is the single largest expansion revenue opportunity.

**The pitch (after 60 days):**
> "Your website is live and looking great. Want to put it in front of everyone searching for a [plumber] in [Bristol] right now? We'll manage your Google Ads for £49/month plus your ad budget."

**Why it works:**
- Google Ads for local trades are expensive to manage yourself (£9-£22 per click for "plumber near me")
- Tradespeople don't know how to run Google Ads
- Klyro already has their website, service areas, and trade data — campaign setup is trivial
- £49/month management fee + £200-£500/month ad spend = £249-£549 ARPU vs £29 base

**Revenue potential:** If 15% of customers add Google Ads management at £49/month average, that's a 25% increase in ARPU across the entire base.

### Expansion Revenue Targets

| Metric | Month 6 Target | Month 12 Target |
|--------|----------------|-----------------|
| Base ARPU | £29 | £29 |
| Expansion ARPU | £5 | £12 |
| Total ARPU | £34 | £41 |
| % of customers with at least 1 upsell | 15% | 30% |
| Net Revenue Retention | 95% | 105%+ |

### The "Full Service" Vision

The long-term expansion play is to become the **complete online presence manager** for tradespeople:
- Website (base product)
- Google Business Profile management
- Google Ads
- Facebook page management
- Review monitoring and response
- Email marketing to past customers
- Online booking system
- Invoice/quote integration (partner with FreeAgent/QuickBooks)

At this point, the £49/month plan becomes the £99-£149/month "Full Presence" plan, and the tradesperson has zero reason to look elsewhere.

---

## Summary: The First 90 Days

### Week 1-2: Foundation
- Self-serve preview tool live on klyro.co.uk homepage
- 6 trade-specific landing pages (plumber, electrician, builder, plasterer, carpenter, roofer)
- Referral programme built and live (1 month free for both parties)
- Analytics/activation tracking in place

### Week 3-4: First Paid Acquisition
- Facebook ads live: £50/day, 5 ad sets by trade, video creative showing preview being built
- Google Ads live: targeting "website for [trade]" keywords, £30/day
- First batch of 500 personalised postcards sent to tradespeople in one target city

### Week 5-8: Organic and Partnerships
- 50 Facebook trade groups identified; begin organic posting
- First 4 SEO articles published ("how to get more plumbing jobs", "is Checkatrade worth it", etc.)
- Simply Business partnership conversation initiated
- FreeAgent integration conversation initiated
- 2 local builders' merchants approached for QR code pilot

### Week 9-12: Optimise and Scale
- Analyse conversion data: which trades convert best? Which data sources matter most?
- Double down on winning channels, cut losing ones
- Launch first case study: real tradesperson, real results
- Introduce first upsell (additional service areas or premium AI content)
- Target: 100+ paying customers by end of week 12

### Key Targets

| Metric | 90-Day Target |
|--------|---------------|
| Previews generated | 5,000+ |
| Free-to-paid conversion rate | 5-10% |
| Paying customers | 100-200 |
| Monthly recurring revenue | £2,900-£5,800 |
| CAC (blended) | £30-£50 |
| Activation rate (first enquiry within 30 days) | 25%+ |
| Monthly churn | <8% |
| Referral rate | 10%+ |

---

## The One Thing That Matters Most

Everything in this strategy ladders up to one moment: **a tradesperson types their business name, sees a professional website built from their own data, and thinks "that's me — and it looks incredible."**

If that moment works, everything else follows. The referrals, the conversions, the retention, the expansion revenue — all of it depends on the preview being so good that the tradesperson feels like they'd be stupid NOT to pay £29/month to keep it live.

The product IS the marketing. Build the best preview experience possible, and the rest is optimisation.
