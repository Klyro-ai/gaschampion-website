# Phase 3: Blog & Gallery — Design Spec

## Overview

Add blog publishing and image gallery capabilities to Klyro, driven entirely through Telegram. Users send photos or text to @KlyroWebsiteBot, AI generates SEO-optimised blog posts following "They Ask, You Answer" principles, and images flow to both blog and gallery on the Astro site.

## Core Flow

**Photo → Bot → AI → Review → Site**

1. User sends a photo to the bot
2. Bot asks: "Blog Post / Gallery / Both?"
3. Blog: bot asks for job context (what work, what area), AI drafts a full post, user approves/edits/rejects
4. Gallery: image optimised, uploaded to R2, goes live immediately
5. Both: blog draft created + image added to gallery on approval

Text-only blog posts via `/newpost` command (no photo required).

## Telegram Interactions

### Photo Received

```
User: [sends photo]
Bot:  What would you like to do with this?
      [Blog Post]  [Gallery]  [Both]
```

### Blog Post (with photo)

```
User: [taps Blog Post or Both]
Bot:  Tell me about this job:
      • What work was done?
      • What area? (town/village)
      • Anything else to mention?

      Just type it naturally, e.g. "Worcester boiler install,
      Clare, replaced 20 year old system"
User: "New Worcester Greenstar fitted in Haverhill, replaced old back boiler"
Bot:  Drafting your post...
Bot:  [shows AI-generated preview — title, snippet of content, tags]
      [Approve]  [Edit]  [Reject]
```

### Blog Post (text only)

```
User: /newpost
Bot:  What would you like to write about?
      Include the area if relevant.
User: "Common boiler faults and what they mean for homeowners in Suffolk"
Bot:  Drafting your post...
Bot:  [shows preview]
      [Approve]  [Edit]  [Reject]
```

### Edit Flow

```
User: [taps Edit]
Bot:  Send me the updated text, or tell me what to change.
      e.g. "change the title to..." or "add a section about..."
User: "Change title to 'Back Boiler Replacement in Haverhill'"
Bot:  [shows updated preview]
      [Approve]  [Edit]  [Reject]
```

### Post-Approval (if photo was included)

```
Bot:  Published! Also add this photo to your gallery?
      [Yes]  [No]
```

### Gallery Only

```
User: [taps Gallery]
Bot:  Added to your gallery! Want to add a caption?
User: "Worcester Greenstar 4000 installation"
Bot:  Gallery updated with caption.
```

## AI Content Generation

### Provider

- **Primary:** Cloudflare Workers AI (free, zero config)
- **Secondary:** Claude API (switchable, higher quality, minimal cost)
- Both implementations behind a common interface for easy comparison

### System Prompt Context

The AI prompt includes:

- **Business context:** Business name, type of services, base location, service area
- **Content strategy:** "They Ask, You Answer" — educational, transparent, builds trust, answers common customer questions
- **Local SEO:** Location woven into title, headings, and body. Service area keywords. Town/village level only.
- **Tone:** Professional but approachable, knowledgeable local tradesperson
- **AI search optimisation:** Clear structure, authoritative content, FAQ sections where relevant

### Content Rules (hard constraints in the prompt)

- **No customer names** in job posts (reviews are exempt — those names are already public)
- **No addresses** — never include house numbers, street names, or property-identifiable details
- **Location to town/village level only** — e.g. "Clare, Suffolk" not "23 High Street, Clare"
- **No specific prices** — use "contact us for a quote" instead
- **GDPR compliant** — no personal data about customers
- **Always include area** — every post should mention the relevant town/village and county for local SEO

### Output Structure

For each blog post, the AI generates:

- **Title:** Engaging, includes location and service type (under 70 chars)
- **Slug:** URL-friendly version of title
- **Content:** 500-800 words, structured with headings
  - Intro: what was done and where
  - Detail: the work, why it matters, educational context
  - FAQ section (when relevant): answers common customer questions about this type of work
  - CTA: contact prompt
- **Description:** Meta description for search results (under 160 chars)
- **Tags:** Service type, location, equipment brand where relevant
- **Image alt text:** Descriptive, includes location and service context

### Example

Input: "New Worcester Greenstar fitted in Haverhill, replaced old back boiler"

Output:
- **Title:** "New Worcester Boiler Installation in Haverhill — Replacing a 20-Year-Old System"
- **Content:** Covers why old systems need replacing, what a Worcester Greenstar offers, how long installation takes, energy efficiency benefits, common questions about boiler replacement in the Haverhill area
- **Tags:** `boiler-installation`, `worcester`, `haverhill`, `suffolk`

## Data Flow

### Photo Processing

1. Bot receives photo from Telegram (gets highest resolution version)
2. Downloads via Telegram Bot API `getFile`
3. Uploads original to R2 bucket (`klyro-media/{client_id}/originals/{uuid}.jpg`)
4. Image optimizer generates responsive variants (srcset)
5. R2 key stored for use in blog `image_url` and/or `gallery_images` table

### Blog Post Lifecycle

```
photo + caption
    ↓
AI generates draft
    ↓
Stored in blog_posts (status: 'draft')
    ↓
Preview sent to user in Telegram
    ↓
User: Approve → status changes to 'published', published_at set
User: Edit → AI regenerates with edits, new preview
User: Reject → status changes to 'rejected' (kept for reference)
```

### Gallery Image Flow

```
photo received
    ↓
Optimised + uploaded to R2
    ↓
Stored in gallery_images (immediately visible)
    ↓
Optional caption prompt
```

## State Management

Blog draft state stored in KV (same pattern as onboarding wizard):

```
Key: blog_draft:{chatId}
Value: {
  type: 'blog',
  step: 'awaiting_context' | 'generating' | 'preview' | 'editing',
  clientId: string,
  photoR2Key?: string,
  caption?: string,
  draftPostId?: string,
  addToGallery?: boolean
}
```

Gallery state is simpler — stored temporarily during caption prompt:

```
Key: gallery_upload:{chatId}
Value: {
  type: 'gallery',
  clientId: string,
  r2Key: string,
  awaitingCaption: boolean
}
```

## Astro Frontend

### Blog Page (DB-driven)

Switch from static markdown content collection to API-driven:

- **Listing page** (`/blog`): fetches from `/api/gaschampion/blog`, displays cards with title, description, date, featured image
- **Detail page** (`/blog/[slug]`): fetches individual post by slug, renders markdown content with featured image
- SEO meta tags auto-populated from AI-generated description and tags
- Featured images served from R2 with optimised srcset
- Existing static blog posts migrated to DB or kept as fallback

### Gallery Page (new)

- **Grid layout** (`/gallery`): responsive image grid
- **Lightbox:** click to enlarge with caption
- Images served from R2 with optimised srcset
- Alt text displayed for accessibility
- Fetches from `/api/gaschampion/gallery`

Both pages use existing Gas Champion site styling and layout components.

## API Changes

### New Endpoints

```
GET  /api/:clientId/blog/:slug    — single blog post by slug
POST /api/:clientId/blog          — create blog post (internal, from bot)
PUT  /api/:clientId/blog/:id      — update blog post (internal, from bot)
```

### Updated Endpoints

```
GET  /api/:clientId/blog          — add pagination, return total count
GET  /api/:clientId/gallery       — add pagination
```

## New Files

```
workers/src/telegram/client/blog.ts       — blog post conversation handler
workers/src/telegram/client/gallery.ts    — gallery upload handler
workers/src/telegram/client/photo.ts      — photo router (blog/gallery/both)
workers/src/services/ai-writer.ts         — AI content generation (Workers AI + Claude)
workers/src/services/ai-prompts.ts        — system prompts and content rules
src/pages/gallery/index.astro             — gallery page
src/pages/blog/index.astro                — updated to use API
src/pages/blog/[slug].astro               — updated to use API
```

## Existing Infrastructure Used

- **D1 database:** `blog_posts` and `gallery_images` tables already exist with full schema
- **DB layer:** `blogPosts.create()`, `publish()`, `update()`, `getPending()` and `gallery.add()`, `getAll()` already implemented
- **R2 bucket:** `klyro-media` already configured
- **Image optimizer:** already built with srcset generation
- **KV store:** for draft state management (same pattern as wizard)
- **Astro API client:** `getPublishedBlogPosts()` and `getGalleryImages()` already exist in `src/lib/klyro-api.ts`

## Out of Scope

- Scheduled publishing (future enhancement)
- Admin approval queue for other users' posts (only owner posts for now)
- Instagram auto-posting of blog content
- Review-to-blog-post feature (future — would convert a great review into a testimonial blog post)
- Video support
