# Telegram Bot Setup & Onboarding — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Telegram bot with admin panel, client onboarding wizard, Google/Instagram/Facebook connection flows, and OAuth handling — all integrated into the existing Klyro Worker.

**Architecture:** The bot is a webhook-based Telegram handler added to the existing Hono app. Incoming updates arrive via POST to `/telegram/webhook`. A Telegram helper module wraps the Bot API. Conversation state for multi-step wizards is stored in KV. OAuth routes handle Facebook/Instagram token exchange. Admin and client flows are separate command handler modules.

**Tech Stack:** Cloudflare Workers (existing), Hono (existing), D1 (existing), KV (existing), Telegram Bot API, Facebook OAuth 2.0

**Spec:** `docs/superpowers/specs/2026-03-20-telegram-bot-setup-design.md`

---

## File Structure

```
workers/
├── src/
│   ├── index.ts                          # MODIFY — add telegram webhook route to Hono app
│   ├── types.ts                          # MODIFY — add new types (Env secrets, TelegramUpdate, WizardState)
│   ├── api/index.ts                      # MODIFY — add /auth/facebook and /telegram/webhook routes
│   ├── telegram/
│   │   ├── bot.ts                        # Telegram Bot API helper (sendMessage, answerCallback, editMessage)
│   │   ├── router.ts                     # Message router — admin vs client vs onboarding
│   │   ├── admin/
│   │   │   ├── menu.ts                   # Admin panel — /start, /menu, button handlers
│   │   │   └── addclient.ts              # /addclient wizard — step-by-step client creation
│   │   ├── client/
│   │   │   ├── onboarding.ts             # Setup wizard — deep link entry, Google, OAuth, hours
│   │   │   └── connect.ts               # /connect hub — view/add/disconnect services
│   │   └── wizard.ts                     # Wizard state management (KV-based conversation state)
│   ├── auth/
│   │   └── facebook.ts                   # Facebook/Instagram OAuth routes (initiate + callback)
│   └── db/
│       └── client.ts                     # MODIFY — add createClient, claimInvite, updateChatId methods
├── test/
│   ├── telegram/
│   │   ├── bot.test.ts                   # Bot API helper tests
│   │   ├── router.test.ts               # Routing tests
│   │   ├── admin/
│   │   │   ├── menu.test.ts
│   │   │   └── addclient.test.ts
│   │   ├── client/
│   │   │   ├── onboarding.test.ts
│   │   │   └── connect.test.ts
│   │   └── wizard.test.ts
│   └── auth/
│       └── facebook.test.ts
└── migrations/
    └── 0002_invite_tokens.sql            # New table for invite tokens
```

---

## Task 1: Schema Migration & Type Updates

**Files:**
- Create: `workers/migrations/0002_invite_tokens.sql`
- Modify: `workers/src/types.ts`

- [ ] **Step 1: Create migration file**

Create `workers/migrations/0002_invite_tokens.sql`:
```sql
CREATE TABLE IF NOT EXISTS invite_tokens (
  token TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  claimed_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_invite_tokens_client
  ON invite_tokens(client_id);
```

- [ ] **Step 2: Add new types**

Add to `workers/src/types.ts`:
```typescript
// Add to Env interface:
//   FACEBOOK_APP_ID: string;
//   FACEBOOK_APP_SECRET: string;
//   GOOGLE_PLACES_API_KEY: string;
//   ADMIN_CHAT_ID: string;

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name: string; username?: string };
    chat: { id: number; type: string };
    date: number;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number; first_name: string };
    message?: {
      message_id: number;
      chat: { id: number };
    };
    data?: string;
  };
}

export interface WizardState {
  type: 'addclient' | 'onboarding';
  step: string;
  data: Record<string, string>;
  clientId?: string;
  updatedAt: string;
}

export interface InviteToken {
  token: string;
  client_id: string;
  created_at: string;
  expires_at: string;
  claimed_by: string | null;
}
```

- [ ] **Step 3: Run migration locally**

Run: `cd /Users/lee/gaschampion-website-astro/workers && npx wrangler d1 execute klyro-db --local --file=./migrations/0002_invite_tokens.sql`
Expected: Table created successfully.

- [ ] **Step 4: Commit**

```bash
cd /Users/lee/gaschampion-website-astro
git add workers/migrations/0002_invite_tokens.sql workers/src/types.ts
git commit -m "feat: add invite_tokens migration and Telegram bot types"
```

---

## Task 2: Telegram Bot API Helper

**Files:**
- Create: `workers/src/telegram/bot.ts`
- Create: `workers/test/telegram/bot.test.ts`

- [ ] **Step 1: Write failing tests**

Create `workers/test/telegram/bot.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { TelegramBot } from '../../src/telegram/bot';

describe('TelegramBot', () => {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ ok: true, result: { message_id: 1 } }),
  });

  it('sends a text message', async () => {
    const bot = new TelegramBot('fake-token', mockFetch);
    await bot.sendMessage(12345, 'Hello');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('fake-token/sendMessage');
    const body = JSON.parse(opts.body);
    expect(body.chat_id).toBe(12345);
    expect(body.text).toBe('Hello');
  });

  it('sends a message with inline keyboard', async () => {
    mockFetch.mockClear();
    const bot = new TelegramBot('fake-token', mockFetch);
    await bot.sendMessage(12345, 'Choose:', {
      inline_keyboard: [[{ text: 'Yes', callback_data: 'yes' }]],
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.reply_markup.inline_keyboard[0][0].text).toBe('Yes');
  });

  it('answers a callback query', async () => {
    mockFetch.mockClear();
    const bot = new TelegramBot('fake-token', mockFetch);
    await bot.answerCallback('cb-123');

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('answerCallbackQuery');
  });

  it('edits a message', async () => {
    mockFetch.mockClear();
    const bot = new TelegramBot('fake-token', mockFetch);
    await bot.editMessage(12345, 99, 'Updated text');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.chat_id).toBe(12345);
    expect(body.message_id).toBe(99);
    expect(body.text).toBe('Updated text');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/lee/gaschampion-website-astro/workers && npx vitest run test/telegram/bot.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement TelegramBot helper**

Create `workers/src/telegram/bot.ts`:
```typescript
export class TelegramBot {
  private baseUrl: string;

  constructor(
    private token: string,
    private fetchFn: typeof fetch = fetch
  ) {
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  async sendMessage(
    chatId: number | string,
    text: string,
    replyMarkup?: { inline_keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>> }
  ): Promise<{ message_id: number }> {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }
    return this.call('sendMessage', body);
  }

  async answerCallback(callbackQueryId: string, text?: string): Promise<void> {
    await this.call('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text,
    });
  }

  async editMessage(
    chatId: number | string,
    messageId: number,
    text: string,
    replyMarkup?: { inline_keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>> }
  ): Promise<void> {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }
    await this.call('editMessageText', body);
  }

  private async call(method: string, body: Record<string, unknown>): Promise<any> {
    const response = await this.fetchFn(`${this.baseUrl}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json() as { ok: boolean; result?: any; description?: string };
    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }
    return data.result;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/lee/gaschampion-website-astro/workers && npx vitest run test/telegram/bot.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/lee/gaschampion-website-astro
git add workers/src/telegram/bot.ts workers/test/telegram/bot.test.ts
git commit -m "feat: add Telegram Bot API helper (sendMessage, editMessage, answerCallback)"
```

---

## Task 3: Wizard State Management

**Files:**
- Create: `workers/src/telegram/wizard.ts`
- Create: `workers/test/telegram/wizard.test.ts`

- [ ] **Step 1: Write failing tests**

Create `workers/test/telegram/wizard.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { WizardManager } from '../../src/telegram/wizard';

describe('WizardManager', () => {
  let mockKV: any;

  beforeEach(() => {
    mockKV = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('starts a new wizard', async () => {
    const wiz = new WizardManager(mockKV);
    await wiz.start(12345, 'addclient', 'ask_name');

    expect(mockKV.put).toHaveBeenCalledOnce();
    const [key, value, opts] = mockKV.put.mock.calls[0];
    expect(key).toBe('wizard:12345');
    const state = JSON.parse(value);
    expect(state.type).toBe('addclient');
    expect(state.step).toBe('ask_name');
    expect(opts.expirationTtl).toBe(3600);
  });

  it('gets current wizard state', async () => {
    const stored = JSON.stringify({
      type: 'addclient',
      step: 'ask_name',
      data: { name: 'Test' },
      updatedAt: new Date().toISOString(),
    });
    mockKV.get.mockResolvedValue(stored);

    const wiz = new WizardManager(mockKV);
    const state = await wiz.get(12345);

    expect(state?.type).toBe('addclient');
    expect(state?.data.name).toBe('Test');
  });

  it('updates wizard step and data', async () => {
    const stored = JSON.stringify({
      type: 'addclient',
      step: 'ask_name',
      data: {},
      updatedAt: new Date().toISOString(),
    });
    mockKV.get.mockResolvedValue(stored);

    const wiz = new WizardManager(mockKV);
    await wiz.update(12345, 'ask_id', { business_name: 'Gas Champion' });

    const [, value] = mockKV.put.mock.calls[0];
    const state = JSON.parse(value);
    expect(state.step).toBe('ask_id');
    expect(state.data.business_name).toBe('Gas Champion');
  });

  it('clears wizard state', async () => {
    const wiz = new WizardManager(mockKV);
    await wiz.clear(12345);

    expect(mockKV.delete).toHaveBeenCalledWith('wizard:12345');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/lee/gaschampion-website-astro/workers && npx vitest run test/telegram/wizard.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement WizardManager**

Create `workers/src/telegram/wizard.ts`:
```typescript
import type { WizardState } from '../types';

const WIZARD_TTL = 3600; // 1 hour

export class WizardManager {
  constructor(private kv: KVNamespace) {}

  async start(chatId: number | string, type: WizardState['type'], step: string, clientId?: string): Promise<void> {
    const state: WizardState = {
      type,
      step,
      data: {},
      clientId,
      updatedAt: new Date().toISOString(),
    };
    await this.kv.put(`wizard:${chatId}`, JSON.stringify(state), { expirationTtl: WIZARD_TTL });
  }

  async get(chatId: number | string): Promise<WizardState | null> {
    const raw = await this.kv.get(`wizard:${chatId}`);
    if (!raw) return null;
    return JSON.parse(raw) as WizardState;
  }

  async update(chatId: number | string, step: string, newData?: Record<string, string>): Promise<void> {
    const current = await this.get(chatId);
    if (!current) return;
    current.step = step;
    if (newData) {
      current.data = { ...current.data, ...newData };
    }
    current.updatedAt = new Date().toISOString();
    await this.kv.put(`wizard:${chatId}`, JSON.stringify(current), { expirationTtl: WIZARD_TTL });
  }

  async clear(chatId: number | string): Promise<void> {
    await this.kv.delete(`wizard:${chatId}`);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/lee/gaschampion-website-astro/workers && npx vitest run test/telegram/wizard.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/lee/gaschampion-website-astro
git add workers/src/telegram/wizard.ts workers/test/telegram/wizard.test.ts
git commit -m "feat: add KV-based wizard state management for multi-step conversations"
```

---

## Task 4: Data Access Layer — Client Management Extensions

**Files:**
- Modify: `workers/src/db/client.ts`
- Create: `workers/test/db/admin.test.ts`

- [ ] **Step 1: Write failing tests**

Create `workers/test/db/admin.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { createClient, claimInvite, createInviteToken, getClientByChatId } from '../../src/db/client';

describe('Admin DB operations', () => {
  beforeEach(async () => {
    // Run both migrations
    for (const file of ['0001_initial.sql', '0002_invite_tokens.sql']) {
      const mod = await import(`../../migrations/${file}?raw`);
      const statements = mod.default.split(';').filter((s: string) => s.trim().length > 0 && !s.trim().startsWith('--'));
      for (const stmt of statements) {
        await env.DB.prepare(stmt + ';').run();
      }
    }
  });

  it('creates a client with UNCLAIMED chat_id', async () => {
    const id = await createClient(env.DB, {
      id: 'test-001',
      business_name: 'Test Business',
      pages_project_name: 'test-site',
      r2_bucket_prefix: 'test-001/',
    });

    expect(id).toBe('test-001');

    const client = await env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind('test-001').first();
    expect(client?.business_name).toBe('Test Business');
    expect(client?.telegram_chat_id).toBe('UNCLAIMED');
  });

  it('creates and validates an invite token', async () => {
    await createClient(env.DB, {
      id: 'test-001',
      business_name: 'Test Business',
      pages_project_name: 'test-site',
      r2_bucket_prefix: 'test-001/',
    });

    const token = await createInviteToken(env.DB, 'test-001');
    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThan(20);

    // Verify it's in the DB
    const row = await env.DB.prepare('SELECT * FROM invite_tokens WHERE token = ?').bind(token).first();
    expect(row?.client_id).toBe('test-001');
  });

  it('claims an invite and updates client chat_id', async () => {
    await createClient(env.DB, {
      id: 'test-001',
      business_name: 'Test Business',
      pages_project_name: 'test-site',
      r2_bucket_prefix: 'test-001/',
    });
    const token = await createInviteToken(env.DB, 'test-001');

    const clientId = await claimInvite(env.DB, token, '99999');
    expect(clientId).toBe('test-001');

    // Verify chat_id updated
    const client = await env.DB.prepare('SELECT telegram_chat_id FROM clients WHERE id = ?').bind('test-001').first();
    expect(client?.telegram_chat_id).toBe('99999');

    // Verify authorized_user created
    const user = await env.DB.prepare('SELECT * FROM authorized_users WHERE telegram_chat_id = ?').bind('99999').first();
    expect(user?.client_id).toBe('test-001');
    expect(user?.role).toBe('admin');
  });

  it('rejects expired invite', async () => {
    await createClient(env.DB, {
      id: 'test-001',
      business_name: 'Test Business',
      pages_project_name: 'test-site',
      r2_bucket_prefix: 'test-001/',
    });

    // Insert an already-expired invite
    await env.DB.prepare(
      "INSERT INTO invite_tokens (token, client_id, expires_at) VALUES (?, ?, datetime('now', '-1 day'))"
    ).bind('expired-token', 'test-001').run();

    const result = await claimInvite(env.DB, 'expired-token', '99999');
    expect(result).toBeNull();
  });

  it('finds client by chat_id', async () => {
    await createClient(env.DB, {
      id: 'test-001',
      business_name: 'Test Business',
      pages_project_name: 'test-site',
      r2_bucket_prefix: 'test-001/',
    });
    // Update chat_id manually for test
    await env.DB.prepare("UPDATE clients SET telegram_chat_id = '55555' WHERE id = 'test-001'").run();

    const client = await getClientByChatId(env.DB, '55555');
    expect(client?.id).toBe('test-001');
    expect(client?.business_name).toBe('Test Business');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/lee/gaschampion-website-astro/workers && npx vitest run test/db/admin.test.ts`
Expected: FAIL — functions not found

- [ ] **Step 3: Add new functions to data access layer**

Add to `workers/src/db/client.ts` (after the existing `getActiveClients` function):

```typescript
/** Create a new client (admin operation) */
export async function createClient(
  db: D1Database,
  client: {
    id: string;
    business_name: string;
    pages_project_name: string;
    r2_bucket_prefix: string;
  }
): Promise<string> {
  await db
    .prepare(
      `INSERT INTO clients (id, business_name, telegram_chat_id, pages_project_name, r2_bucket_prefix)
       VALUES (?, ?, 'UNCLAIMED', ?, ?)`
    )
    .bind(client.id, client.business_name, client.pages_project_name, client.r2_bucket_prefix)
    .run();
  return client.id;
}

/** Create an invite token for a client */
export async function createInviteToken(db: D1Database, clientId: string): Promise<string> {
  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await db
    .prepare('INSERT INTO invite_tokens (token, client_id, expires_at) VALUES (?, ?, ?)')
    .bind(token, clientId, expiresAt)
    .run();
  return token;
}

/** Claim an invite token — returns client_id or null if invalid/expired */
export async function claimInvite(
  db: D1Database,
  token: string,
  chatId: string
): Promise<string | null> {
  const invite = await db
    .prepare("SELECT * FROM invite_tokens WHERE token = ? AND claimed_by IS NULL AND expires_at > datetime('now')")
    .bind(token)
    .first<{ client_id: string }>();

  if (!invite) return null;

  // Claim the invite
  await db
    .prepare("UPDATE invite_tokens SET claimed_by = ? WHERE token = ?")
    .bind(chatId, token)
    .run();

  // Update client's telegram_chat_id
  await db
    .prepare("UPDATE clients SET telegram_chat_id = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(chatId, invite.client_id)
    .run();

  // Add as authorized user with admin role
  const userId = crypto.randomUUID();
  await db
    .prepare('INSERT OR IGNORE INTO authorized_users (id, client_id, telegram_chat_id, role) VALUES (?, ?, ?, ?)')
    .bind(userId, invite.client_id, chatId, 'admin')
    .run();

  return invite.client_id;
}

/** Find a client by their primary telegram_chat_id */
export async function getClientByChatId(
  db: D1Database,
  chatId: string
): Promise<Client | null> {
  return db
    .prepare('SELECT * FROM clients WHERE telegram_chat_id = ?')
    .bind(chatId)
    .first<Client>();
}

/** Find a client by an authorized user's chat_id */
export async function getClientByAuthorizedUser(
  db: D1Database,
  chatId: string
): Promise<{ client: Client; role: string } | null> {
  const row = await db
    .prepare(
      `SELECT c.*, au.role FROM authorized_users au
       JOIN clients c ON c.id = au.client_id
       WHERE au.telegram_chat_id = ?`
    )
    .bind(chatId)
    .first<Client & { role: string }>();

  if (!row) return null;
  const { role, ...client } = row;
  return { client: client as Client, role };
}

/** Get all clients with basic status info (admin) */
export async function getAllClients(
  db: D1Database
): Promise<Array<{
  id: string;
  business_name: string;
  is_active: boolean;
  google_place_id: string | null;
  instagram_user_id: string | null;
  facebook_page_id: string | null;
  telegram_chat_id: string;
}>> {
  const result = await db
    .prepare('SELECT id, business_name, is_active, google_place_id, instagram_user_id, facebook_page_id, telegram_chat_id FROM clients ORDER BY created_at DESC')
    .all();
  return result.results as any;
}

/** Update a client's Google Place ID */
export async function updateGooglePlaceId(
  db: D1Database,
  clientId: string,
  placeId: string | null
): Promise<void> {
  await db
    .prepare("UPDATE clients SET google_place_id = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(placeId, clientId)
    .run();
}

/** Update a client's Instagram/Facebook IDs */
export async function updateSocialIds(
  db: D1Database,
  clientId: string,
  instagramUserId: string | null,
  facebookPageId: string | null
): Promise<void> {
  await db
    .prepare("UPDATE clients SET instagram_user_id = ?, facebook_page_id = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(instagramUserId, facebookPageId, clientId)
    .run();
}

/** Update a client's quiet hours */
export async function updateQuietHours(
  db: D1Database,
  clientId: string,
  start: string,
  end: string
): Promise<void> {
  await db
    .prepare("UPDATE clients SET quiet_hours_start = ?, quiet_hours_end = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(start, end, clientId)
    .run();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/lee/gaschampion-website-astro/workers && npx vitest run test/db/admin.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/lee/gaschampion-website-astro
git add workers/src/db/client.ts workers/test/db/admin.test.ts
git commit -m "feat: add client management DB operations (create, invite, claim, lookup)"
```

---

## Task 5: Telegram Message Router

**Files:**
- Create: `workers/src/telegram/router.ts`
- Create: `workers/test/telegram/router.test.ts`

- [ ] **Step 1: Write failing tests**

Create `workers/test/telegram/router.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { routeUpdate } from '../../src/telegram/router';

describe('routeUpdate', () => {
  const mockEnv = {
    ADMIN_CHAT_ID: '11111',
    TELEGRAM_BOT_TOKEN: 'fake',
    TELEGRAM_WEBHOOK_SECRET: 'secret',
    DB: {},
    KV: {},
  };

  it('routes admin messages to admin handler', async () => {
    const adminHandler = vi.fn().mockResolvedValue(undefined);
    const clientHandler = vi.fn().mockResolvedValue(undefined);
    const onboardHandler = vi.fn().mockResolvedValue(undefined);

    const update = {
      update_id: 1,
      message: {
        message_id: 1,
        from: { id: 11111, first_name: 'Lee' },
        chat: { id: 11111, type: 'private' },
        date: Date.now(),
        text: '/menu',
      },
    };

    await routeUpdate(update, mockEnv as any, { adminHandler, clientHandler, onboardHandler });
    expect(adminHandler).toHaveBeenCalledOnce();
    expect(clientHandler).not.toHaveBeenCalled();
  });

  it('routes deep link to onboarding handler', async () => {
    const adminHandler = vi.fn().mockResolvedValue(undefined);
    const clientHandler = vi.fn().mockResolvedValue(undefined);
    const onboardHandler = vi.fn().mockResolvedValue(undefined);

    const update = {
      update_id: 2,
      message: {
        message_id: 2,
        from: { id: 99999, first_name: 'Client' },
        chat: { id: 99999, type: 'private' },
        date: Date.now(),
        text: '/start invite_abc123',
      },
    };

    await routeUpdate(update, mockEnv as any, { adminHandler, clientHandler, onboardHandler });
    expect(onboardHandler).toHaveBeenCalledOnce();
    expect(adminHandler).not.toHaveBeenCalled();
  });

  it('routes known client to client handler', async () => {
    const adminHandler = vi.fn().mockResolvedValue(undefined);
    const clientHandler = vi.fn().mockResolvedValue(undefined);
    const onboardHandler = vi.fn().mockResolvedValue(undefined);

    const update = {
      update_id: 3,
      message: {
        message_id: 3,
        from: { id: 55555, first_name: 'Known' },
        chat: { id: 55555, type: 'private' },
        date: Date.now(),
        text: '/connect',
      },
    };

    // Mock that this user is authorized (pass lookup function)
    await routeUpdate(update, mockEnv as any, {
      adminHandler,
      clientHandler,
      onboardHandler,
      lookupUser: vi.fn().mockResolvedValue({ client: { id: 'gc-001' }, role: 'admin' }),
    });
    expect(clientHandler).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/lee/gaschampion-website-astro/workers && npx vitest run test/telegram/router.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement router**

Create `workers/src/telegram/router.ts`:
```typescript
import type { Env, TelegramUpdate, Client } from '../types';

export interface RouteHandlers {
  adminHandler: (update: TelegramUpdate, env: Env) => Promise<void>;
  clientHandler: (update: TelegramUpdate, env: Env, client: Client, role: string) => Promise<void>;
  onboardHandler: (update: TelegramUpdate, env: Env, inviteToken: string) => Promise<void>;
  lookupUser?: (chatId: string) => Promise<{ client: Client; role: string } | null>;
}

export async function routeUpdate(
  update: TelegramUpdate,
  env: Env,
  handlers: RouteHandlers
): Promise<void> {
  const chatId = update.message?.chat.id ?? update.callback_query?.message?.chat.id;
  if (!chatId) return;

  const text = update.message?.text ?? '';

  // Check for deep link onboarding
  if (text.startsWith('/start invite_')) {
    const inviteToken = text.replace('/start ', '');
    await handlers.onboardHandler(update, env, inviteToken);
    return;
  }

  // Admin routing
  if (String(chatId) === env.ADMIN_CHAT_ID) {
    await handlers.adminHandler(update, env);
    return;
  }

  // Client routing — check if authorized user
  if (handlers.lookupUser) {
    const result = await handlers.lookupUser(String(chatId));
    if (result) {
      await handlers.clientHandler(update, env, result.client, result.role);
      return;
    }
  }

  // Unknown user — ignore or send generic message
  // (handled by the webhook endpoint, not the router)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/lee/gaschampion-website-astro/workers && npx vitest run test/telegram/router.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/lee/gaschampion-website-astro
git add workers/src/telegram/router.ts workers/test/telegram/router.test.ts
git commit -m "feat: add Telegram message router (admin/client/onboarding)"
```

---

## Task 6: Admin Panel — Menu & Buttons

**Files:**
- Create: `workers/src/telegram/admin/menu.ts`
- Create: `workers/test/telegram/admin/menu.test.ts`

- [ ] **Step 1: Write failing tests**

Create `workers/test/telegram/admin/menu.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { handleAdminMessage, handleAdminCallback } from '../../../src/telegram/admin/menu';

describe('Admin Menu', () => {
  const mockBot = {
    sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }),
    answerCallback: vi.fn().mockResolvedValue(undefined),
    editMessage: vi.fn().mockResolvedValue(undefined),
  };

  it('sends admin panel on /start', async () => {
    await handleAdminMessage(mockBot as any, 11111, '/start', {} as any, {} as any);

    expect(mockBot.sendMessage).toHaveBeenCalledOnce();
    const [chatId, text, markup] = mockBot.sendMessage.mock.calls[0];
    expect(chatId).toBe(11111);
    expect(text).toContain('Klyro Admin Panel');
    expect(markup.inline_keyboard).toBeDefined();
    expect(markup.inline_keyboard.length).toBeGreaterThan(0);
  });

  it('sends admin panel on /menu', async () => {
    mockBot.sendMessage.mockClear();
    await handleAdminMessage(mockBot as any, 11111, '/menu', {} as any, {} as any);

    expect(mockBot.sendMessage).toHaveBeenCalledOnce();
    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('Klyro Admin Panel');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/lee/gaschampion-website-astro/workers && npx vitest run test/telegram/admin/menu.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement admin menu**

Create `workers/src/telegram/admin/menu.ts`:
```typescript
import type { TelegramBot } from '../bot';
import type { WizardManager } from '../wizard';
import { getAllClients } from '../../db/client';

const ADMIN_PANEL_TEXT = `<b>Klyro Admin Panel</b>`;

const ADMIN_PANEL_KEYBOARD = {
  inline_keyboard: [
    [{ text: 'Add New Client', callback_data: 'admin:addclient' }],
    [
      { text: 'My Clients', callback_data: 'admin:clients' },
      { text: 'Recent Errors', callback_data: 'admin:errors' },
    ],
    [
      { text: 'Force Refresh', callback_data: 'admin:refresh' },
      { text: 'System Status', callback_data: 'admin:status' },
    ],
  ],
};

export async function handleAdminMessage(
  bot: TelegramBot,
  chatId: number,
  text: string,
  db: D1Database,
  wizard: WizardManager
): Promise<void> {
  // Check if in a wizard
  const wizState = await wizard.get(chatId);
  if (wizState && wizState.type === 'addclient') {
    // Delegate to addclient wizard — imported separately
    return;
  }

  switch (text) {
    case '/start':
    case '/menu':
      await bot.sendMessage(chatId, ADMIN_PANEL_TEXT, ADMIN_PANEL_KEYBOARD);
      break;
    case '/clients':
      await showClients(bot, chatId, db);
      break;
    default:
      await bot.sendMessage(chatId, ADMIN_PANEL_TEXT, ADMIN_PANEL_KEYBOARD);
      break;
  }
}

export async function handleAdminCallback(
  bot: TelegramBot,
  chatId: number,
  messageId: number,
  callbackId: string,
  data: string,
  db: D1Database,
  wizard: WizardManager
): Promise<void> {
  await bot.answerCallback(callbackId);

  switch (data) {
    case 'admin:addclient':
      // Start addclient wizard — handled by addclient module
      break;
    case 'admin:clients':
      await showClients(bot, chatId, db);
      break;
    case 'admin:errors':
      await showErrors(bot, chatId, db);
      break;
    case 'admin:status':
      await showStatus(bot, chatId, db);
      break;
    default:
      break;
  }
}

async function showClients(bot: TelegramBot, chatId: number, db: D1Database): Promise<void> {
  const clients = await getAllClients(db);
  if (clients.length === 0) {
    await bot.sendMessage(chatId, 'No clients yet. Tap <b>Add New Client</b> to create one.', ADMIN_PANEL_KEYBOARD);
    return;
  }

  let text = '<b>Your Clients</b>\n\n';
  for (const c of clients) {
    const google = c.google_place_id ? '✓' : '✗';
    const insta = c.instagram_user_id ? '✓' : '✗';
    const fb = c.facebook_page_id ? '✓' : '✗';
    const status = c.telegram_chat_id === 'UNCLAIMED' ? '⏳ Invite pending' : (c.is_active ? '✓ Active' : '✗ Inactive');
    text += `<b>${c.business_name}</b> (${c.id})\n`;
    text += `  Status: ${status}\n`;
    text += `  Google: ${google}  Instagram: ${insta}  Facebook: ${fb}\n\n`;
  }

  await bot.sendMessage(chatId, text);
}

async function showErrors(bot: TelegramBot, chatId: number, db: D1Database): Promise<void> {
  const result = await db
    .prepare("SELECT * FROM error_log WHERE created_at > datetime('now', '-24 hours') ORDER BY created_at DESC LIMIT 10")
    .all();

  if (result.results.length === 0) {
    await bot.sendMessage(chatId, 'No errors in the last 24 hours. All good!');
    return;
  }

  let text = '<b>Recent Errors (24h)</b>\n\n';
  for (const err of result.results as any[]) {
    text += `<b>${err.worker}</b> — ${err.error_type}\n`;
    text += `${err.message}\n`;
    text += `<i>${err.created_at}</i>\n\n`;
  }

  await bot.sendMessage(chatId, text);
}

async function showStatus(bot: TelegramBot, chatId: number, db: D1Database): Promise<void> {
  const clientCount = await db.prepare('SELECT COUNT(*) as c FROM clients WHERE is_active = 1').first<{ c: number }>();
  const errorCount = await db.prepare("SELECT COUNT(*) as c FROM error_log WHERE created_at > datetime('now', '-24 hours')").first<{ c: number }>();
  const reviewCount = await db.prepare('SELECT COUNT(*) as c FROM reviews').first<{ c: number }>();

  const text = `<b>System Status</b>\n\n` +
    `Active clients: ${clientCount?.c ?? 0}\n` +
    `Total reviews: ${reviewCount?.c ?? 0}\n` +
    `Errors (24h): ${errorCount?.c ?? 0}\n` +
    `Environment: production`;

  await bot.sendMessage(chatId, text, ADMIN_PANEL_KEYBOARD);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/lee/gaschampion-website-astro/workers && npx vitest run test/telegram/admin/menu.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/lee/gaschampion-website-astro
git add workers/src/telegram/admin/menu.ts workers/test/telegram/admin/menu.test.ts
git commit -m "feat: add admin panel with menu buttons, client list, errors, status"
```

---

## Task 7: Admin — Add Client Wizard

**Files:**
- Create: `workers/src/telegram/admin/addclient.ts`
- Create: `workers/test/telegram/admin/addclient.test.ts`

- [ ] **Step 1: Write failing tests**

Create `workers/test/telegram/admin/addclient.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleAddClientStep } from '../../../src/telegram/admin/addclient';

describe('Add Client Wizard', () => {
  const mockBot = {
    sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }),
    answerCallback: vi.fn().mockResolvedValue(undefined),
  };
  const mockWizard = {
    start: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  };
  const mockDb = {
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        run: vi.fn().mockResolvedValue({}),
        first: vi.fn().mockResolvedValue(null),
      }),
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts wizard by asking for business name', async () => {
    await handleAddClientStep(mockBot as any, 11111, null, null, mockWizard as any, mockDb as any);

    expect(mockWizard.start).toHaveBeenCalledWith(11111, 'addclient', 'ask_name');
    expect(mockBot.sendMessage).toHaveBeenCalledOnce();
    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain("business name");
  });

  it('asks for client ID after receiving name', async () => {
    mockWizard.get.mockResolvedValue({ type: 'addclient', step: 'ask_name', data: {} });

    await handleAddClientStep(mockBot as any, 11111, 'Gas Champion Ltd', null, mockWizard as any, mockDb as any);

    expect(mockWizard.update).toHaveBeenCalledWith(11111, 'ask_id', { business_name: 'Gas Champion Ltd' });
    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('short ID');
  });

  it('asks for pages project after receiving ID', async () => {
    mockWizard.get.mockResolvedValue({ type: 'addclient', step: 'ask_id', data: { business_name: 'Gas Champion' } });

    await handleAddClientStep(mockBot as any, 11111, 'gc-001', null, mockWizard as any, mockDb as any);

    expect(mockWizard.update).toHaveBeenCalledWith(11111, 'ask_project', { client_id: 'gc-001' });
  });

  it('shows confirmation after receiving project name', async () => {
    mockWizard.get.mockResolvedValue({
      type: 'addclient',
      step: 'ask_project',
      data: { business_name: 'Gas Champion', client_id: 'gc-001' },
    });

    await handleAddClientStep(mockBot as any, 11111, 'gaschampion-website', null, mockWizard as any, mockDb as any);

    const [, text, markup] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('Gas Champion');
    expect(text).toContain('gc-001');
    expect(text).toContain('gaschampion-website');
    expect(markup.inline_keyboard).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/lee/gaschampion-website-astro/workers && npx vitest run test/telegram/admin/addclient.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement add client wizard**

Create `workers/src/telegram/admin/addclient.ts`:
```typescript
import type { TelegramBot } from '../bot';
import type { WizardManager } from '../wizard';
import { createClient, createInviteToken } from '../../db/client';

export async function handleAddClientStep(
  bot: TelegramBot,
  chatId: number,
  text: string | null,
  callbackData: string | null,
  wizard: WizardManager,
  db: D1Database
): Promise<void> {
  const state = await wizard.get(chatId);

  // No wizard state — start fresh
  if (!state || state.type !== 'addclient') {
    await wizard.start(chatId, 'addclient', 'ask_name');
    await bot.sendMessage(chatId, "Let's set up a new client.\n\nWhat's the business name?");
    return;
  }

  switch (state.step) {
    case 'ask_name': {
      if (!text) return;
      await wizard.update(chatId, 'ask_id', { business_name: text });
      await bot.sendMessage(
        chatId,
        "Got it. Now I need a short ID for this client — lowercase, no spaces. " +
        "This is used internally for the database and file storage.\n\n" +
        "Example: gas-champion, smiths-plumbing\n\nWhat ID would you like?"
      );
      break;
    }

    case 'ask_id': {
      if (!text) return;
      const id = text.toLowerCase().replace(/\s+/g, '-');
      await wizard.update(chatId, 'ask_project', { client_id: id });
      await bot.sendMessage(
        chatId,
        "What's their Cloudflare Pages project name?\n" +
        "(This is the project you created in Cloudflare Pages that hosts their website)"
      );
      break;
    }

    case 'ask_project': {
      if (!text) return;
      await wizard.update(chatId, 'confirm', { pages_project: text });
      const data = { ...state.data, pages_project: text };
      await bot.sendMessage(
        chatId,
        `Here's what I'll create:\n\n` +
        `  Business:      ${data.business_name}\n` +
        `  Client ID:     ${data.client_id}\n` +
        `  Pages project: ${text}\n` +
        `  Storage prefix: ${data.client_id}/\n\n` +
        `This will:\n` +
        `- Create the client in the database\n` +
        `- Set up their storage folder\n` +
        `- Generate an invite link for the owner\n\n` +
        `Go ahead?`,
        {
          inline_keyboard: [
            [
              { text: 'Yes', callback_data: 'addclient:confirm' },
              { text: 'Cancel', callback_data: 'addclient:cancel' },
            ],
          ],
        }
      );
      break;
    }

    case 'confirm': {
      if (callbackData === 'addclient:cancel') {
        await wizard.clear(chatId);
        await bot.sendMessage(chatId, 'Cancelled. No client was created.');
        return;
      }

      if (callbackData === 'addclient:confirm') {
        const data = state.data;
        try {
          await createClient(db, {
            id: data.client_id,
            business_name: data.business_name,
            pages_project_name: data.pages_project,
            r2_bucket_prefix: `${data.client_id}/`,
          });

          const token = await createInviteToken(db, data.client_id);
          await wizard.clear(chatId);

          await bot.sendMessage(
            chatId,
            `Client created: <b>${data.business_name}</b>\n\n` +
            `Send this link to the business owner to start their setup:\n\n` +
            `https://t.me/KlyroBot?start=${token}\n\n` +
            `The invite expires in 7 days. Use /clients to see all your clients anytime.`
          );
        } catch (e) {
          await wizard.clear(chatId);
          const message = e instanceof Error ? e.message : String(e);
          await bot.sendMessage(chatId, `Error creating client: ${message}`);
        }
      }
      break;
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/lee/gaschampion-website-astro/workers && npx vitest run test/telegram/admin/addclient.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/lee/gaschampion-website-astro
git add workers/src/telegram/admin/addclient.ts workers/test/telegram/admin/addclient.test.ts
git commit -m "feat: add conversational /addclient wizard with confirmation"
```

---

## Task 8: Client Onboarding Wizard

**Files:**
- Create: `workers/src/telegram/client/onboarding.ts`
- Create: `workers/test/telegram/client/onboarding.test.ts`

- [ ] **Step 1: Write failing tests**

Create `workers/test/telegram/client/onboarding.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleOnboarding } from '../../../src/telegram/client/onboarding';

describe('Client Onboarding', () => {
  const mockBot = {
    sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }),
    answerCallback: vi.fn().mockResolvedValue(undefined),
  };
  const mockWizard = {
    start: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => vi.clearAllMocks());

  it('sends welcome message on valid invite', async () => {
    const mockClaimInvite = vi.fn().mockResolvedValue('gc-001');
    const mockGetClient = vi.fn().mockResolvedValue({ id: 'gc-001', business_name: 'Gas Champion Ltd' });

    await handleOnboarding(mockBot as any, 99999, 'invite_abc123', null, mockWizard as any, {
      claimInvite: mockClaimInvite,
      getClient: mockGetClient,
    } as any);

    expect(mockClaimInvite).toHaveBeenCalledWith('invite_abc123', '99999');
    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('Welcome to Klyro');
    expect(text).toContain('Gas Champion Ltd');
  });

  it('rejects expired invite', async () => {
    const mockClaimInvite = vi.fn().mockResolvedValue(null);

    await handleOnboarding(mockBot as any, 99999, 'invite_expired', null, mockWizard as any, {
      claimInvite: mockClaimInvite,
    } as any);

    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('expired or is invalid');
  });

  it('handles Google skip', async () => {
    mockWizard.get.mockResolvedValue({
      type: 'onboarding',
      step: 'google',
      data: {},
      clientId: 'gc-001',
    });

    await handleOnboarding(mockBot as any, 99999, null, 'onboard:skip_google', mockWizard as any, {} as any);

    expect(mockWizard.update).toHaveBeenCalledWith(99999, 'social', expect.anything());
    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('Instagram & Facebook');
  });

  it('shows setup complete after hours selection', async () => {
    mockWizard.get.mockResolvedValue({
      type: 'onboarding',
      step: 'hours',
      data: { google: 'connected' },
      clientId: 'gc-001',
    });

    const mockUpdateHours = vi.fn().mockResolvedValue(undefined);
    const mockGetClient = vi.fn().mockResolvedValue({
      id: 'gc-001',
      business_name: 'Gas Champion Ltd',
      google_place_id: 'ChIJ123',
      instagram_user_id: null,
      facebook_page_id: null,
      quiet_hours_start: '09:00',
      quiet_hours_end: '18:00',
    });

    await handleOnboarding(mockBot as any, 99999, null, 'onboard:hours_9_18', mockWizard as any, {
      updateQuietHours: mockUpdateHours,
      getClient: mockGetClient,
    } as any);

    expect(mockWizard.clear).toHaveBeenCalledWith(99999);
    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain("You're all set");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/lee/gaschampion-website-astro/workers && npx vitest run test/telegram/client/onboarding.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement onboarding wizard**

Create `workers/src/telegram/client/onboarding.ts`:
```typescript
import type { TelegramBot } from '../bot';
import type { WizardManager } from '../wizard';

interface OnboardingDeps {
  claimInvite: (token: string, chatId: string) => Promise<string | null>;
  getClient: (clientId: string) => Promise<any>;
  updateGooglePlaceId?: (clientId: string, placeId: string | null) => Promise<void>;
  updateQuietHours?: (clientId: string, start: string, end: string) => Promise<void>;
  searchGooglePlaces?: (query: string, apiKey: string) => Promise<Array<{ placeId: string; name: string; address: string }>>;
  extractPlaceId?: (url: string) => string | null;
  oauthBaseUrl?: string;
}

export async function handleOnboarding(
  bot: TelegramBot,
  chatId: number,
  text: string | null,
  callbackData: string | null,
  wizard: WizardManager,
  deps: OnboardingDeps
): Promise<void> {
  const state = await wizard.get(chatId);

  // Deep link entry — claim invite
  if (text && text.startsWith('invite_')) {
    const clientId = await deps.claimInvite(text, String(chatId));
    if (!clientId) {
      await bot.sendMessage(chatId, 'This invite link has expired or is invalid.\nPlease contact your Klyro admin for a new link.');
      return;
    }

    const client = await deps.getClient(clientId);
    await wizard.start(chatId, 'onboarding', 'google', clientId);

    // Welcome message
    await bot.sendMessage(
      chatId,
      `Welcome to Klyro! I'm your website manager for <b>${client.business_name}</b>.\n\n` +
      `I keep your site updated automatically with fresh reviews, Instagram posts, and more.\n\n` +
      `Let's get you connected — it only takes a couple of minutes.`
    );

    // Immediately ask about Google
    await bot.sendMessage(
      chatId,
      `First, let's connect your Google Reviews.\n\n` +
      `If you have your Google Maps link handy, paste it here. It looks like:\nhttps://maps.google.com/maps?cid=1234...\n\n` +
      `Or just tell me your business name and town and I'll find you.`,
      {
        inline_keyboard: [[{ text: 'Skip for now', callback_data: 'onboard:skip_google' }]],
      }
    );
    return;
  }

  if (!state || state.type !== 'onboarding') return;

  switch (state.step) {
    case 'google': {
      if (callbackData === 'onboard:skip_google') {
        await wizard.update(chatId, 'social', { google: 'skipped' });
        await sendSocialStep(bot, chatId, state.clientId!, deps);
        return;
      }

      if (text) {
        // Try to extract Place ID from URL
        const placeId = deps.extractPlaceId?.(text);
        if (placeId) {
          await deps.updateGooglePlaceId?.(state.clientId!, placeId);
          await wizard.update(chatId, 'social', { google: 'connected' });
          await bot.sendMessage(chatId, 'Google Reviews connected!');
          await sendSocialStep(bot, chatId, state.clientId!, deps);
          return;
        }

        // Otherwise treat as search query
        if (deps.searchGooglePlaces) {
          // Search and show results — simplified for now
          await bot.sendMessage(
            chatId,
            "I'll search for that. For now, you can connect Google later via /connect.",
            { inline_keyboard: [[{ text: 'Continue setup', callback_data: 'onboard:skip_google' }]] }
          );
          return;
        }
      }
      break;
    }

    case 'social': {
      if (callbackData === 'onboard:skip_social') {
        await wizard.update(chatId, 'hours', { social: 'skipped' });
        await sendHoursStep(bot, chatId);
        return;
      }
      // OAuth callback will advance to hours step via a separate mechanism
      break;
    }

    case 'hours': {
      let start = '09:00';
      let end = '18:00';

      if (callbackData === 'onboard:hours_9_18') {
        start = '09:00'; end = '18:00';
      } else if (callbackData === 'onboard:hours_8_20') {
        start = '08:00'; end = '20:00';
      } else if (callbackData === 'onboard:hours_always') {
        start = '00:00'; end = '23:59';
      } else if (callbackData === 'onboard:hours_custom') {
        await bot.sendMessage(chatId, 'Send me your preferred hours in the format: HH:MM-HH:MM\nExample: 07:30-19:00');
        return;
      } else if (text && text.match(/^\d{2}:\d{2}-\d{2}:\d{2}$/)) {
        [start, end] = text.split('-');
      } else {
        return;
      }

      await deps.updateQuietHours?.(state.clientId!, start, end);
      await wizard.clear(chatId);

      // Show setup complete
      const client = await deps.getClient?.(state.clientId!);
      const google = client?.google_place_id ? `Google Reviews: connected` : `Google Reviews: skipped`;
      const insta = client?.instagram_user_id ? `Instagram: connected` : `Instagram: skipped`;
      const fb = client?.facebook_page_id ? `Facebook: connected` : `Facebook: skipped`;

      await bot.sendMessage(
        chatId,
        `You're all set! Here's your setup:\n\n` +
        `  ${google}\n` +
        `  ${insta}\n` +
        `  ${fb}\n` +
        `  Notifications: ${start} - ${end}\n\n` +
        `I'll start syncing your content now.\n\n` +
        `Here's what you can do anytime:\n\n` +
        `  /reviews  — approve new reviews\n` +
        `  /newpost  — create a blog post\n` +
        `  /gallery  — upload photos\n` +
        `  /status   — check everything's running\n` +
        `  /connect  — change connected services\n` +
        `  /hours    — change notification times\n` +
        `  /help     — full guide`
      );
      break;
    }
  }
}

async function sendSocialStep(bot: TelegramBot, chatId: number, clientId: string, deps: OnboardingDeps): Promise<void> {
  const buttons: Array<Array<{ text: string; callback_data?: string; url?: string }>> = [];

  if (deps.oauthBaseUrl) {
    buttons.push([{ text: 'Connect Instagram & Facebook', url: `${deps.oauthBaseUrl}/auth/facebook?client_id=${clientId}&chat_id=${chatId}` }]);
  }
  buttons.push([{ text: 'Skip for now', callback_data: 'onboard:skip_social' }]);

  await bot.sendMessage(
    chatId,
    `Now let's connect your Instagram & Facebook.\n\n` +
    `This links both at once — I'll pull in your Instagram posts and Facebook reviews automatically.\n\n` +
    `Tap the button below to log in through Facebook:`,
    { inline_keyboard: buttons }
  );
}

async function sendHoursStep(bot: TelegramBot, chatId: number): Promise<void> {
  await bot.sendMessage(
    chatId,
    `Last step — when should I send you notifications?\n\n` +
    `I'll queue anything outside these hours and send a morning summary instead.`,
    {
      inline_keyboard: [
        [
          { text: '9am - 6pm', callback_data: 'onboard:hours_9_18' },
          { text: '8am - 8pm', callback_data: 'onboard:hours_8_20' },
        ],
        [
          { text: 'Custom', callback_data: 'onboard:hours_custom' },
          { text: 'Always on', callback_data: 'onboard:hours_always' },
        ],
      ],
    }
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/lee/gaschampion-website-astro/workers && npx vitest run test/telegram/client/onboarding.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/lee/gaschampion-website-astro
git add workers/src/telegram/client/onboarding.ts workers/test/telegram/client/onboarding.test.ts
git commit -m "feat: add client onboarding wizard (Google, social, hours setup)"
```

---

## Task 9: Connect Hub Command

**Files:**
- Create: `workers/src/telegram/client/connect.ts`
- Create: `workers/test/telegram/client/connect.test.ts`

- [ ] **Step 1: Write failing tests**

Create `workers/test/telegram/client/connect.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { handleConnect } from '../../../src/telegram/client/connect';

describe('/connect hub', () => {
  const mockBot = {
    sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }),
    answerCallback: vi.fn().mockResolvedValue(undefined),
  };

  it('shows connection status for a fully connected client', async () => {
    const client = {
      id: 'gc-001',
      google_place_id: 'ChIJ123',
      instagram_user_id: 'ig-456',
      facebook_page_id: 'fb-789',
    };

    await handleConnect(mockBot as any, 12345, null, client as any, {} as any);

    const [, text, markup] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('Google Reviews');
    expect(text).toContain('Instagram & Facebook');
    expect(markup.inline_keyboard).toBeDefined();
  });

  it('shows connect buttons for disconnected services', async () => {
    const client = {
      id: 'gc-001',
      google_place_id: null,
      instagram_user_id: null,
      facebook_page_id: null,
    };

    await handleConnect(mockBot as any, 12345, null, client as any, {} as any);

    const [, text, markup] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('not connected');
    // Should have connect buttons
    const allCallbacks = markup.inline_keyboard.flat().map((b: any) => b.callback_data || b.url).filter(Boolean);
    expect(allCallbacks.length).toBeGreaterThan(0);
  });

  it('handles disconnect callback', async () => {
    const mockUpdateGoogle = vi.fn().mockResolvedValue(undefined);

    await handleConnect(mockBot as any, 12345, 'connect:disconnect_google', { id: 'gc-001' } as any, {
      updateGooglePlaceId: mockUpdateGoogle,
    } as any);

    expect(mockUpdateGoogle).toHaveBeenCalledWith('gc-001', null);
    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('disconnected');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/lee/gaschampion-website-astro/workers && npx vitest run test/telegram/client/connect.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement connect hub**

Create `workers/src/telegram/client/connect.ts`:
```typescript
import type { TelegramBot } from '../bot';
import type { Client } from '../../types';

interface ConnectDeps {
  updateGooglePlaceId?: (clientId: string, placeId: string | null) => Promise<void>;
  updateSocialIds?: (clientId: string, igId: string | null, fbId: string | null) => Promise<void>;
  deleteTokens?: (clientId: string, provider: string) => Promise<void>;
  oauthBaseUrl?: string;
}

export async function handleConnect(
  bot: TelegramBot,
  chatId: number,
  callbackData: string | null,
  client: Client,
  deps: ConnectDeps
): Promise<void> {
  // Handle disconnect callbacks
  if (callbackData === 'connect:disconnect_google') {
    await deps.updateGooglePlaceId?.(client.id, null);
    await bot.sendMessage(
      chatId,
      'Google Reviews disconnected.\n\nGoogle reviews will no longer be fetched. Your existing reviews stay on the site.\n\nYou can reconnect anytime with /connect.'
    );
    return;
  }

  if (callbackData === 'connect:disconnect_social') {
    await deps.updateSocialIds?.(client.id, null, null);
    await deps.deleteTokens?.(client.id, 'instagram');
    await deps.deleteTokens?.(client.id, 'facebook');
    await bot.sendMessage(
      chatId,
      'Instagram & Facebook disconnected.\n\nInstagram posts will no longer sync and Facebook reviews won\'t be fetched. Your existing content stays on the site.\n\nYou can reconnect anytime with /connect.'
    );
    return;
  }

  // Show connection status
  const buttons: Array<Array<{ text: string; callback_data?: string; url?: string }>> = [];
  let text = '<b>Your connections:</b>\n\n';

  if (client.google_place_id) {
    text += `<b>Google Reviews:</b> connected\n  [Disconnect below]\n\n`;
    buttons.push([{ text: 'Disconnect Google', callback_data: 'connect:disconnect_google' }]);
  } else {
    text += `<b>Google Reviews:</b> not connected\n\n`;
    buttons.push([{ text: 'Connect Google Reviews', callback_data: 'connect:setup_google' }]);
  }

  if (client.instagram_user_id || client.facebook_page_id) {
    text += `<b>Instagram & Facebook:</b> connected\n  [Disconnect below]\n\n`;
    buttons.push([{ text: 'Disconnect Instagram & Facebook', callback_data: 'connect:disconnect_social' }]);
  } else {
    text += `<b>Instagram & Facebook:</b> not connected\n\n`;
    if (deps.oauthBaseUrl) {
      buttons.push([{ text: 'Connect Instagram & Facebook', url: `${deps.oauthBaseUrl}/auth/facebook?client_id=${client.id}&chat_id=${chatId}` }]);
    }
  }

  await bot.sendMessage(chatId, text, { inline_keyboard: buttons });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/lee/gaschampion-website-astro/workers && npx vitest run test/telegram/client/connect.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/lee/gaschampion-website-astro
git add workers/src/telegram/client/connect.ts workers/test/telegram/client/connect.test.ts
git commit -m "feat: add /connect hub for managing service connections"
```

---

## Task 10: Facebook/Instagram OAuth Routes

**Files:**
- Create: `workers/src/auth/facebook.ts`
- Create: `workers/test/auth/facebook.test.ts`

- [ ] **Step 1: Write failing tests**

Create `workers/test/auth/facebook.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { buildFacebookAuthUrl, handleFacebookCallback } from '../../src/auth/facebook';

describe('Facebook OAuth', () => {
  it('builds correct Facebook auth URL', () => {
    const url = buildFacebookAuthUrl({
      appId: 'app123',
      redirectUri: 'https://worker.dev/auth/facebook/callback',
      state: 'state-token',
    });

    expect(url).toContain('facebook.com/v21.0/dialog/oauth');
    expect(url).toContain('client_id=app123');
    expect(url).toContain('state=state-token');
    expect(url).toContain('pages_read_engagement');
  });

  it('exchanges code for token', async () => {
    const mockFetch = vi.fn()
      // Token exchange
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'short-token', token_type: 'bearer' }),
      })
      // Long-lived token exchange
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'long-token', expires_in: 5184000 }),
      })
      // Get pages
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [{ id: 'page-123', name: 'Gas Champion', access_token: 'page-token' }],
        }),
      })
      // Get Instagram account
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          instagram_business_account: { id: 'ig-456' },
        }),
      });

    const result = await handleFacebookCallback({
      code: 'auth-code',
      appId: 'app123',
      appSecret: 'secret',
      redirectUri: 'https://worker.dev/auth/facebook/callback',
      fetchFn: mockFetch,
    });

    expect(result.pageId).toBe('page-123');
    expect(result.instagramId).toBe('ig-456');
    expect(result.longLivedToken).toBe('long-token');
    expect(result.pageAccessToken).toBe('page-token');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/lee/gaschampion-website-astro/workers && npx vitest run test/auth/facebook.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement OAuth module**

Create `workers/src/auth/facebook.ts`:
```typescript
export function buildFacebookAuthUrl(opts: {
  appId: string;
  redirectUri: string;
  state: string;
}): string {
  const scopes = 'pages_read_engagement,instagram_basic,instagram_manage_insights';
  return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${opts.appId}&redirect_uri=${encodeURIComponent(opts.redirectUri)}&scope=${scopes}&state=${opts.state}`;
}

export async function handleFacebookCallback(opts: {
  code: string;
  appId: string;
  appSecret: string;
  redirectUri: string;
  fetchFn?: typeof fetch;
}): Promise<{
  pageId: string;
  instagramId: string | null;
  longLivedToken: string;
  pageAccessToken: string;
  expiresIn: number;
}> {
  const fetchFn = opts.fetchFn ?? fetch;

  // Step 1: Exchange code for short-lived token
  const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${opts.appId}&redirect_uri=${encodeURIComponent(opts.redirectUri)}&client_secret=${opts.appSecret}&code=${opts.code}`;
  const tokenRes = await fetchFn(tokenUrl);
  if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status}`);
  const tokenData = await tokenRes.json() as { access_token: string };

  // Step 2: Exchange for long-lived token
  const longUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${opts.appId}&client_secret=${opts.appSecret}&fb_exchange_token=${tokenData.access_token}`;
  const longRes = await fetchFn(longUrl);
  if (!longRes.ok) throw new Error(`Long-lived token exchange failed: ${longRes.status}`);
  const longData = await longRes.json() as { access_token: string; expires_in: number };

  // Step 3: Get user's Facebook pages
  const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?access_token=${longData.access_token}`;
  const pagesRes = await fetchFn(pagesUrl);
  if (!pagesRes.ok) throw new Error(`Pages fetch failed: ${pagesRes.status}`);
  const pagesData = await pagesRes.json() as { data: Array<{ id: string; name: string; access_token: string }> };

  if (!pagesData.data || pagesData.data.length === 0) {
    throw new Error('No Facebook Pages found for this account');
  }

  // Use first page (most clients have one)
  const page = pagesData.data[0];

  // Step 4: Get Instagram Business Account linked to the page
  const igUrl = `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`;
  const igRes = await fetchFn(igUrl);
  const igData = await igRes.json() as { instagram_business_account?: { id: string } };

  return {
    pageId: page.id,
    instagramId: igData.instagram_business_account?.id ?? null,
    longLivedToken: longData.access_token,
    pageAccessToken: page.access_token,
    expiresIn: longData.expires_in,
  };
}

/** Extract Google Place ID from a Google Maps URL */
export function extractPlaceIdFromUrl(url: string): string | null {
  // Try CID parameter: ?cid=1234567890
  const cidMatch = url.match(/[?&]cid=(\d+)/);
  if (cidMatch) return cidMatch[1];

  // Try ftid parameter: &ftid=0x47d8...
  const ftidMatch = url.match(/[?&]ftid=([^&]+)/);
  if (ftidMatch) return ftidMatch[1];

  // Try place_id parameter
  const pidMatch = url.match(/[?&]place_id=([^&]+)/);
  if (pidMatch) return pidMatch[1];

  // Try /place/ path with data segment: !1s0x...
  const dataMatch = url.match(/!1s(0x[a-f0-9]+:[a-f0-9]+)/i);
  if (dataMatch) return dataMatch[1];

  return null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/lee/gaschampion-website-astro/workers && npx vitest run test/auth/facebook.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/lee/gaschampion-website-astro
git add workers/src/auth/facebook.ts workers/test/auth/facebook.test.ts
git commit -m "feat: add Facebook/Instagram OAuth flow and Google Maps URL parser"
```

---

## Task 11: Wire Everything into Hono App

**Files:**
- Modify: `workers/src/api/index.ts`
- Modify: `workers/src/index.ts`

This task connects all the pieces: adds the `/telegram/webhook` POST route that validates the secret header and delegates to the router, adds the `/auth/facebook` and `/auth/facebook/callback` GET routes for OAuth, and updates the unified entry point.

- [ ] **Step 1: Add webhook and OAuth routes to Hono app**

Add to `workers/src/api/index.ts` (after the existing health route):

```typescript
import { TelegramBot } from '../telegram/bot';
import { WizardManager } from '../telegram/wizard';
import { routeUpdate } from '../telegram/router';
import { handleAdminMessage, handleAdminCallback } from '../telegram/admin/menu';
import { handleAddClientStep } from '../telegram/admin/addclient';
import { handleOnboarding } from '../telegram/client/onboarding';
import { handleConnect } from '../telegram/client/connect';
import { buildFacebookAuthUrl, handleFacebookCallback, extractPlaceIdFromUrl } from '../auth/facebook';
import {
  claimInvite, getClientByChatId, getClientByAuthorizedUser,
  updateGooglePlaceId, updateSocialIds, updateQuietHours,
} from '../db/client';
import { setToken } from '../utils/tokens';

// Telegram webhook
app.post('/telegram/webhook', async (c) => {
  // Validate webhook secret
  const secret = c.req.header('X-Telegram-Bot-Api-Secret-Token');
  if (secret !== c.env.TELEGRAM_WEBHOOK_SECRET) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const update = await c.req.json();
  const bot = new TelegramBot(c.env.TELEGRAM_BOT_TOKEN);
  const wizard = new WizardManager(c.env.KV);
  const chatId = update.message?.chat.id ?? update.callback_query?.message?.chat.id;

  if (!chatId) return c.json({ ok: true });

  const text = update.message?.text ?? '';
  const callbackData = update.callback_query?.data ?? null;

  // Answer callback queries immediately
  if (update.callback_query) {
    await bot.answerCallback(update.callback_query.id);
  }

  const isAdmin = String(chatId) === c.env.ADMIN_CHAT_ID;
  const workerUrl = new URL(c.req.url).origin;

  try {
    // Deep link onboarding
    if (text.startsWith('/start invite_')) {
      await handleOnboarding(bot, chatId, text.replace('/start ', ''), null, wizard, {
        claimInvite: (token, cId) => claimInvite(c.env.DB, token, cId),
        getClient: async (clientId) => {
          const r = await c.env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(clientId).first();
          return r;
        },
        extractPlaceId: extractPlaceIdFromUrl,
        updateGooglePlaceId: (clientId, placeId) => updateGooglePlaceId(c.env.DB, clientId, placeId),
        updateQuietHours: (clientId, start, end) => updateQuietHours(c.env.DB, clientId, start, end),
        oauthBaseUrl: workerUrl,
      });
      return c.json({ ok: true });
    }

    // Admin
    if (isAdmin) {
      const wizState = await wizard.get(chatId);
      if (wizState?.type === 'addclient') {
        await handleAddClientStep(bot, chatId, text || null, callbackData, wizard, c.env.DB);
      } else if (callbackData === 'admin:addclient') {
        await handleAddClientStep(bot, chatId, null, null, wizard, c.env.DB);
      } else if (callbackData?.startsWith('admin:')) {
        await handleAdminCallback(bot, chatId, update.callback_query?.message?.message_id, update.callback_query?.id, callbackData, c.env.DB, wizard);
      } else {
        await handleAdminMessage(bot, chatId, text, c.env.DB, wizard);
      }
      return c.json({ ok: true });
    }

    // Client — check authorization
    const userInfo = await getClientByAuthorizedUser(c.env.DB, String(chatId));
    if (userInfo) {
      const wizState = await wizard.get(chatId);
      if (wizState?.type === 'onboarding') {
        await handleOnboarding(bot, chatId, text || null, callbackData, wizard, {
          claimInvite: (token, cId) => claimInvite(c.env.DB, token, cId),
          getClient: async (clientId) => c.env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(clientId).first(),
          extractPlaceId: extractPlaceIdFromUrl,
          updateGooglePlaceId: (clientId, placeId) => updateGooglePlaceId(c.env.DB, clientId, placeId),
          updateQuietHours: (clientId, start, end) => updateQuietHours(c.env.DB, clientId, start, end),
          oauthBaseUrl: workerUrl,
        });
      } else if (text === '/connect' || callbackData?.startsWith('connect:')) {
        await handleConnect(bot, chatId, callbackData, userInfo.client, {
          updateGooglePlaceId: (clientId, placeId) => updateGooglePlaceId(c.env.DB, clientId, placeId),
          updateSocialIds: (clientId, igId, fbId) => updateSocialIds(c.env.DB, clientId, igId, fbId),
          oauthBaseUrl: workerUrl,
        });
      } else {
        await bot.sendMessage(chatId, 'Use /connect to manage your services, or /help for all commands.');
      }
      return c.json({ ok: true });
    }

    // Unknown user
    await bot.sendMessage(chatId, 'Contact your Klyro admin to get set up.');
  } catch (e) {
    console.error('Telegram webhook error:', e);
  }

  return c.json({ ok: true });
});

// Facebook OAuth — initiate
app.get('/auth/facebook', async (c) => {
  const clientId = c.req.query('client_id');
  const chatId = c.req.query('chat_id');
  if (!clientId) return c.text('Missing client_id', 400);

  const state = crypto.randomUUID();
  await c.env.KV.put(`oauth_state:${state}`, JSON.stringify({ clientId, chatId }), { expirationTtl: 600 });

  const redirectUri = `${new URL(c.req.url).origin}/auth/facebook/callback`;
  const url = buildFacebookAuthUrl({
    appId: c.env.FACEBOOK_APP_ID,
    redirectUri,
    state,
  });

  return c.redirect(url);
});

// Facebook OAuth — callback
app.get('/auth/facebook/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  if (!code || !state) return c.text('Missing code or state', 400);

  // Validate state
  const stateData = await c.env.KV.get(`oauth_state:${state}`);
  if (!stateData) return c.text('Invalid or expired state', 403);
  await c.env.KV.delete(`oauth_state:${state}`);

  const { clientId, chatId } = JSON.parse(stateData);

  try {
    const redirectUri = `${new URL(c.req.url).origin}/auth/facebook/callback`;
    const result = await handleFacebookCallback({
      code,
      appId: c.env.FACEBOOK_APP_ID,
      appSecret: c.env.FACEBOOK_APP_SECRET,
      redirectUri,
    });

    // Store tokens
    const expiry = new Date(Date.now() + result.expiresIn * 1000).toISOString();
    await setToken(c.env.KV, clientId, 'facebook', result.pageAccessToken, expiry);
    if (result.instagramId) {
      await setToken(c.env.KV, clientId, 'instagram', result.longLivedToken, expiry);
    }

    // Update client record
    await updateSocialIds(c.env.DB, clientId, result.instagramId, result.pageId);

    // Notify via Telegram
    if (chatId) {
      const bot = new TelegramBot(c.env.TELEGRAM_BOT_TOKEN);
      const igMsg = result.instagramId ? '\n- Instagram: connected (media sync)' : '';
      await bot.sendMessage(Number(chatId), `Connected!\n- Facebook: connected (reviews)${igMsg}`);

      // Advance onboarding wizard if active
      const wizard = new WizardManager(c.env.KV);
      const wizState = await wizard.get(chatId);
      if (wizState?.type === 'onboarding' && wizState.step === 'social') {
        await wizard.update(chatId, 'hours', { social: 'connected' });
        // Send hours step
        await bot.sendMessage(Number(chatId), 'Last step — when should I send you notifications?\n\nI\'ll queue anything outside these hours and send a morning summary instead.', {
          inline_keyboard: [
            [
              { text: '9am - 6pm', callback_data: 'onboard:hours_9_18' },
              { text: '8am - 8pm', callback_data: 'onboard:hours_8_20' },
            ],
            [
              { text: 'Custom', callback_data: 'onboard:hours_custom' },
              { text: 'Always on', callback_data: 'onboard:hours_always' },
            ],
          ],
        });
      }
    }

    return c.html('<html><body><h1>Connected!</h1><p>You can close this tab and return to Telegram.</p></body></html>');
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('OAuth callback error:', message);
    return c.html(`<html><body><h1>Connection Failed</h1><p>${message}</p><p>Please try again from Telegram.</p></body></html>`, 500);
  }
});
```

- [ ] **Step 2: Update Env interface in types.ts**

Add these fields to the `Env` interface in `workers/src/types.ts`:
```typescript
  FACEBOOK_APP_ID: string;
  FACEBOOK_APP_SECRET: string;
  GOOGLE_PLACES_API_KEY: string;
  ADMIN_CHAT_ID: string;
```

- [ ] **Step 3: Verify all tests still pass**

Run: `cd /Users/lee/gaschampion-website-astro/workers && npm test`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
cd /Users/lee/gaschampion-website-astro
git add workers/src/api/index.ts workers/src/types.ts
git commit -m "feat: wire Telegram webhook, OAuth routes, and all handlers into Hono app"
```

---

## Task 12: Run Migration on Remote D1 & Set Secrets

**Files:**
- Modify: `workers/wrangler.toml` (add test vars for new secrets)

- [ ] **Step 1: Run migration on remote D1**

Run: `cd /Users/lee/gaschampion-website-astro/workers && npx wrangler d1 execute klyro-db --remote --file=./migrations/0002_invite_tokens.sql`
Expected: Table created

- [ ] **Step 2: Set Telegram secrets**

```bash
cd /Users/lee/gaschampion-website-astro/workers
echo "YOUR_BOT_TOKEN" | npx wrangler secret put TELEGRAM_BOT_TOKEN
echo "YOUR_WEBHOOK_SECRET" | npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
echo "YOUR_CHAT_ID" | npx wrangler secret put ADMIN_CHAT_ID
```

Note: Get the bot token from BotFather. The webhook secret is any random string you choose. Admin chat_id is your personal Telegram chat ID (send /start to @userinfobot to find it).

- [ ] **Step 3: Set Facebook OAuth secrets**

```bash
echo "YOUR_FB_APP_ID" | npx wrangler secret put FACEBOOK_APP_ID
echo "YOUR_FB_APP_SECRET" | npx wrangler secret put FACEBOOK_APP_SECRET
```

Note: Create a Facebook App at developers.facebook.com. Add "Facebook Login" product. Set the callback URL to `https://klyro-worker.dark-grass-ae74.workers.dev/auth/facebook/callback`.

- [ ] **Step 4: Set Google Places API key**

```bash
echo "YOUR_GOOGLE_API_KEY" | npx wrangler secret put GOOGLE_PLACES_API_KEY
```

- [ ] **Step 5: Add test vars to wrangler.toml**

Add to `[vars]` section in `workers/wrangler.toml`:
```toml
ADMIN_CHAT_ID = "test-admin"
TELEGRAM_BOT_TOKEN = "test-token"
TELEGRAM_WEBHOOK_SECRET = "test-secret"
FACEBOOK_APP_ID = "test-app-id"
FACEBOOK_APP_SECRET = "test-app-secret"
GOOGLE_PLACES_API_KEY = "test-google-key"
```

- [ ] **Step 6: Deploy**

Run: `cd /Users/lee/gaschampion-website-astro/workers && npx wrangler deploy`
Expected: Deployed with new routes

- [ ] **Step 7: Register Telegram webhook**

Run:
```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://klyro-worker.dark-grass-ae74.workers.dev/telegram/webhook", "secret_token": "YOUR_WEBHOOK_SECRET"}'
```

Expected: `{"ok":true,"result":true,"description":"Webhook was set"}`

- [ ] **Step 8: Commit**

```bash
cd /Users/lee/gaschampion-website-astro
git add workers/wrangler.toml
git commit -m "feat: add test vars for Telegram and OAuth secrets, deploy bot"
```

---

## Task Dependencies

```
Task 1 (Schema + Types) ──────┐
Task 2 (Bot API helper)       │
Task 3 (Wizard manager)       ├── All independent, can run in parallel
Task 10 (OAuth module)        │
                               │
Task 4 (DB extensions) ───────┤── Depends on Task 1
Task 5 (Router) ──────────────┤── Depends on Task 1 (types)
                               │
Task 6 (Admin menu) ──────────┤── Depends on Tasks 2, 3, 4
Task 7 (Add client wizard) ───┤── Depends on Tasks 2, 3, 4
Task 8 (Onboarding wizard) ───┤── Depends on Tasks 2, 3, 4, 10
Task 9 (Connect hub) ─────────┤── Depends on Tasks 2, 4
                               │
Task 11 (Wire into Hono) ─────┤── Depends on Tasks 5-10
Task 12 (Deploy + secrets) ───┘── Depends on Task 11
```
