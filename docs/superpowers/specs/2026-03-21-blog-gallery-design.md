# Phase 3: Blog & Gallery — Design Spec

## Overview

Add blog publishing and image gallery capabilities to Klyro, driven entirely through Telegram. Users send photos or text to @KlyroWebsiteBot, AI generates SEO-optimised blog posts following "They Ask, You Answer" principles, and images flow to both blog and gallery on the Astro site.

## Core Flow

**Photo → Bot → AI → Review → Site**

1. User sends a photo to the bot
2. Bot asks: "Blog Post / Gallery / Both?"
3. Blog: bot asks for job context (what work, what area), AI drafts a full post, user approves/edits/rejects
4. Gallery: image optimised, uploaded to R2, goes live immediately
5. Both: blog draft created + image added to gallery automatically on blog approval
6. Text-only blog posts via `/newpost` command (no photo required)

## Telegram Interactions

### Photo Received

```
User: [sends photo]
Bot:  What would you like to do with this?
      [Blog Post]  [Gallery]  [Both]
```

### Blog Post (with photo)

```
User: [taps Blog Post]
Bot:  Tell me about this job:
      • What work was done?
      • What area? (town/village)
      • Anything else to mention?

      Just type it naturally, e.g. "Worcester boiler install,
      Clare, replaced 20 year old system"
User: "New Worcester Greenstar fitted in Haverhill, replaced old back boiler"
Bot:  Drafting your post...
Bot:  [shows AI-generated preview — title, description, tags]
      [Approve]  [Edit]  [Reject]
```

### "Both" Flow

Same as Blog Post flow above. On approval, image is automatically added to gallery — no extra prompt.

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

### Post-Approval (Blog Post only, if photo was included)

```
Bot:  Published! Also add this photo to your gallery?
      [Yes]  [No]
```

Note: This prompt only appears for "Blog Post" choice. "Both" adds to gallery automatically.

### Gallery Only

```
User: [taps Gallery]
Bot:  Added to your gallery! Want to add a caption?
      [Skip]
User: "Worcester Greenstar 4000 installation"
Bot:  Gallery updated with caption.
```

Caption prompt has a Skip button and expires after 1 hour (KV TTL). Next photo sent clears any pending caption state.

## AI Content Generation

### Provider

- **Primary:** Cloudflare Workers AI (free, zero config, requires `[ai]` binding in wrangler.toml)
- **Secondary:** Claude API (switchable via `CLAUDE_API_KEY` secret, higher quality, minimal cost)
- Both implementations behind a common `AiWriter` interface for easy comparison

### System Prompt Context

The AI prompt includes:

- **Business context:** Business name, type of services, base location, service area (loaded from client DB record)
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

The AI returns structured JSON with:

- **title:** Engaging, includes location and service type (under 70 chars)
- **slug:** URL-friendly version of title (collision handling: append `-2`, `-3` etc. if slug exists)
- **content:** 500-800 words markdown, structured with headings
  - Intro: what was done and where
  - Detail: the work, why it matters, educational context
  - FAQ section (when relevant): answers common customer questions about this type of work
  - CTA: contact prompt
- **description:** Meta description for search results (under 160 chars)
- **tags:** Service type, location, equipment brand where relevant (JSON array)
- **image_alt_text:** Descriptive, includes location and service context

### Example

Input: "New Worcester Greenstar fitted in Haverhill, replaced old back boiler"

Output:
- **Title:** "New Worcester Boiler Installation in Haverhill — Replacing a 20-Year-Old System"
- **Content:** Covers why old systems need replacing, what a Worcester Greenstar offers, how long installation takes, energy efficiency benefits, common questions about boiler replacement in the Haverhill area
- **Tags:** `boiler-installation`, `worcester`, `haverhill`, `suffolk`

### Error Handling

- AI generation has a 30-second timeout
- On failure: "Sorry, I couldn't generate a draft right now. Try again or use /newpost to write manually."
- If primary provider (Workers AI) fails, does NOT auto-fallback to Claude (avoids surprise costs) — user can switch provider manually via admin setting

### Preview Format

Blog previews are truncated for Telegram's 4096-char limit:
- Title (bold)
- Description
- First 2-3 paragraphs of content
- Tags
- "Full post will be ~X words"

Full content is stored in the draft and published as-is on approval.

## Data Flow

### Photo Processing

1. Bot receives photo from Telegram (gets highest resolution version via `photo[-1].file_id`)
2. New `getFile(fileId)` method on TelegramBot helper returns file URL
3. Downloads file bytes from Telegram CDN
4. Strips EXIF data (GPS, camera info) for GDPR compliance before storage
5. Uploads to R2 bucket using existing image optimizer path convention: `{r2_bucket_prefix}{category}/{imageId}-{width}.{format}`
6. Generates responsive variants (srcset) via image optimizer
7. R2 key stored for use in blog `image_url` and/or `gallery_images` table

### Blog Post Lifecycle

```
photo + caption
    ↓
AI generates draft (structured JSON)
    ↓
Stored in blog_posts (status: 'draft')
    ↓
Truncated preview sent to user in Telegram
    ↓
User: Approve → status changes to 'published', published_at set
User: Edit → AI regenerates with edits, new preview, draft updated
User: Reject → draft deleted from blog_posts
```

### Gallery Image Flow

```
photo received
    ↓
EXIF stripped, optimised, uploaded to R2
    ↓
Stored in gallery_images (immediately visible)
    ↓
Optional caption prompt (1hr TTL, Skip button)
```

## State Management

Extend existing `WizardManager` with new types. Add `'blog' | 'gallery_caption'` to the `WizardState.type` union in `types.ts`.

Blog draft state:

```typescript
// WizardState when type === 'blog'
{
  type: 'blog',
  step: 'awaiting_context' | 'generating' | 'preview' | 'editing',
  clientId: string,
  photoR2Key?: string,        // R2 key of uploaded photo
  photoFileId?: string,       // Telegram file ID (before upload)
  caption?: string,           // User's job description
  draftPostId?: string,       // blog_posts.id of the draft
  addToGallery?: boolean,     // true if "Both" was selected
  imageAltText?: string       // AI-generated alt text
}
```

Gallery caption state:

```typescript
// WizardState when type === 'gallery_caption'
{
  type: 'gallery_caption',
  step: 'awaiting_caption',
  clientId: string,
  galleryImageId: string      // gallery_images.id
}
```

Conflict handling: if user sends a photo while mid-blog-draft, bot asks "You have a draft in progress. Discard it? [Yes / No]". Gallery caption state is overwritten silently (new photo takes priority).

## Prerequisites

### New Env Bindings

```toml
# wrangler.toml
[ai]
binding = "AI"
```

New secret (only if using Claude as secondary provider):
```
wrangler secret put CLAUDE_API_KEY
```

### Type Updates

```typescript
// types.ts — extend Env
interface Env {
  // ... existing bindings
  AI: Ai;                    // Cloudflare Workers AI
  CLAUDE_API_KEY?: string;   // Optional, for Claude provider
}

// types.ts — extend BlogPost status
status: 'draft' | 'pending_approval' | 'published';
// Rejected drafts are deleted, not status-tracked

// types.ts — add image_alt_text to BlogPost
image_alt_text?: string;
```

### DB Migration

```sql
-- 0003_blog_alt_text.sql
ALTER TABLE blog_posts ADD COLUMN image_alt_text TEXT;
```

### TelegramBot Helper

Add new methods:
- `getFile(fileId: string)` — returns file path from Telegram
- `getFileUrl(filePath: string)` — constructs download URL
- `sendPhoto(chatId, photoUrl, caption?, replyMarkup?)` — for previews with images

## Webhook Routing Update

The client webhook handler needs a new routing path for photos. Order of checks:

```
1. callback_query → handle callbacks (existing + new blog/gallery callbacks)
2. message.photo → route to photo handler (NEW)
3. wizard state 'blog' or 'gallery_caption' → handle blog/gallery steps (NEW)
4. wizard state 'onboarding' → handle onboarding (existing)
5. text commands (/reviews, /connect, /status, /help, /newpost) → existing + new
6. authorized user fallback → help message
7. unknown user → "Contact your Klyro admin"
```

## Astro Frontend

### Blog Page (DB-driven)

Switch from static markdown content collection to API-driven:

- **Listing page** (`/blog`): fetches from `/api/gaschampion/blog`, displays cards with title, description, date, featured image
- **Detail page** (`/blog/[slug]`): fetches individual post by slug, renders markdown content with featured image
- SEO meta tags auto-populated from AI-generated description and tags
- Featured images served from R2 with optimised srcset
- Existing static blog posts migrated to DB (one-time migration script)

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
```

Blog creation and updates happen internally from the bot handlers (direct DB calls), not via API endpoints.

### Updated Endpoints

```
GET  /api/:clientId/blog          — add ?page=1&limit=10, return { posts, total }
GET  /api/:clientId/gallery       — add ?page=1&limit=20, return { images, total }
```

## New Files

```
workers/src/telegram/client/photo.ts      — photo router (blog/gallery/both decision)
workers/src/telegram/client/blog.ts       — blog post conversation handler
workers/src/telegram/client/gallery.ts    — gallery upload handler
workers/src/services/ai-writer.ts         — AiWriter interface + Workers AI + Claude implementations
workers/src/services/ai-prompts.ts        — system prompts, content rules, structured output schema
workers/migrations/0003_blog_alt_text.sql — add image_alt_text column
src/pages/gallery/index.astro             — gallery page
```

Updated files:
```
workers/src/types.ts                      — extend Env, WizardState, BlogPost
workers/src/telegram/bot.ts               — add getFile, getFileUrl, sendPhoto
workers/src/api/index.ts                  — photo routing, /newpost command, pagination
workers/wrangler.toml                     — add [ai] binding
src/pages/blog/index.astro                — switch to API-driven
src/pages/blog/[...slug].astro            — switch to API-driven
```

## Existing Infrastructure Used

- **D1 database:** `blog_posts` and `gallery_images` tables already exist with full schema
- **DB layer:** `blogPosts.create()`, `publish()`, `update()`, `getPending()` and `gallery.add()`, `getAll()` already implemented
- **R2 bucket:** `klyro-media` already configured
- **Image optimizer:** already built with srcset generation
- **KV store:** via existing WizardManager (extended with new types)
- **Astro API client:** `getPublishedBlogPosts()` and `getGalleryImages()` already exist in `src/lib/klyro-api.ts`

## Out of Scope

- Scheduled publishing (future enhancement)
- Admin approval queue for other users' posts (only owner posts for now)
- Instagram auto-posting of blog content
- Review-to-blog-post feature (future — would convert a great review into a testimonial blog post)
- Video support
