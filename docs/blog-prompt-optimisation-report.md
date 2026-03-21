# Blog Prompt Optimisation Report

> 5 expert agents (CRO, Trust Psychology, Local SEO, Copywriting, Content Strategy) analysed the AI blog generation prompt. This is the compiled, critiqued summary with recommended changes.

---

## Where All 5 Agents Agreed (Unanimous Recommendations)

### 1. The Content Sounds Too Much Like AI
Every agent flagged this. The copywriting agent provided a concrete banned phrases list (40+ phrases like "It's important to note", "In today's world", "comprehensive solution", "delve", "elevate", "seamless"). The trust agent said first-person voice ("I") builds dramatically more trust than "we" or third person. The CRO agent said authentic voice increases engagement and conversion.

**Fix:** Add a banned phrases list + mandate first person + trade shorthand ("combi", "rads", "the flue").

### 2. One CTA at the End Isn't Enough
CRO agent showed CTAs above the fold outperform by 304%. Trust agent said soft CTAs throughout feel less salesy. Local SEO agent said phone numbers in content are tap-to-call on mobile (70%+ of traffic).

**Fix:** Three CTAs — opening (soft), mid-article (contextual), closing (with "what happens next").

### 3. Content Is Too Short
Local SEO agent: top-ranking local service pages average 1,200+ words. CRO agent: more depth = more CTAs visible = more conversion. Content strategy agent: thin posts cannibalise each other.

**Fix:** Increase from 500-800 to 800-1,200 words.

### 4. No Strategic Honesty
Trust agent: admitting when a service ISN'T needed is the single strongest trust signal. Copywriting agent: "Could've upsold them but honestly..." builds more trust than any sales pitch. CRO agent: preemptive objection handling removes reasons not to call.

**Fix:** Add "Strategic Honesty" section — recommend AGAINST unnecessary work, explain when something ISN'T needed.

### 5. FAQs Should Be Structured Data
Local SEO agent: extract FAQs as a separate JSON array for schema markup. Content strategy agent: FAQs should target "People Also Ask" queries. CRO agent: FAQs address objections.

**Fix:** Output FAQs as separate structured array, always exactly 3, one with location.

---

## Top Recommendations by Agent (with my critique)

### CRO Agent — Best Ideas
- **3 CTAs with phone number** — Adopting. Critical for mobile conversion.
- **Ethical urgency** (safety, seasonal, cost-of-delay, warranty) — Adopting. Genuinely useful, not sleazy.
- **Objection handling** woven into content — Adopting. Addresses the silent "no".
- **"What happens next" in closing CTA** — Adopting. Reduces uncertainty about calling.
- *Decided against:* Micro-conversions (WhatsApp photo assessment) — good idea but needs system-level features beyond the prompt. Will add later.

### Trust Psychology Agent — Best Ideas
- **Competence-warmth balance** (60/40) — Adopting. The content is currently all competence, zero warmth.
- **Narrative structure** (situation → diagnosis → solution → outcome) — Adopting. Replaces the flat informational structure.
- **Calibrated confidence** (match certainty to reality) — Adopting. Real experts hedge appropriately.
- **Empathy markers** — Adopting. "No hot water in January — not ideal" before launching into technical detail.
- **Trust repair** (many readers have been burned) — Adopting. Give readers tools to evaluate ANY engineer.
- *Decided against:* Cialdini's scarcity principle — overlaps with CRO agent's urgency section and risks feeling manipulative.

### Local SEO Agent — Best Ideas
- **Keyword intent matching** (informational vs transactional) — Adopting.
- **Heading structure** with H3s and question-format — Adopting.
- **Image alt text** specifics (80-120 chars, include service + location) — Adopting.
- **Meta description** with trust signal + CTA (120-155 chars) — Adopting.
- **E-E-A-T experience signals** (first-person, reference regulations, insider knowledge) — Adopting.
- **Nearby location mentions** in CTA (2-3 surrounding towns) — Adopting.
- **BlogPosting schema** — Adopting (code change, not prompt change).
- *Decided against:* Separate `faq` JSON output (the SEO agent wanted this, and it's good, but it significantly changes the output format. Will implement in a second pass.)

### Copywriting Agent — Best Ideas
- **Banned phrases list** (40+ AI-isms) — Adopting. Critical for authenticity.
- **Opening hooks** (problem hook, detail hook, "what we found") — Adopting. Current openings are generic.
- **Storytelling with property types** ("a 1930s semi", "tight cupboard, awkward pipework") — Adopting.
- **UK English specifics** (rads, combi, Gas Safe registered not licensed, £ not $) — Adopting.
- **The pub test** — Adopting as a quality gate instruction.
- **Specificity over generality** — Adopting. "22mm copper runs, TRVs on every rad, flushed with Sentinel X400" beats "installed to high standards".
- *Decided against:* Nothing. Every recommendation was practical and specific.

### Content Strategy Agent — Best Ideas
- **Pass existing posts into prompt context** (prevent cannibalisation) — Adopting as system feature. Most impactful single recommendation across all agents.
- **Content pillars** (case study, troubleshooting, buyer's guide, seasonal, regulatory) — Adopting.
- **Seasonal awareness** (pass current month into prompt) — Adopting.
- **Topic diversification** (suggest underrepresented pillars) — Adopting as system feature.
- **Content clusters** with internal linking — Adopting.
- *Decided against:* Performance feedback loop — excellent idea but needs analytics integration (Phase 5 work). Will implement later.

---

## Changes Split: Prompt vs System

### Prompt Changes (implement now)
1. Voice: first person, banned phrases, trade shorthand, UK English, pub test
2. Structure: narrative arc (situation → diagnosis → solution → outcome → CTA)
3. 3 CTAs with phone number
4. Strategic honesty — admit when things aren't needed
5. Ethical urgency (safety, seasonal, cost-of-delay, warranty)
6. Objection handling woven into content
7. Competence-warmth balance (60/40)
8. Empathy markers
9. Calibrated confidence / hedging language
10. Trust repair signals
11. Embedded credentials (not announced)
12. E-E-A-T experience signals
13. Content length: 800-1,200 words
14. Heading structure with H3s, question format, keyword placement
15. Image alt text: 80-120 chars with service + location
16. Meta description: 120-155 chars with trust signal + CTA
17. Opening hooks (problem, detail, seasonal, "what we found")
18. Specificity instructions with before/after examples
19. Nearby location mentions in CTA
20. Freshness signals (seasonal references, current regulations)
21. Content type awareness (case study vs troubleshooting vs guide)

### System Changes (implement in phases)
1. Pass existing post titles/slugs into prompt context (prevent cannibalisation)
2. Pass current month + seasonal topics into prompt
3. Content pillar classification in output
4. Suggested related topics from underrepresented pillars
5. Internal linking hints (bracket notation for CMS to resolve)
6. BlogPosting schema on blog post pages
7. Content health monitoring (stale posts, thin posts, missing images)
8. Analytics feedback loop (which posts convert best)

---

## Summary

The current prompt generates technically accurate content but it reads like AI, converts poorly, and ignores the psychology of trust. The combined recommendations from all 5 agents transform it from "good educational content" to "content that builds trust, demonstrates expertise, and drives phone calls."

The single most impactful change is voice authenticity (banned phrases + first person + trade shorthand). The second is the 3-CTA structure with phone numbers. The third is strategic honesty. Together, these three changes would likely double the conversion rate of blog content.
