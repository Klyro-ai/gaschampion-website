# Phase 3: Blog & Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable blog publishing and image gallery via Telegram — photo + caption → AI-drafted SEO blog post → approve → live on site.

**Architecture:** Photos sent to @KlyroWebsiteBot get routed to blog or gallery. Blog posts are AI-generated from user context using Cloudflare Workers AI (with Claude as switchable secondary), previewed in Telegram, and published to the Astro site via D1. Gallery images go live immediately. All built on existing Cloudflare infrastructure (D1, R2, KV, Workers).

**Tech Stack:** Cloudflare Workers (Hono), Workers AI, D1, R2, KV, Telegram Bot API, Astro

**Spec:** `docs/superpowers/specs/2026-03-21-blog-gallery-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `workers/src/telegram/client/photo.ts` | Photo router — receives photo, asks Blog/Gallery/Both, uploads to R2 |
| `workers/src/telegram/client/blog.ts` | Blog conversation handler — context prompt, AI draft, preview, approve/edit/reject |
| `workers/src/telegram/client/gallery.ts` | Gallery upload handler — stores image, optional caption |
| `workers/src/services/ai-writer.ts` | AiWriter interface + WorkersAiWriter + ClaudeAiWriter implementations |
| `workers/src/services/ai-prompts.ts` | System prompt builder, content rules, output schema |
| `workers/migrations/0003_blog_alt_text.sql` | Add image_alt_text column to blog_posts |
| `workers/test/telegram/photo.test.ts` | Photo handler tests |
| `workers/test/telegram/blog.test.ts` | Blog handler tests |
| `workers/test/telegram/gallery.test.ts` | Gallery handler tests |
| `workers/test/services/ai-writer.test.ts` | AI writer tests |
| `src/pages/gallery/index.astro` | Gallery page |

### Modified Files
| File | Changes |
|------|---------|
| `workers/src/types.ts` | Add `AI` + `CLAUDE_API_KEY` to Env, extend WizardState type union, add `image_alt_text` to BlogPost, add `photo` to TelegramUpdate message |
| `workers/src/telegram/bot.ts` | Add `getFile()`, `getFileUrl()`, `sendPhoto()`, `deleteMessage()` methods |
| `workers/src/telegram/wizard.ts` | No changes needed — generic enough already |
| `workers/src/db/client.ts` | Add `blogPosts.getBySlug()`, `blogPosts.delete()`, update `blogPosts.update()` to accept `image_url`/`image_alt_text`, add `gallery.updateCaption()` |
| `workers/src/api/index.ts` | Add photo routing, blog/gallery wizard handling, `/newpost` command, `GET /api/:clientId/blog/:slug`, pagination |
| `workers/wrangler.toml` | Add `[ai]` binding |
| `src/pages/blog/index.astro` | Switch from content collection to API-driven |
| `src/pages/blog/[...slug].astro` | Switch from content collection to API-driven |
| `src/lib/klyro-api.ts` | Add `getBlogPostBySlug()`, add pagination params |

---

## Task 1: Prerequisites — Types, Config, Migration

**Files:**
- Modify: `workers/src/types.ts:1-142`
- Modify: `workers/wrangler.toml:1-41`
- Create: `workers/migrations/0003_blog_alt_text.sql`

- [ ] **Step 1: Update types.ts — extend Env interface**

Add `AI` and `CLAUDE_API_KEY` to the Env interface (after line 14):

```typescript
AI: Ai;
CLAUDE_API_KEY?: string;
```

- [ ] **Step 2: Update types.ts — extend WizardState type union**

Change line 128 from:
```typescript
type: 'addclient' | 'onboarding';
```
to:
```typescript
type: 'addclient' | 'onboarding' | 'blog' | 'gallery_caption';
```

- [ ] **Step 3: Update types.ts — add image_alt_text to BlogPost**

Add after `image_url` (line 73):
```typescript
image_alt_text: string | null;
```

- [ ] **Step 3b: Update types.ts — add photo to TelegramUpdate**

Add `photo` to the `message` type in `TelegramUpdate` (line 109):
```typescript
photo?: Array<{ file_id: string; width: number; height: number }>;
```

- [ ] **Step 4: Add [ai] binding to wrangler.toml**

Add at end of file:
```toml
[ai]
binding = "AI"
```

- [ ] **Step 5: Create migration file**

Create `workers/migrations/0003_blog_alt_text.sql`:
```sql
ALTER TABLE blog_posts ADD COLUMN image_alt_text TEXT;
```

- [ ] **Step 6: Run migration on remote DB**

```bash
npx wrangler d1 execute klyro-db --remote --file=workers/migrations/0003_blog_alt_text.sql
```

- [ ] **Step 7: Commit**

```bash
git add workers/src/types.ts workers/wrangler.toml workers/migrations/0003_blog_alt_text.sql
git commit -m "feat: Phase 3 prerequisites — types, AI binding, migration"
```

---

## Task 2: TelegramBot Helper — New Methods

**Files:**
- Modify: `workers/src/telegram/bot.ts:1-64`
- Test: `workers/test/telegram/bot.test.ts`

- [ ] **Step 1: Write failing tests for getFile and getFileUrl**

Add to `workers/test/telegram/bot.test.ts`:

```typescript
describe('getFile', () => {
  it('calls getFile API and returns file path', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, result: { file_path: 'photos/file_123.jpg' } }))
    );
    const bot = new TelegramBot('test-token', mockFetch);
    const result = await bot.getFile('file-id-abc');
    expect(result).toBe('photos/file_123.jpg');
    expect(mockFetch).toHaveBeenCalledOnce();
    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain('/getFile');
  });
});

describe('getFileUrl', () => {
  it('constructs download URL from file path', () => {
    const bot = new TelegramBot('test-token');
    const url = bot.getFileUrl('photos/file_123.jpg');
    expect(url).toBe('https://api.telegram.org/file/bottest-token/photos/file_123.jpg');
  });
});

describe('sendPhoto', () => {
  it('calls sendPhoto API with photo URL and caption', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, result: { message_id: 42 } }))
    );
    const bot = new TelegramBot('test-token', mockFetch);
    const result = await bot.sendPhoto(12345, 'https://example.com/photo.jpg', 'A caption');
    expect(result.message_id).toBe(42);
    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain('/sendPhoto');
  });
});

describe('deleteMessage', () => {
  it('calls deleteMessage API', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, result: true }))
    );
    const bot = new TelegramBot('test-token', mockFetch);
    await bot.deleteMessage(12345, 99);
    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain('/deleteMessage');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd workers && npx vitest run test/telegram/bot.test.ts
```
Expected: FAIL — `getFile`, `getFileUrl`, `sendPhoto`, `deleteMessage` not found

- [ ] **Step 3: Implement new methods on TelegramBot**

Add to `workers/src/telegram/bot.ts` inside the class, after `editMessage`:

```typescript
async getFile(fileId: string): Promise<string> {
  const data = await this.call('getFile', { file_id: fileId });
  return data.file_path; // call() already unwraps .result
}

getFileUrl(filePath: string): string {
  return `https://api.telegram.org/file/bot${this.token}/${filePath}`;
}

async sendPhoto(
  chatId: number | string,
  photo: string,
  caption?: string,
  replyMarkup?: Record<string, unknown>
): Promise<{ message_id: number }> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    photo,
    parse_mode: 'HTML',
  };
  if (caption) body.caption = caption;
  if (replyMarkup) body.reply_markup = replyMarkup;
  const data = await this.call('sendPhoto', body);
  return { message_id: data.message_id }; // call() already unwraps .result
}

async deleteMessage(chatId: number | string, messageId: number): Promise<void> {
  await this.call('deleteMessage', { chat_id: chatId, message_id: messageId });
}
```

Note: `this.token` needs to be accessible. Currently the constructor stores the token but the `call` method constructs the URL inline. Make the token available as `private token: string` on line 5 if not already.

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd workers && npx vitest run test/telegram/bot.test.ts
```
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add workers/src/telegram/bot.ts workers/test/telegram/bot.test.ts
git commit -m "feat: add getFile, sendPhoto, deleteMessage to TelegramBot"
```

---

## Task 3: DB Layer — New Blog & Gallery Methods

**Files:**
- Modify: `workers/src/db/client.ts:114-217`
- Test: `workers/test/db/client.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `workers/test/db/client.test.ts`:

```typescript
describe('blogPosts.getBySlug', () => {
  it('returns a published blog post by slug', async () => {
    const db = forClient(env.DB, 'testclient');
    const id = await db.blogPosts.create({
      title: 'Test Post', slug: 'test-post', content: 'Content here',
      description: 'A test', tags: '["test"]', status: 'published',
      image_url: null, image_alt_text: null, scheduled_publish_at: null,
    });
    await db.blogPosts.publish(id);
    const post = await db.blogPosts.getBySlug('test-post');
    expect(post).not.toBeNull();
    expect(post!.title).toBe('Test Post');
  });

  it('returns null for non-existent slug', async () => {
    const db = forClient(env.DB, 'testclient');
    const post = await db.blogPosts.getBySlug('nope');
    expect(post).toBeNull();
  });
});

describe('blogPosts.delete', () => {
  it('deletes a blog post by id', async () => {
    const db = forClient(env.DB, 'testclient');
    const id = await db.blogPosts.create({
      title: 'Delete Me', slug: 'delete-me', content: 'Gone',
      description: null, tags: null, status: 'draft',
      image_url: null, image_alt_text: null, scheduled_publish_at: null,
    });
    await db.blogPosts.delete(id);
    const post = await db.blogPosts.getBySlug('delete-me');
    expect(post).toBeNull();
  });
});

describe('gallery.updateCaption', () => {
  it('updates caption and alt_text on a gallery image', async () => {
    const db = forClient(env.DB, 'testclient');
    const id = await db.gallery.add({
      r2_key: 'test/img.jpg', alt_text: null, caption: null,
      width: 800, height: 600, srcset: null, source: 'upload',
      instagram_post_id: null,
    });
    await db.gallery.updateCaption(id, 'New caption', 'Alt text here');
    const images = await db.gallery.getAll();
    const img = images.find((i: any) => i.id === id);
    expect(img!.caption).toBe('New caption');
    expect(img!.alt_text).toBe('Alt text here');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd workers && npx vitest run test/db/client.test.ts
```

- [ ] **Step 3: Implement new methods**

Add to `workers/src/db/client.ts` inside the `blogPosts` object:

```typescript
async getBySlug(slug: string): Promise<BlogPost | null> {
  return await db.prepare(
    'SELECT * FROM blog_posts WHERE client_id = ? AND slug = ?'
  ).bind(clientId, slug).first<BlogPost>();
},

async delete(postId: string): Promise<void> {
  await db.prepare(
    'DELETE FROM blog_posts WHERE id = ? AND client_id = ?'
  ).bind(postId, clientId).run();
},
```

Update the existing `create` method signature to accept `status` and `image_alt_text`:
- Add `status` and `image_alt_text` to the method's parameter type
- Add both to the INSERT columns and bind values
- The blog flow creates posts with `status: 'draft'` then publishes via `publish()`

Update the existing `update` method to accept `image_url` and `image_alt_text`:
- Add these to the dynamic SET fields

Add to the `gallery` object:

```typescript
async updateCaption(imageId: string, caption: string, altText?: string): Promise<void> {
  if (altText) {
    await db.prepare(
      'UPDATE gallery_images SET caption = ?, alt_text = ? WHERE id = ? AND client_id = ?'
    ).bind(caption, altText, imageId, clientId).run();
  } else {
    await db.prepare(
      'UPDATE gallery_images SET caption = ? WHERE id = ? AND client_id = ?'
    ).bind(caption, imageId, clientId).run();
  }
},
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd workers && npx vitest run test/db/client.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add workers/src/db/client.ts workers/test/db/client.test.ts
git commit -m "feat: add getBySlug, delete, updateCaption to DB layer"
```

---

## Task 4: AI Writer — Prompts and Generation Interface

**Files:**
- Create: `workers/src/services/ai-prompts.ts`
- Create: `workers/src/services/ai-writer.ts`
- Create: `workers/test/services/ai-writer.test.ts`

- [ ] **Step 1: Create ai-prompts.ts — system prompt and output schema**

```typescript
// workers/src/services/ai-prompts.ts

export interface BlogDraftInput {
  businessName: string;
  serviceArea: string;
  caption: string;
  hasPhoto: boolean;
}

export interface BlogDraftOutput {
  title: string;
  slug: string;
  content: string;
  description: string;
  tags: string[];
  image_alt_text: string | null;
}

export function buildBlogPrompt(input: BlogDraftInput): string {
  return `You are a professional content writer for "${input.businessName}", a gas and heating engineer based in ${input.serviceArea}.

CONTENT STRATEGY — "They Ask, You Answer":
Write educational, transparent content that builds trust. Address common customer questions about this type of work. Be the most helpful, honest source of information.

LOCAL SEO REQUIREMENTS:
- Include the town/village and county in the title and naturally throughout the content
- Use service-specific keywords in headings
- Include an FAQ section with 2-3 common customer questions when relevant

TONE:
Professional but approachable. Written as a knowledgeable local tradesperson who genuinely wants to help.

HARD RULES — NEVER BREAK THESE:
- NO customer names — never mention who the work was done for
- NO addresses — never include house numbers, street names, or property-identifiable details
- Location to TOWN/VILLAGE level only (e.g. "Clare, Suffolk" not "23 High Street")
- NO specific prices — say "contact us for a quote" instead
- GDPR compliant — no personal data about customers

STRUCTURE:
1. Engaging title with location and service type (under 70 characters)
2. Opening paragraph — what was done and where (town level only)
3. Detail section — the work, why it matters, educational context
4. FAQ section (2-3 questions customers commonly ask about this service)
5. Call to action — "Contact ${input.businessName} for..."

OUTPUT FORMAT — respond with ONLY valid JSON, no markdown fences:
{
  "title": "string — under 70 chars, includes location",
  "slug": "string — URL-friendly lowercase with hyphens",
  "content": "string — 500-800 words markdown with ## headings",
  "description": "string — meta description under 160 chars",
  "tags": ["string array — service type, location, brand"],
  "image_alt_text": ${input.hasPhoto ? '"string — descriptive alt text for the photo"' : 'null'}
}

USER INPUT: "${input.caption}"`;
}

export function buildEditPrompt(existingContent: string, editInstruction: string): string {
  return `You are editing a blog post. Apply the following change and return the COMPLETE updated post in the same JSON format.

CURRENT POST:
${existingContent}

REQUESTED CHANGE: "${editInstruction}"

Apply the change. Keep all the same rules (no customer names, no addresses, local SEO, etc). Return ONLY valid JSON with the same fields: title, slug, content, description, tags, image_alt_text.`;
}
```

- [ ] **Step 2: Write failing tests for AI writer**

Create `workers/test/services/ai-writer.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildBlogPrompt, buildEditPrompt } from '../../src/services/ai-prompts';
import { parseDraftResponse } from '../../src/services/ai-writer';

describe('buildBlogPrompt', () => {
  it('includes business name and caption in prompt', () => {
    const prompt = buildBlogPrompt({
      businessName: 'Gas Champion Ltd',
      serviceArea: 'Haverhill, Suffolk',
      caption: 'New boiler fitted in Clare',
      hasPhoto: true,
    });
    expect(prompt).toContain('Gas Champion Ltd');
    expect(prompt).toContain('Haverhill, Suffolk');
    expect(prompt).toContain('New boiler fitted in Clare');
    expect(prompt).toContain('They Ask, You Answer');
    expect(prompt).toContain('NO customer names');
  });

  it('sets image_alt_text to null when no photo', () => {
    const prompt = buildBlogPrompt({
      businessName: 'Test',
      serviceArea: 'London',
      caption: 'test',
      hasPhoto: false,
    });
    expect(prompt).toContain('"image_alt_text": null');
  });
});

describe('parseDraftResponse', () => {
  it('parses valid JSON response', () => {
    const json = JSON.stringify({
      title: 'Test Title',
      slug: 'test-title',
      content: '## Heading\nContent here',
      description: 'A test post',
      tags: ['test', 'suffolk'],
      image_alt_text: 'A boiler',
    });
    const result = parseDraftResponse(json);
    expect(result.title).toBe('Test Title');
    expect(result.tags).toEqual(['test', 'suffolk']);
  });

  it('handles JSON wrapped in markdown fences', () => {
    const json = '```json\n{"title":"Test","slug":"test","content":"c","description":"d","tags":[],"image_alt_text":null}\n```';
    const result = parseDraftResponse(json);
    expect(result.title).toBe('Test');
  });

  it('throws on invalid response', () => {
    expect(() => parseDraftResponse('not json at all')).toThrow();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd workers && npx vitest run test/services/ai-writer.test.ts
```

- [ ] **Step 4: Create ai-writer.ts**

```typescript
// workers/src/services/ai-writer.ts

import type { BlogDraftOutput, BlogDraftInput } from './ai-prompts';
import { buildBlogPrompt, buildEditPrompt } from './ai-prompts';

export interface AiWriter {
  generateDraft(input: BlogDraftInput): Promise<BlogDraftOutput>;
  editDraft(existingContent: string, editInstruction: string): Promise<BlogDraftOutput>;
}

export function parseDraftResponse(raw: string): BlogDraftOutput {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(cleaned);

  if (!parsed.title || !parsed.slug || !parsed.content || !parsed.description) {
    throw new Error('AI response missing required fields');
  }

  return {
    title: parsed.title,
    slug: parsed.slug,
    content: parsed.content,
    description: parsed.description,
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    image_alt_text: parsed.image_alt_text ?? null,
  };
}

export class WorkersAiWriter implements AiWriter {
  constructor(private ai: Ai) {}

  async generateDraft(input: BlogDraftInput): Promise<BlogDraftOutput> {
    const prompt = buildBlogPrompt(input);
    const response = await this.ai.run('@cf/meta/llama-3.1-70b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    }) as { response?: string };

    if (!response.response) throw new Error('Workers AI returned empty response');
    return parseDraftResponse(response.response);
  }

  async editDraft(existingContent: string, editInstruction: string): Promise<BlogDraftOutput> {
    const prompt = buildEditPrompt(existingContent, editInstruction);
    const response = await this.ai.run('@cf/meta/llama-3.1-70b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    }) as { response?: string };

    if (!response.response) throw new Error('Workers AI returned empty response');
    return parseDraftResponse(response.response);
  }
}

export class ClaudeAiWriter implements AiWriter {
  constructor(private apiKey: string, private fetchFn: typeof fetch = fetch) {}

  async generateDraft(input: BlogDraftInput): Promise<BlogDraftOutput> {
    const prompt = buildBlogPrompt(input);
    const response = await this.callClaude(prompt);
    return parseDraftResponse(response);
  }

  async editDraft(existingContent: string, editInstruction: string): Promise<BlogDraftOutput> {
    const prompt = buildEditPrompt(existingContent, editInstruction);
    const response = await this.callClaude(prompt);
    return parseDraftResponse(response);
  }

  private async callClaude(prompt: string): Promise<string> {
    const res = await this.fetchFn('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
    const data = await res.json() as { content: Array<{ text: string }> };
    return data.content[0].text;
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd workers && npx vitest run test/services/ai-writer.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add workers/src/services/ai-prompts.ts workers/src/services/ai-writer.ts workers/test/services/ai-writer.test.ts
git commit -m "feat: AI writer with Workers AI and Claude implementations"
```

---

## Task 5: Photo Handler — Upload and Route

**Files:**
- Create: `workers/src/telegram/client/photo.ts`
- Create: `workers/test/telegram/photo.test.ts`

- [ ] **Step 1: Write failing tests**

Create `workers/test/telegram/photo.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { handlePhotoReceived, handlePhotoChoice } from '../../src/telegram/client/photo';

describe('handlePhotoReceived', () => {
  it('sends blog/gallery/both buttons', async () => {
    const bot = { sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }) };
    await handlePhotoReceived(bot as any, 123, 'file-id-abc');
    expect(bot.sendMessage).toHaveBeenCalledOnce();
    const [chatId, text, markup] = bot.sendMessage.mock.calls[0];
    expect(chatId).toBe(123);
    expect(text).toContain('What would you like to do');
    expect(markup.inline_keyboard).toHaveLength(1);
    expect(markup.inline_keyboard[0]).toHaveLength(3);
  });
});

describe('handlePhotoChoice', () => {
  it('starts blog wizard for blog choice', async () => {
    const wizard = {
      get: vi.fn().mockResolvedValue(null),
      start: vi.fn().mockResolvedValue(undefined),
    };
    const bot = { sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }) };
    await handlePhotoChoice(bot as any, 123, 'photo:blog:file-id', wizard as any, 'client1');
    expect(wizard.start).toHaveBeenCalledWith(123, 'blog', 'awaiting_context', 'client1');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd workers && npx vitest run test/telegram/photo.test.ts
```

- [ ] **Step 3: Implement photo handler**

Create `workers/src/telegram/client/photo.ts`:

```typescript
import type { TelegramBot } from '../bot';
import type { WizardManager } from '../wizard';

export async function handlePhotoReceived(
  bot: TelegramBot,
  chatId: number,
  fileId: string,
): Promise<void> {
  await bot.sendMessage(chatId, 'What would you like to do with this?', {
    inline_keyboard: [[
      { text: '📝 Blog Post', callback_data: `photo:blog:${fileId}` },
      { text: '🖼 Gallery', callback_data: `photo:gallery:${fileId}` },
      { text: '📝+🖼 Both', callback_data: `photo:both:${fileId}` },
    ]],
  });
}

export async function handlePhotoChoice(
  bot: TelegramBot,
  chatId: number,
  callbackData: string,
  wizard: WizardManager,
  clientId: string,
): Promise<void> {
  const parts = callbackData.split(':');
  const choice = parts[1]; // 'blog' | 'gallery' | 'both'
  const fileId = parts.slice(2).join(':');

  if (choice === 'gallery') {
    // Gallery flow handled separately
    return;
  }

  // Blog or Both — start blog wizard
  const addToGallery = choice === 'both';
  await wizard.start(chatId, 'blog', 'awaiting_context', clientId);

  // Store file ID in wizard data for later upload
  await wizard.update(chatId, 'awaiting_context', {
    photoFileId: fileId,
    addToGallery: addToGallery ? 'true' : 'false',
  });

  await bot.sendMessage(
    chatId,
    'Tell me about this job:\n' +
    '• What work was done?\n' +
    '• What area? (town/village)\n' +
    '• Anything else to mention?\n\n' +
    'Just type it naturally, e.g. "Worcester boiler install, Clare, replaced 20 year old system"'
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd workers && npx vitest run test/telegram/photo.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add workers/src/telegram/client/photo.ts workers/test/telegram/photo.test.ts
git commit -m "feat: photo handler — route photos to blog/gallery/both"
```

---

## Task 6: Gallery Handler

**Files:**
- Create: `workers/src/telegram/client/gallery.ts`
- Create: `workers/test/telegram/gallery.test.ts`

- [ ] **Step 1: Write failing tests**

Create `workers/test/telegram/gallery.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { handleGalleryUpload, handleGalleryCaption } from '../../src/telegram/client/gallery';

describe('handleGalleryUpload', () => {
  it('adds image to gallery and asks for caption', async () => {
    const bot = {
      getFile: vi.fn().mockResolvedValue('photos/test.jpg'),
      getFileUrl: vi.fn().mockReturnValue('https://cdn.telegram.org/file/botTOKEN/photos/test.jpg'),
      sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }),
    };
    const deps = {
      downloadAndStore: vi.fn().mockResolvedValue({ r2Key: 'gc/gallery/abc-0.original', galleryId: 'gal-1' }),
    };
    const wizard = { start: vi.fn().mockResolvedValue(undefined) };

    await handleGalleryUpload(bot as any, 123, 'file-id', wizard as any, 'client1', deps);
    expect(deps.downloadAndStore).toHaveBeenCalled();
    expect(bot.sendMessage).toHaveBeenCalled();
    expect(wizard.start).toHaveBeenCalledWith(123, 'gallery_caption', 'awaiting_caption', 'client1');
  });
});

describe('handleGalleryCaption', () => {
  it('updates caption and clears wizard', async () => {
    const bot = { sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }) };
    const deps = {
      updateCaption: vi.fn().mockResolvedValue(undefined),
    };
    const wizard = {
      get: vi.fn().mockResolvedValue({
        type: 'gallery_caption', step: 'awaiting_caption',
        clientId: 'client1', data: { galleryImageId: 'gal-1' },
      }),
      clear: vi.fn().mockResolvedValue(undefined),
    };

    await handleGalleryCaption(bot as any, 123, 'A nice boiler', wizard as any, deps);
    expect(deps.updateCaption).toHaveBeenCalledWith('gal-1', 'A nice boiler');
    expect(wizard.clear).toHaveBeenCalledWith(123);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd workers && npx vitest run test/telegram/gallery.test.ts
```

- [ ] **Step 3: Implement gallery handler**

Create `workers/src/telegram/client/gallery.ts`:

```typescript
import type { TelegramBot } from '../bot';
import type { WizardManager } from '../wizard';

interface GalleryUploadDeps {
  downloadAndStore: (fileId: string, clientId: string) => Promise<{ r2Key: string; galleryId: string }>;
}

interface GalleryCaptionDeps {
  updateCaption: (galleryImageId: string, caption: string) => Promise<void>;
}

export async function handleGalleryUpload(
  bot: TelegramBot,
  chatId: number,
  fileId: string,
  wizard: WizardManager,
  clientId: string,
  deps: GalleryUploadDeps,
): Promise<void> {
  const { galleryId } = await deps.downloadAndStore(fileId, clientId);

  await wizard.start(chatId, 'gallery_caption', 'awaiting_caption', clientId);
  await wizard.update(chatId, 'awaiting_caption', { galleryImageId: galleryId });

  await bot.sendMessage(chatId, 'Added to your gallery! Want to add a caption?', {
    inline_keyboard: [[{ text: 'Skip', callback_data: 'gallery:skip_caption' }]],
  });
}

export async function handleGalleryCaption(
  bot: TelegramBot,
  chatId: number,
  text: string,
  wizard: WizardManager,
  deps: GalleryCaptionDeps,
): Promise<void> {
  const state = await wizard.get(chatId);
  if (!state || state.type !== 'gallery_caption') return;

  const galleryImageId = state.data.galleryImageId;
  await deps.updateCaption(galleryImageId, text);
  await wizard.clear(chatId);
  await bot.sendMessage(chatId, 'Gallery updated with caption.');
}

export async function handleGallerySkip(
  bot: TelegramBot,
  chatId: number,
  wizard: WizardManager,
): Promise<void> {
  await wizard.clear(chatId);
  await bot.sendMessage(chatId, 'Gallery image saved.');
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd workers && npx vitest run test/telegram/gallery.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add workers/src/telegram/client/gallery.ts workers/test/telegram/gallery.test.ts
git commit -m "feat: gallery handler — upload, caption, skip"
```

---

## Task 7: Blog Handler — Draft, Preview, Approve/Edit/Reject

**Files:**
- Create: `workers/src/telegram/client/blog.ts`
- Create: `workers/test/telegram/blog.test.ts`

- [ ] **Step 1: Write failing tests**

Create `workers/test/telegram/blog.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { handleBlogContext, handleBlogApprove, handleBlogReject, formatPreview } from '../../src/telegram/client/blog';

describe('formatPreview', () => {
  it('truncates content for Telegram', () => {
    const preview = formatPreview({
      title: 'Test Title',
      description: 'Meta desc',
      content: 'Paragraph one.\n\nParagraph two.\n\nParagraph three.\n\nParagraph four.',
      tags: ['boiler', 'suffolk'],
      slug: 'test-title',
      image_alt_text: null,
    });
    expect(preview).toContain('<b>Test Title</b>');
    expect(preview).toContain('Meta desc');
    expect(preview).toContain('#boiler #suffolk');
    expect(preview.length).toBeLessThan(4096);
  });
});

describe('handleBlogContext', () => {
  it('calls AI writer and sends preview', async () => {
    const mockDraft = {
      title: 'Boiler Install in Clare',
      slug: 'boiler-install-clare',
      content: 'Content here',
      description: 'A boiler was installed',
      tags: ['boiler'],
      image_alt_text: null,
    };
    const bot = { sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }) };
    const wizard = {
      get: vi.fn().mockResolvedValue({
        type: 'blog', step: 'awaiting_context',
        clientId: 'gc', data: { photoFileId: 'f1', addToGallery: 'false' },
      }),
      update: vi.fn().mockResolvedValue(undefined),
    };
    const deps = {
      aiWriter: { generateDraft: vi.fn().mockResolvedValue(mockDraft) },
      createDraft: vi.fn().mockResolvedValue('post-id-1'),
      getClient: vi.fn().mockResolvedValue({ business_name: 'Gas Champion', r2_bucket_prefix: 'gc/' }),
      ensureUniqueSlug: vi.fn().mockResolvedValue('boiler-install-clare'),
    };

    await handleBlogContext(bot as any, 123, 'New boiler fitted in Clare', wizard as any, deps as any);
    expect(deps.aiWriter.generateDraft).toHaveBeenCalled();
    expect(deps.createDraft).toHaveBeenCalled();
    expect(bot.sendMessage).toHaveBeenCalled();
  });
});

describe('handleBlogApprove', () => {
  it('publishes the draft and clears wizard', async () => {
    const bot = { sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }) };
    const wizard = {
      get: vi.fn().mockResolvedValue({
        type: 'blog', step: 'preview',
        clientId: 'gc', data: { draftPostId: 'post-1', addToGallery: 'false' },
      }),
      clear: vi.fn().mockResolvedValue(undefined),
    };
    const deps = {
      publishPost: vi.fn().mockResolvedValue(undefined),
    };

    await handleBlogApprove(bot as any, 123, wizard as any, deps);
    expect(deps.publishPost).toHaveBeenCalledWith('post-1');
    expect(wizard.clear).toHaveBeenCalledWith(123);
  });
});

describe('handleBlogReject', () => {
  it('deletes draft and clears wizard', async () => {
    const bot = { sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }) };
    const wizard = {
      get: vi.fn().mockResolvedValue({
        type: 'blog', step: 'preview',
        clientId: 'gc', data: { draftPostId: 'post-1' },
      }),
      clear: vi.fn().mockResolvedValue(undefined),
    };
    const deps = {
      deletePost: vi.fn().mockResolvedValue(undefined),
    };

    await handleBlogReject(bot as any, 123, wizard as any, deps);
    expect(deps.deletePost).toHaveBeenCalledWith('post-1');
    expect(wizard.clear).toHaveBeenCalledWith(123);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd workers && npx vitest run test/telegram/blog.test.ts
```

- [ ] **Step 3: Implement blog handler**

Create `workers/src/telegram/client/blog.ts`:

```typescript
import type { TelegramBot } from '../bot';
import type { WizardManager } from '../wizard';
import type { AiWriter } from '../../services/ai-writer';
import type { BlogDraftOutput } from '../../services/ai-prompts';

interface BlogContextDeps {
  aiWriter: AiWriter;
  createDraft: (post: {
    title: string; slug: string; content: string;
    description: string | null; tags: string | null; status: string;
    image_url: string | null; image_alt_text: string | null;
    scheduled_publish_at: string | null;
  }) => Promise<string>;
  getClient: (clientId: string) => Promise<{ business_name: string; r2_bucket_prefix: string } | null>;
  ensureUniqueSlug: (slug: string) => Promise<string>;
}

interface BlogActionDeps {
  publishPost: (postId: string) => Promise<void>;
  deletePost?: (postId: string) => Promise<void>;
  addToGallery?: (r2Key: string, altText: string | null) => Promise<void>;
}

interface BlogEditDeps {
  aiWriter: AiWriter;
  updateDraft: (postId: string, fields: Record<string, string | null>) => Promise<void>;
  getDraft: (postId: string) => Promise<{ content: string; title: string } | null>;
}

export function formatPreview(draft: BlogDraftOutput): string {
  const tags = draft.tags.map(t => `#${t}`).join(' ');
  const contentLines = draft.content.split('\n\n');
  const preview = contentLines.slice(0, 3).join('\n\n');
  const wordCount = draft.content.split(/\s+/).length;

  let text = `<b>${draft.title}</b>\n\n`;
  text += `<i>${draft.description}</i>\n\n`;
  text += preview;
  text += `\n\n${tags}`;
  text += `\n\n<i>Full post: ~${wordCount} words</i>`;

  // Truncate if over Telegram limit
  if (text.length > 4000) {
    text = text.slice(0, 3950) + '\n\n<i>... (truncated)</i>';
  }
  return text;
}

export async function handleBlogContext(
  bot: TelegramBot,
  chatId: number,
  caption: string,
  wizard: WizardManager,
  deps: BlogContextDeps,
): Promise<void> {
  const state = await wizard.get(chatId);
  if (!state || state.type !== 'blog') return;

  const client = await deps.getClient(state.clientId!);
  if (!client) return;

  await bot.sendMessage(chatId, 'Drafting your post...');
  await wizard.update(chatId, 'generating', { caption });

  try {
    const draft = await deps.aiWriter.generateDraft({
      businessName: client.business_name,
      serviceArea: 'Suffolk and surrounding areas',
      caption,
      hasPhoto: !!state.data.photoFileId,
    });

    const uniqueSlug = await deps.ensureUniqueSlug(draft.slug);

    const postId = await deps.createDraft({
      title: draft.title,
      slug: uniqueSlug,
      content: draft.content,
      description: draft.description,
      tags: JSON.stringify(draft.tags),
      status: 'draft',
      image_url: state.data.photoR2Key || null,
      image_alt_text: draft.image_alt_text,
      scheduled_publish_at: null,
    });

    await wizard.update(chatId, 'preview', { draftPostId: postId });

    const preview = formatPreview(draft);
    await bot.sendMessage(chatId, preview, {
      inline_keyboard: [
        [
          { text: '✅ Approve', callback_data: 'blog:approve' },
          { text: '✏️ Edit', callback_data: 'blog:edit' },
          { text: '❌ Reject', callback_data: 'blog:reject' },
        ],
      ],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('AI draft error:', msg);
    await wizard.clear(chatId);
    await bot.sendMessage(chatId, "Sorry, I couldn't generate a draft right now. Try again or use /newpost.");
  }
}

export async function handleBlogApprove(
  bot: TelegramBot,
  chatId: number,
  wizard: WizardManager,
  deps: BlogActionDeps,
): Promise<void> {
  const state = await wizard.get(chatId);
  if (!state || state.type !== 'blog') return;

  const postId = state.data.draftPostId;
  await deps.publishPost(postId);

  // If "Both" was selected, add photo to gallery
  if (state.data.addToGallery === 'true' && state.data.photoR2Key) {
    await deps.addToGallery?.(state.data.photoR2Key, state.data.imageAltText || null);
    await wizard.clear(chatId);
    await bot.sendMessage(chatId, 'Published and added to your gallery!');
    return;
  }

  // If blog only with photo, ask about gallery
  if (state.data.photoR2Key) {
    await wizard.update(chatId, 'ask_gallery');
    await bot.sendMessage(chatId, 'Published! Also add this photo to your gallery?', {
      inline_keyboard: [
        [
          { text: 'Yes', callback_data: 'blog:gallery_yes' },
          { text: 'No', callback_data: 'blog:gallery_no' },
        ],
      ],
    });
    return;
  }

  await wizard.clear(chatId);
  await bot.sendMessage(chatId, 'Published!');
}

export async function handleBlogReject(
  bot: TelegramBot,
  chatId: number,
  wizard: WizardManager,
  deps: { deletePost: (postId: string) => Promise<void> },
): Promise<void> {
  const state = await wizard.get(chatId);
  if (!state || state.type !== 'blog') return;

  await deps.deletePost(state.data.draftPostId);
  await wizard.clear(chatId);
  await bot.sendMessage(chatId, 'Draft discarded.');
}

export async function handleBlogEdit(
  bot: TelegramBot,
  chatId: number,
  wizard: WizardManager,
): Promise<void> {
  const state = await wizard.get(chatId);
  if (!state || state.type !== 'blog') return;

  await wizard.update(chatId, 'editing');
  await bot.sendMessage(
    chatId,
    'Send me the updated text, or tell me what to change.\n' +
    'e.g. "change the title to..." or "add a section about..."'
  );
}

export async function handleBlogEditResponse(
  bot: TelegramBot,
  chatId: number,
  editInstruction: string,
  wizard: WizardManager,
  deps: BlogEditDeps,
): Promise<void> {
  const state = await wizard.get(chatId);
  if (!state || state.type !== 'blog' || state.step !== 'editing') return;

  const postId = state.data.draftPostId;
  const existing = await deps.getDraft(postId);
  if (!existing) return;

  await bot.sendMessage(chatId, 'Updating your post...');

  try {
    const existingJson = JSON.stringify({
      title: existing.title,
      content: existing.content,
    });
    const updated = await deps.aiWriter.editDraft(existingJson, editInstruction);

    await deps.updateDraft(postId, {
      title: updated.title,
      content: updated.content,
      description: updated.description,
      tags: JSON.stringify(updated.tags),
    });

    await wizard.update(chatId, 'preview');

    const preview = formatPreview(updated);
    await bot.sendMessage(chatId, preview, {
      inline_keyboard: [
        [
          { text: '✅ Approve', callback_data: 'blog:approve' },
          { text: '✏️ Edit', callback_data: 'blog:edit' },
          { text: '❌ Reject', callback_data: 'blog:reject' },
        ],
      ],
    });
  } catch (e) {
    console.error('AI edit error:', e);
    await bot.sendMessage(chatId, "Couldn't apply that edit. Try again or approve as-is.");
    await wizard.update(chatId, 'preview');
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd workers && npx vitest run test/telegram/blog.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add workers/src/telegram/client/blog.ts workers/test/telegram/blog.test.ts
git commit -m "feat: blog handler — AI draft, preview, approve/edit/reject"
```

---

## Task 8: Photo Download & EXIF Strip Utility

**Files:**
- Create: `workers/src/services/photo-upload.ts`
- Create: `workers/test/services/photo-upload.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { stripExifJpeg } from '../../src/services/photo-upload';

describe('stripExifJpeg', () => {
  it('removes APP1 (EXIF) while preserving other markers', () => {
    // Minimal JPEG: SOI + APP0 + APP1 (EXIF) + DQT + SOS + image data + EOI
    const soi = new Uint8Array([0xFF, 0xD8]);
    const app0 = new Uint8Array([0xFF, 0xE0, 0x00, 0x04, 0x4A, 0x46]); // JFIF - keep
    const app1 = new Uint8Array([0xFF, 0xE1, 0x00, 0x04, 0x45, 0x78]); // EXIF - strip
    const dqt = new Uint8Array([0xFF, 0xDB, 0x00, 0x03, 0x01]); // DQT - keep
    const sos = new Uint8Array([0xFF, 0xDA, 0x00, 0x02]); // SOS - keep
    const imgData = new Uint8Array([0x01, 0x02, 0x03]);
    const eoi = new Uint8Array([0xFF, 0xD9]);

    const full = new Uint8Array([...soi, ...app0, ...app1, ...dqt, ...sos, ...imgData, ...eoi]);
    const stripped = stripExifJpeg(full.buffer);
    const result = new Uint8Array(stripped);

    // Should start with SOI
    expect(result[0]).toBe(0xFF);
    expect(result[1]).toBe(0xD8);
    // Should NOT contain APP1 (0xFFE1)
    let hasApp1 = false;
    for (let i = 0; i < result.length - 1; i++) {
      if (result[i] === 0xFF && result[i + 1] === 0xE1) hasApp1 = true;
    }
    expect(hasApp1).toBe(false);
    // Should still contain DQT (0xFFDB)
    let hasDqt = false;
    for (let i = 0; i < result.length - 1; i++) {
      if (result[i] === 0xFF && result[i + 1] === 0xDB) hasDqt = true;
    }
    expect(hasDqt).toBe(true);
    // Should be smaller than original (APP1 removed)
    expect(result.length).toBeLessThan(full.length);
  });

  it('returns original if not JPEG', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4E, 0x47]);
    const result = stripExifJpeg(png.buffer);
    expect(new Uint8Array(result)).toEqual(png);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd workers && npx vitest run test/services/photo-upload.test.ts
```

- [ ] **Step 3: Implement**

Create `workers/src/services/photo-upload.ts`:

```typescript
import type { TelegramBot } from '../telegram/bot';

/**
 * Strip EXIF/APPn metadata from JPEG to remove GPS coordinates and camera info.
 * Selectively removes APP1-APP15 (0xFFE1-0xFFEF) markers while preserving
 * DQT, DHT, SOF, and other essential markers needed for decoding.
 */
export function stripExifJpeg(buffer: ArrayBuffer): ArrayBuffer {
  const bytes = new Uint8Array(buffer);

  // Check for JPEG SOI marker
  if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) return buffer;

  const chunks: Uint8Array[] = [bytes.slice(0, 2)]; // Keep SOI
  let i = 2;

  while (i < bytes.length - 1) {
    if (bytes[i] !== 0xFF) { i++; continue; }

    const marker = bytes[i + 1];

    // SOS (0xDA) — everything after this is image data, keep it all
    if (marker === 0xDA) {
      chunks.push(bytes.slice(i));
      break;
    }

    // APPn markers (0xE0-0xEF) — keep APP0 (JFIF), strip APP1-APP15 (EXIF etc)
    if (marker >= 0xE1 && marker <= 0xEF) {
      // Skip this segment: read length and advance past it
      const segLen = (bytes[i + 2] << 8) | bytes[i + 3];
      i += 2 + segLen;
      continue;
    }

    // All other markers (DQT, DHT, SOF, APP0, etc) — keep them
    if (marker >= 0xC0 || marker === 0x00) {
      // Markers with length field
      if (marker !== 0xD8 && marker !== 0xD9 && marker !== 0x00) {
        const segLen = (bytes[i + 2] << 8) | bytes[i + 3];
        chunks.push(bytes.slice(i, i + 2 + segLen));
        i += 2 + segLen;
      } else {
        chunks.push(bytes.slice(i, i + 2));
        i += 2;
      }
    } else {
      i++;
    }
  }

  // Concatenate chunks
  const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result.buffer;
}

/**
 * Download a photo from Telegram, strip EXIF, upload to R2, add to gallery DB.
 */
export async function downloadAndStorePhoto(
  bot: TelegramBot,
  fileId: string,
  clientId: string,
  r2: R2Bucket,
  db: { gallery: { add: (img: any) => Promise<string> } },
  prefix: string,
): Promise<{ r2Key: string; galleryId: string }> {
  // Get file path from Telegram
  const filePath = await bot.getFile(fileId);
  const fileUrl = bot.getFileUrl(filePath);

  // Download
  const response = await fetch(fileUrl);
  if (!response.ok) throw new Error(`Failed to download photo: ${response.status}`);
  const originalBuffer = await response.arrayBuffer();

  // Strip EXIF
  const cleanBuffer = stripExifJpeg(originalBuffer);

  // Generate unique key
  const imageId = crypto.randomUUID();
  const r2Key = `${prefix}gallery/${imageId}-0.original`;

  // Upload to R2
  await r2.put(r2Key, cleanBuffer, {
    httpMetadata: { contentType: 'image/jpeg' },
  });

  // Add to gallery
  const galleryId = await db.gallery.add({
    r2_key: r2Key,
    alt_text: null,
    caption: null,
    width: null,
    height: null,
    srcset: null,
    source: 'upload',
    instagram_post_id: null,
  });

  return { r2Key, galleryId };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd workers && npx vitest run test/services/photo-upload.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add workers/src/services/photo-upload.ts workers/test/services/photo-upload.test.ts
git commit -m "feat: photo download with EXIF stripping and R2 upload"
```

---

## Task 9: Wire Everything Into Webhook Router

**Files:**
- Modify: `workers/src/api/index.ts:123-261`

This is the integration task — wiring all handlers into the client webhook.

- [ ] **Step 1: Add imports**

At top of `workers/src/api/index.ts`, add:

```typescript
import { handlePhotoReceived, handlePhotoChoice } from '../telegram/client/photo';
import { handleGalleryUpload, handleGalleryCaption, handleGallerySkip } from '../telegram/client/gallery';
import { handleBlogContext, handleBlogApprove, handleBlogReject, handleBlogEdit, handleBlogEditResponse } from '../telegram/client/blog';
import { WorkersAiWriter } from '../services/ai-writer';
import { downloadAndStorePhoto } from '../services/photo-upload';
```

- [ ] **Step 2: Update callback_query handling**

Inside the client webhook handler, after `answerCallback`, add new callback routing before existing routes:

```typescript
// Blog callbacks
if (callbackData === 'blog:approve') {
  const db = forClient(c.env.DB, userInfo.client.id);
  await handleBlogApprove(bot, chatId, wizard, {
    publishPost: (id) => db.blogPosts.publish(id),
    addToGallery: async (r2Key, altText) => {
      await db.gallery.add({
        r2_key: r2Key, alt_text: altText, caption: null,
        width: null, height: null, srcset: null, source: 'upload', instagram_post_id: null,
      });
    },
  });
  return c.json({ ok: true });
}
if (callbackData === 'blog:edit') {
  await handleBlogEdit(bot, chatId, wizard);
  return c.json({ ok: true });
}
if (callbackData === 'blog:reject') {
  const db = forClient(c.env.DB, userInfo.client.id);
  await handleBlogReject(bot, chatId, wizard, {
    deletePost: (id) => db.blogPosts.delete(id),
  });
  return c.json({ ok: true });
}
if (callbackData === 'blog:gallery_yes' || callbackData === 'blog:gallery_no') {
  const state = await wizard.get(chatId);
  if (state?.data.photoR2Key && callbackData === 'blog:gallery_yes') {
    const db = forClient(c.env.DB, userInfo.client.id);
    await db.gallery.add({
      r2_key: state.data.photoR2Key, alt_text: state.data.imageAltText || null,
      caption: null, width: null, height: null, srcset: null,
      source: 'upload', instagram_post_id: null,
    });
    await wizard.clear(chatId);
    await bot.sendMessage(chatId, 'Added to gallery!');
  } else {
    await wizard.clear(chatId);
    await bot.sendMessage(chatId, 'All done!');
  }
  return c.json({ ok: true });
}
if (callbackData === 'gallery:skip_caption') {
  await handleGallerySkip(bot, chatId, wizard);
  return c.json({ ok: true });
}
// Photo choice callbacks
if (callbackData?.startsWith('photo:')) {
  if (callbackData.startsWith('photo:gallery:')) {
    const fileId = callbackData.replace('photo:gallery:', '');
    const db = forClient(c.env.DB, userInfo.client.id);
    await handleGalleryUpload(bot, chatId, fileId, wizard, userInfo.client.id, {
      downloadAndStore: (fId, cId) => downloadAndStorePhoto(
        bot, fId, cId, c.env.R2, db, userInfo.client.r2_bucket_prefix || ''
      ),
    });
  } else {
    await handlePhotoChoice(bot, chatId, callbackData, wizard, userInfo.client.id);
  }
  return c.json({ ok: true });
}
```

- [ ] **Step 3: Add photo message handling**

After the callback handling, before text command routing, add:

```typescript
// Photo received
const photo = update.message?.photo;
if (photo && photo.length > 0) {
  const fileId = photo[photo.length - 1].file_id;
  await handlePhotoReceived(bot, chatId, fileId);
  return c.json({ ok: true });
}
```

- [ ] **Step 4: Add blog/gallery wizard state handling**

After photo handling, before onboarding check:

```typescript
// Blog wizard state
const wizState = await wizard.get(chatId);
if (wizState?.type === 'blog') {
  if (wizState.step === 'awaiting_context' && text) {
    const db = forClient(c.env.DB, userInfo.client.id);
    const aiWriter = new WorkersAiWriter(c.env.AI);
    await handleBlogContext(bot, chatId, text, wizard, {
      aiWriter,
      createDraft: (post) => db.blogPosts.create(post),
      getClient: async (id) => c.env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first(),
      ensureUniqueSlug: async (slug) => {
        let candidate = slug;
        let suffix = 2;
        while (await db.blogPosts.getBySlug(candidate)) {
          candidate = `${slug}-${suffix++}`;
        }
        return candidate;
      },
    });
    return c.json({ ok: true });
  }
  if (wizState.step === 'editing' && text) {
    const db = forClient(c.env.DB, userInfo.client.id);
    const aiWriter = new WorkersAiWriter(c.env.AI);
    await handleBlogEditResponse(bot, chatId, text, wizard, {
      aiWriter,
      updateDraft: (id, fields) => db.blogPosts.update(id, fields),
      getDraft: (id) => c.env.DB.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(id).first(),
    });
    return c.json({ ok: true });
  }
  return c.json({ ok: true });
}

// Gallery caption state
if (wizState?.type === 'gallery_caption' && text) {
  const db = forClient(c.env.DB, userInfo.client.id);
  await handleGalleryCaption(bot, chatId, text, wizard, {
    updateCaption: (id, caption) => db.gallery.updateCaption(id, caption),
  });
  return c.json({ ok: true });
}
```

- [ ] **Step 5: Add /newpost command**

In the text command routing section, add before the `/start` check:

```typescript
if (text === '/newpost') {
  await wizard.start(chatId, 'blog', 'awaiting_context', userInfo.client.id);
  await bot.sendMessage(chatId,
    'What would you like to write about?\nInclude the area if relevant.'
  );
  return c.json({ ok: true });
}
```

- [ ] **Step 6: Run all tests**

```bash
cd workers && npx vitest run
```

- [ ] **Step 7: Commit**

```bash
git add workers/src/api/index.ts
git commit -m "feat: wire blog/gallery/photo handlers into webhook router"
```

---

## Task 10: API — Blog Slug Endpoint and Pagination

**Files:**
- Modify: `workers/src/api/index.ts:48-61`
- Modify: `workers/src/lib/klyro-api.ts`

- [ ] **Step 1: Add GET /api/:clientId/blog/:slug endpoint**

After the existing blog endpoint:

```typescript
app.get('/api/:clientId/blog/:slug', async (c) => {
  const clientId = c.req.param('clientId');
  const slug = c.req.param('slug');
  const db = forClient(c.env.DB, clientId);
  const post = await db.blogPosts.getBySlug(slug);
  if (!post) return c.json({ error: 'Not found' }, 404);
  return c.json({ post });
});
```

- [ ] **Step 2: Add pagination to blog listing**

Update the existing blog endpoint:

```typescript
app.get('/api/:clientId/blog', async (c) => {
  const clientId = c.req.param('clientId');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  const offset = (page - 1) * limit;
  const db = forClient(c.env.DB, clientId);

  const posts = await db.blogPosts.getPublished();
  const total = posts.length;
  const paginated = posts.slice(offset, offset + limit);

  return c.json({ posts: paginated, total, page, pages: Math.ceil(total / limit) });
});
```

- [ ] **Step 3: Add pagination to gallery listing**

Update the existing gallery endpoint similarly.

- [ ] **Step 4: Update klyro-api.ts — add getBlogPostBySlug**

```typescript
export async function getBlogPostBySlug(slug: string) {
  const data = await fetchKlyro(`/blog/${slug}`);
  return data?.post ?? null;
}
```

- [ ] **Step 5: Commit**

```bash
git add workers/src/api/index.ts src/lib/klyro-api.ts
git commit -m "feat: blog slug endpoint and pagination"
```

---

## Task 11: Astro Gallery Page

**Files:**
- Create: `src/pages/gallery/index.astro`

- [ ] **Step 1: Create gallery page**

Create `src/pages/gallery/index.astro` using the same layout pattern as the blog listing page. Fetch from `getGalleryImages()`. Render a responsive CSS grid of images with captions, alt text, and a simple lightbox (CSS-only or minimal JS).

Follow the existing styling from `src/pages/blog/index.astro` for layout consistency.

- [ ] **Step 2: Test locally**

```bash
npm run dev
```
Visit `http://localhost:4321/gallery` — should show the gallery grid (empty until photos are uploaded).

- [ ] **Step 3: Commit**

```bash
git add src/pages/gallery/index.astro
git commit -m "feat: gallery page with responsive grid"
```

---

## Task 12: Astro Blog Pages — Switch to API

**Files:**
- Modify: `src/pages/blog/index.astro`
- Modify: `src/pages/blog/[...slug].astro`

- [ ] **Step 1: Update blog listing**

Replace `getCollection('blog')` with `getPublishedBlogPosts()` from klyro-api. Map the API response to the existing card component format. Keep the same layout and styling.

- [ ] **Step 2: Update blog detail page**

Replace static content rendering with `getBlogPostBySlug(slug)`. Render the markdown content using a markdown renderer. Update `getStaticPaths` to fetch all published slugs from the API.

- [ ] **Step 3: Test locally**

```bash
npm run dev
```
Check `/blog` shows API posts. Check `/blog/[slug]` renders correctly.

- [ ] **Step 4: Commit**

```bash
git add src/pages/blog/index.astro src/pages/blog/[...slug].astro
git commit -m "feat: switch blog pages from static to API-driven"
```

---

## Task 13: Deploy and End-to-End Test

- [ ] **Step 1: Deploy worker**

```bash
cd workers && npx wrangler deploy
```

- [ ] **Step 2: Test photo → blog flow**

Send a photo to @KlyroWebsiteBot. Tap "Blog Post". Enter a caption. Verify AI draft appears. Approve it. Check it appears on the site.

- [ ] **Step 3: Test photo → gallery flow**

Send a photo. Tap "Gallery". Add a caption. Check it appears on `/gallery`.

- [ ] **Step 4: Test /newpost**

Send `/newpost` to the bot. Enter a topic. Verify draft. Approve.

- [ ] **Step 5: Test edit flow**

Send a photo → Blog Post → get draft → tap Edit → send change → verify updated draft → Approve.

- [ ] **Step 6: Test reject flow**

Send a photo → Blog Post → get draft → tap Reject → verify discarded.

- [ ] **Step 7: Remove temporary /api/setup-token endpoint**

Delete the setup-token route from `workers/src/api/index.ts` (it was a temporary workaround).

- [ ] **Step 8: Final commit and push**

```bash
git add -A
git commit -m "feat: Phase 3 complete — blog & gallery via Telegram"
git push
```
