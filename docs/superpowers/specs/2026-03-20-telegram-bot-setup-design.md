# Telegram Bot Setup & Onboarding — Design Spec

**Date:** 2026-03-20
**Status:** Draft
**Project:** Klyro Platform (gaschampion-website-astro)
**Depends on:** Phase 1 Core Infrastructure (complete)

## Overview

A Telegram bot interface for onboarding new Klyro clients and managing their service connections (Google Reviews, Instagram, Facebook). The admin (Lee) creates a client with a guided conversational wizard, generates an invite link, and sends it to the business owner. The client clicks the link, opens the bot, and walks through a linear setup wizard to connect their accounts. After setup, a `/connect` command provides a hub for ongoing management.

## Personas

**Admin (Lee):** Creates clients, monitors health, troubleshoots. Needs a persistent button panel — no memorising commands. Spins many plates across businesses, needs everything clearly labelled and explained.

**Client (business owner):** Non-technical tradesperson. Connects accounts once during setup. Occasionally approves reviews or posts content via bot. Needs simple, guided flows with no jargon.

## Admin Flow

### Admin Panel (`/start` or `/menu`)

When the admin opens the bot, the bot sends a pinnable message with inline buttons:

```
Klyro Admin Panel

[Add New Client]
[My Clients]        [Recent Errors]
[Force Refresh]     [System Status]
```

This menu is also sent automatically the first time the admin opens the chat each day.

**Button actions:**
- **Add New Client** — starts the guided client creation wizard
- **My Clients** — lists all clients with health status (last sync, pending reviews, connection status)
- **Recent Errors** — errors across all clients from the last 24h
- **Force Refresh** — asks which client, then re-runs their content fetch
- **System Status** — platform health (D1 size, active clients, queue depth)

The Telegram Bot Menu button (bottom-left) also lists all commands for quick access.

### Client Creation Wizard (`/addclient`)

Conversational, one question at a time. No CLI syntax.

**Step 1:**
```
Let's set up a new client.

What's the business name?
```

Admin replies with business name.

**Step 2:**
```
Got it. Now I need a short ID for this client —
lowercase, no spaces. This is used internally for
the database and file storage.

Example: gas-champion, smiths-plumbing

What ID would you like?
```

Admin replies with ID.

**Step 3:**
```
What's their Cloudflare Pages project name?
(This is the project you created in Cloudflare
Pages that hosts their website)
```

Admin replies with project name.

**Step 4 — Confirmation:**
```
Here's what I'll create:

  Business:      Gas Champion Ltd
  Client ID:     gc-001
  Pages project: gaschampion-website
  Storage prefix: gc-001/

This will:
- Create the client in the database
- Set up their storage folder
- Generate an invite link for the owner

Go ahead? [Yes] [Cancel]
```

**On confirm:**
```
Client created: Gas Champion Ltd

Send this link to the business owner to start
their setup:

https://t.me/KlyroBot?start=invite_abc123def456

The invite expires in 7 days. Use /clients to
see all your clients anytime.
```

The invite token is stored in KV with a 7-day TTL, mapping to the client ID.

## Client Setup Wizard

### Entry Point

Client clicks the invite deep link (`https://t.me/KlyroBot?start=invite_xxx`). The bot:

1. Validates the invite token from KV
2. Associates the client's `telegram_chat_id` with the client record in D1
3. Adds the client as an authorized user with role `admin`
4. Marks the invite as claimed
5. Begins the setup wizard

If the invite is expired or invalid:
```
This invite link has expired or is invalid.
Please contact your Klyro admin for a new link.
```

### Welcome Message

```
Welcome to Klyro! I'm your website manager
for Gas Champion Ltd.

I keep your site updated automatically with
fresh reviews, Instagram posts, and more.

Let's get you connected — it only takes a
couple of minutes.
```

### Step 1: Google Reviews

```
First, let's connect your Google Reviews.

If you have your Google Maps link handy,
paste it here. It looks like:
https://maps.google.com/maps?cid=1234...

Or just tell me your business name and town
and I'll find you.

[Skip for now]
```

**If client pastes a Google Maps link:**
- Bot extracts the Place ID from the URL (CID parameter or path)
- Fetches place details from Google Places API to confirm
- Shows confirmation:

```
Found: Gas Champion Ltd, 31 High Street, Haverhill
4.9 stars, 82 reviews

Is this right? [Yes, connect] [Not me, search again]
```

**If client types a business name:**
- Bot searches via Google Places Autocomplete API
- Shows up to 3 matches as buttons:

```
I found these businesses:

[Gas Champion Ltd - Haverhill, Suffolk]
[Gas Champion Heating - Cambridge]
[None of these]
```

- Client taps the correct one, same confirmation flow

**On connect:**
- Stores the `google_place_id` in the client record in D1
- Immediately fetches current reviews to verify the connection works

**If skipped:** Bot notes it and moves on. Client can connect later via `/connect`.

### Step 2: Instagram & Facebook

```
Now let's connect your Instagram & Facebook.

This links both at once — I'll pull in your
Instagram posts and Facebook reviews
automatically.

Tap the button below to log in through Facebook:

[Connect Instagram & Facebook]

[Skip for now]
```

**OAuth flow (see Technical: OAuth section below):**
1. Button opens the OAuth page on the Worker
2. Client logs into Facebook, grants permissions
3. Callback saves tokens and updates D1
4. Bot confirms in Telegram:

```
Connected!
- Instagram: @gaschampionltd (media sync)
- Facebook: Gas Champion Ltd (reviews)
```

**If skipped:** Bot notes it and moves on.

### Step 3: Notification Hours

```
Last step — when should I send you notifications?

I'll queue anything outside these hours and send
a morning summary instead.

[9am - 6pm]  [8am - 8pm]  [Custom]  [Always on]
```

**If Custom:** Bot asks for start and end times.

Default timezone is Europe/London (from client record). Stored in D1.

### Setup Complete

```
You're all set! Here's your setup:

  Google Reviews: connected (82 reviews)
  Instagram: connected (@gaschampionltd)
  Facebook: connected (reviews)
  Notifications: 9am - 6pm

I'll start syncing your content now. You'll get
a notification when new reviews come in.

Here's what you can do anytime:

  /reviews  — approve new reviews
  /newpost  — create a blog post
  /gallery  — upload photos
  /status   — check everything's running
  /connect  — change connected services
  /hours    — change notification times
  /help     — full guide
```

After the summary, the bot immediately triggers the first content fetch for the client.

## Post-Setup: `/connect` Command

Available to both clients and admin. Shows current connection status with management options:

```
Your connections:

Google Reviews: Gas Champion Ltd, Haverhill
  4.9 stars, 82 reviews
  [Disconnect]

Instagram & Facebook: @gaschampionltd
  Last sync: 2 hours ago
  [Disconnect]

[Connect Google Reviews]
[Connect Instagram & Facebook]
```

- Only unconnected services show a "Connect" button
- Connected services show status and a "Disconnect" button

**Disconnect flow:**
```
Instagram & Facebook disconnected.

Instagram posts will no longer sync and Facebook
reviews won't be fetched. Your existing content
stays on the site.

You can reconnect anytime with /connect.
```

Disconnecting removes the token from KV and clears the provider ID fields in D1. Existing synced content remains.

## Technical: OAuth Flow

### Facebook/Instagram OAuth

**Permissions requested:** `pages_read_engagement`, `instagram_basic`, `instagram_manage_insights`

**Flow:**

1. Bot sends link: `GET /auth/facebook?client_id=gc-001&state={random_token}`
2. Worker stores `oauth_state:{state}` in KV (10-minute TTL) mapping to client_id
3. Worker redirects to Facebook OAuth dialog:
   ```
   https://www.facebook.com/v21.0/dialog/oauth
     ?client_id={FB_APP_ID}
     &redirect_uri={WORKER_URL}/auth/facebook/callback
     &scope=pages_read_engagement,instagram_basic,instagram_manage_insights
     &state={state}
   ```
4. Client authorizes, Facebook redirects to callback with `code` and `state`
5. Callback handler:
   - Validates `state` against KV (CSRF protection)
   - Exchanges `code` for short-lived token
   - Exchanges short-lived token for long-lived token (60 days)
   - Fetches Facebook Pages → gets Page ID and Page Access Token
   - Fetches Instagram Business Account ID linked to the Page
   - Stores tokens in KV: `token:{client_id}:instagram`, `token:{client_id}:facebook`
   - Stores token expiry in KV: `token_expiry:{client_id}:instagram`, `token_expiry:{client_id}:facebook`
   - Updates D1 client record: `instagram_user_id`, `facebook_page_id`
   - Sends Telegram confirmation message to the client
6. Worker serves a simple success page: "Connected! You can close this tab and return to Telegram."

**Token refresh:** Handled automatically by the existing Fetch Worker — Instagram tokens are refreshed when within 7 days of expiry.

### Google Reviews

No OAuth required. The Google Places API uses an API key (already stored as a Worker secret). Only the Place ID needs to be stored per client.

**Place ID extraction from Google Maps URL:**
- URLs may contain `cid=` parameter, `/place/` path, or `ftid=` parameter
- Regex extraction with fallback to Places API lookup if URL format is unrecognised

## Technical: Schema Changes

### New Migration: `0002_invite_tokens.sql`

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

**Migration also alters `clients.telegram_chat_id`** to allow NULL, since the client record is created by the admin before the client claims the invite:

```sql
-- D1 doesn't support ALTER COLUMN, so we recreate:
-- In practice, add a new nullable column or handle at application level
-- by inserting a placeholder value 'UNCLAIMED' at creation time,
-- then updating to the real chat_id when the invite is claimed.
```

The application layer uses `'UNCLAIMED'` as the initial `telegram_chat_id` value when the admin creates a client. This is updated to the real chat_id when the client claims the invite. The `authorized_users` table tracks all authorized Telegram users per client — the client who claims the invite is added as an authorized user with role `admin`, and `clients.telegram_chat_id` is updated to their chat_id (used as the primary contact for notifications).

### New KV Keys

| Key pattern | Purpose | TTL |
|-------------|---------|-----|
| `invite:{token}` | Maps invite token to client_id | 7 days |
| `oauth_state:{state}` | CSRF protection for OAuth flow | 10 minutes |
| `admin_menu_sent:{chat_id}:{date}` | Tracks daily admin menu auto-send | 24 hours |

### New Worker Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/auth/facebook` | GET | Initiates Facebook/Instagram OAuth |
| `/auth/facebook/callback` | GET | Handles OAuth callback |

### New Bot Commands

| Command | Who | Purpose |
|---------|-----|---------|
| `/start invite_xxx` | Client | Claims invite, starts setup wizard |
| `/start` / `/menu` | Admin | Shows admin panel with buttons |
| `/addclient` | Admin | Guided client creation wizard |
| `/clients` | Admin | List all clients with health status |
| `/errors` | Admin | Recent errors across all clients |
| `/refresh` | Admin | Force content refresh for a client |
| `/status` | Admin | System status |
| `/connect` | Client/Admin | Manage service connections |
| `/hours` | Client | Set notification hours |
| `/help` | Client | Full command guide |

### Env Bindings (new secrets needed)

| Secret | Purpose |
|--------|---------|
| `FACEBOOK_APP_ID` | Facebook OAuth app ID |
| `FACEBOOK_APP_SECRET` | Facebook OAuth app secret |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token |
| `TELEGRAM_WEBHOOK_SECRET` | Webhook validation secret |
| `GOOGLE_PLACES_API_KEY` | Google Places API key (may already exist) |
| `ADMIN_CHAT_ID` | Admin Telegram chat_id for command routing |

## Bot Architecture

The bot is a webhook-based Telegram handler added to the existing unified Worker entry point. Incoming Telegram updates arrive via POST to `/telegram/webhook`.

**Message routing:**
1. Validate `X-Telegram-Bot-Api-Secret-Token` header
2. Extract `chat_id` from the update
3. Check if `chat_id` is the admin → route to admin command handlers
4. Check if `chat_id` is an authorized user → route to client command handlers
5. Check if the message contains a deep link `/start invite_xxx` → route to onboarding
6. Otherwise → reply with "Contact your Klyro admin to get set up."

**Conversation state:** Setup wizard state (which step the user is on, partial data) is stored in KV with key `wizard:{chat_id}` and a 1-hour TTL. Each wizard step reads and updates this state.

**Callback queries:** Inline button taps are handled via Telegram callback queries. The callback data encodes the action (e.g., `confirm_place:ChIJxxx`, `skip_google`, `disconnect:instagram`).

## Error Handling

- **Invalid invite:** "This invite link has expired or is invalid."
- **OAuth failure:** "Something went wrong connecting your account. Please try again." + error logged to D1
- **Google Places search returns no results:** "I couldn't find that business. Try pasting your Google Maps link instead."
- **Token storage failure:** Retry once, then notify admin via Telegram
- **Telegram API errors:** Logged to D1 error_log, retried with exponential backoff

## Security

- **Admin identification:** Single admin chat_id stored as a Worker secret (`ADMIN_CHAT_ID`). Only this chat_id can access admin commands.
- **Invite tokens:** Cryptographically random (32 bytes hex), single-use, 7-day TTL
- **OAuth state:** Random token with 10-minute TTL prevents CSRF
- **Webhook validation:** Every Telegram update validated via secret token header
- **Rate limiting:** Max 5 commands per minute per chat_id (tracked in KV)
- **Token storage:** OAuth tokens stored in KV (encrypted at rest by Cloudflare), never in D1
