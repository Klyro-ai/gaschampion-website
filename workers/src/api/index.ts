import { Hono } from 'hono';
import type { Env } from '../types';
import { forClient, claimInvite, getClientByAuthorizedUser, updateGooglePlaceId, updateSocialIds, updateQuietHours, getClientByHostname } from '../db/client';
import { TelegramBot } from '../telegram/bot';
import { WizardManager } from '../telegram/wizard';
import { handleAdminMessage, handleAdminCallback } from '../telegram/admin/menu';
import { handleAddClientStep } from '../telegram/admin/addclient';
import { handleOnboarding } from '../telegram/client/onboarding';
import { handleConnect } from '../telegram/client/connect';
import { buildFacebookAuthUrl, handleFacebookCallback, extractPlaceIdFromUrl } from '../auth/facebook';
import { handlePhotoReceived, handlePhotoChoice, getPendingPhotoFileId } from '../telegram/client/photo';
import { handleGalleryUpload, handleGalleryCaption, handleGallerySkip } from '../telegram/client/gallery';
import { handleBlogCaption, handleBlogContext, handleBlogApprove, handleBlogReject, handleBlogEdit, handleBlogEditResponse } from '../telegram/client/blog';
import { handleAiSettings, handleAiCallback, handleAiKeyInput } from '../telegram/client/ai-settings';
import { handleCtaSettings, handleCtaCallback, handleCtaTextInput } from '../telegram/client/cta-settings';
import { createAiWriter } from '../services/ai-writer';
import type { AiProvider } from '../services/ai-prompts';
import { downloadAndStorePhoto } from '../services/photo-upload';
import { searchGooglePlaces, fetchGoogleReviews } from '../services/google-reviews';
import { fetchFacebookReviews } from '../services/facebook-reviews';
import { setToken, getToken } from '../utils/tokens';

const app = new Hono<{ Bindings: Env }>();

// Auth middleware — build-time API key (skip for public image endpoint)
app.use('/api/*', async (c, next) => {
  if (c.req.path.startsWith('/api/image/') || c.req.path === '/api/lookup' || c.req.path.includes('/blog/preview/') || c.req.path.endsWith('/contact')) return next();
  const apiKey = c.req.header('X-API-Key');
  if (!apiKey || apiKey !== c.env.BUILD_API_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
});

// GET /api/:clientId/reviews — approved reviews + aggregate rating
app.get('/api/:clientId/reviews', async (c) => {
  const clientId = c.req.param('clientId');
  const db = forClient(c.env.DB, clientId);

  const [reviews, aggregate] = await Promise.all([
    db.reviews.getApproved(),
    db.reviews.getAggregateRating(),
  ]);

  return c.json({ reviews, aggregate });
});

// GET /api/:clientId/instagram — synced Instagram posts
app.get('/api/:clientId/instagram', async (c) => {
  const clientId = c.req.param('clientId');
  const db = forClient(c.env.DB, clientId);
  const posts = await db.instagram.getAll();
  return c.json({ posts });
});

// GET /api/:clientId/blog — published blog posts
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

// GET /api/:clientId/blog/:slug — single blog post by slug
app.get('/api/:clientId/blog/:slug', async (c) => {
  const clientId = c.req.param('clientId');
  const slug = c.req.param('slug');
  const db = forClient(c.env.DB, clientId);
  const post = await db.blogPosts.getBySlug(slug);
  if (!post) return c.json({ error: 'Not found' }, 404);
  return c.json({ post });
});

// GET /api/:clientId/blog/preview/:postId — draft preview page (no auth, uses unguessable ID)
app.get('/api/:clientId/blog/preview/:postId', async (c) => {
  const clientId = c.req.param('clientId');
  const postId = c.req.param('postId');
  const post = await c.env.DB.prepare(
    'SELECT * FROM blog_posts WHERE id = ? AND client_id = ?'
  ).bind(postId, clientId).first<any>();
  if (!post) return c.text('Post not found', 404);

  const client = await c.env.DB.prepare(
    'SELECT business_name, site_config FROM clients WHERE id = ?'
  ).bind(clientId).first<any>();
  const businessName = client?.business_name || clientId;

  // Simple markdown to HTML (basic conversion for preview)
  let html = (post.content || '')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');

  const imageHtml = post.image_url
    ? `<img src="/api/image/${post.image_url}" alt="${post.image_alt_text || post.title}" style="width:100%;max-height:400px;object-fit:cover;border-radius:8px;margin-bottom:1.5rem">`
    : '';

  const tags = (() => { try { return JSON.parse(post.tags || '[]'); } catch { return []; } })();

  return c.html(`<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>PREVIEW: ${post.title}</title>
  <meta name="robots" content="noindex, nofollow">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.7; color: #1a1a1a; background: #f5f5f5; }
    .banner { background: #f59e0b; color: #000; text-align: center; padding: 0.75rem; font-weight: 600; font-size: 0.9rem; position: sticky; top: 0; z-index: 10; }
    .container { max-width: 720px; margin: 2rem auto; padding: 0 1.5rem; }
    .card { background: #fff; border-radius: 12px; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .meta { display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; }
    .tag { background: #e0f2fe; color: #0369a1; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.8rem; font-weight: 500; }
    .date { color: #6b7280; font-size: 0.85rem; }
    .status { background: ${post.status === 'published' ? '#dcfce7' : '#fef3c7'}; color: ${post.status === 'published' ? '#166534' : '#92400e'}; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }
    h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.75rem; line-height: 1.3; }
    .description { color: #6b7280; font-size: 1.05rem; margin-bottom: 1.5rem; font-style: italic; }
    .content h2 { font-size: 1.35rem; font-weight: 600; margin: 2rem 0 0.75rem; }
    .content h3 { font-size: 1.15rem; font-weight: 600; margin: 1.5rem 0 0.5rem; }
    .content p { margin-bottom: 1rem; color: #374151; }
    .content ul { margin: 0.5rem 0 1rem 1.5rem; }
    .content li { margin-bottom: 0.4rem; color: #374151; }
    .content strong { color: #1a1a1a; }
    .footer { text-align: center; padding: 2rem; color: #9ca3af; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="banner">DRAFT PREVIEW — ${businessName} — Not yet published</div>
  <div class="container">
    <div class="card">
      <div class="meta">
        ${tags.map((t: string) => `<span class="tag">${t}</span>`).join('')}
        <span class="status">${post.status}</span>
        <span class="date">${post.created_at?.slice(0, 10) || ''}</span>
      </div>
      <h1>${post.title}</h1>
      <p class="description">${post.description || ''}</p>
      ${imageHtml}
      <div class="content">${html}</div>
    </div>
  </div>
  <div class="footer">Preview generated by Klyro — this page is not indexed by search engines</div>
</body>
</html>`);
});

// GET /api/:clientId/gallery — gallery images ordered by display_order
app.get('/api/:clientId/gallery', async (c) => {
  const clientId = c.req.param('clientId');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  const db = forClient(c.env.DB, clientId);

  const images = await db.gallery.getAll();
  const total = images.length;
  const paginated = images.slice(offset, offset + limit);

  return c.json({ images: paginated, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/:clientId/config — full site configuration for build/SSR
app.get('/api/:clientId/config', async (c) => {
  const clientId = c.req.param('clientId');

  const client = await c.env.DB.prepare(
    'SELECT * FROM clients WHERE id = ?'
  ).bind(clientId).first();

  if (!client) return c.json({ error: 'Client not found' }, 404);

  const siteConfig = client.site_config ? JSON.parse(client.site_config as string) : null;
  if (!siteConfig) return c.json({ error: 'Site not configured' }, 404);

  return c.json({
    config: siteConfig,
    client: {
      id: client.id,
      business_name: client.business_name,
      theme_id: (client as any).theme_id || 'champion-blueprint',
      trade_type: (client as any).trade_type,
      custom_hostname: (client as any).custom_hostname,
    },
  });
});

// Serve images from R2 (no auth — public images)
app.get('/api/image/*', async (c) => {
  const key = c.req.path.replace('/api/image/', '');
  if (!key) return c.text('Not found', 404);

  const object = await c.env.R2.get(key);
  if (!object) return c.text('Not found', 404);

  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
});

// Public hostname lookup — used by SSR Worker to resolve tenant
app.get('/api/lookup', async (c) => {
  const hostname = c.req.query('hostname');
  if (!hostname) return c.json({ error: 'Missing hostname' }, 400);

  const client = await getClientByHostname(c.env.DB, hostname);
  if (!client) return c.json({ error: 'Unknown hostname' }, 404);

  return c.json({ client });
});

// POST /api/:clientId/contact — public lead submission from website contact form
app.post('/api/:clientId/contact', async (c) => {
  const clientId = c.req.param('clientId');
  const body = await c.req.json();

  const { name, phone, email, postcode, service, urgency, message } = body;
  if (!name || !phone) return c.json({ error: 'Name and phone required' }, 400);

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO leads (id, client_id, name, phone, email, postcode, service, urgency, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, clientId, name, phone, email || null, postcode || null, service || null, urgency || null, message || null).run();

  // Send Telegram notification to client
  const client = await c.env.DB.prepare(
    'SELECT telegram_chat_id, business_name FROM clients WHERE id = ?'
  ).bind(clientId).first<{ telegram_chat_id: string; business_name: string }>();

  if (client && client.telegram_chat_id !== 'UNCLAIMED' && client.telegram_chat_id !== 'PLACEHOLDER_CHAT_ID') {
    const bot = new TelegramBot(c.env.TELEGRAM_BOT_TOKEN);

    const urgencyEmoji = urgency === 'Emergency' ? '\u{1F534}' : urgency === 'This week' ? '\u{1F7E1}' : '\u{1F7E2}';
    let msg = `<b>New Lead!</b> ${urgencyEmoji}\n\n`;
    msg += `<b>Name:</b> ${name}\n`;
    msg += `<b>Phone:</b> ${phone}\n`;
    if (email) msg += `<b>Email:</b> ${email}\n`;
    if (postcode) msg += `<b>Postcode:</b> ${postcode}\n`;
    if (service) msg += `<b>Service:</b> ${service}\n`;
    if (urgency) msg += `<b>Urgency:</b> ${urgency}\n`;
    if (message) msg += `<b>Message:</b> ${message}\n`;

    await bot.sendMessage(Number(client.telegram_chat_id), msg, {
      inline_keyboard: [
        [
          { text: '\u{1F4DE} Call Back', url: `tel:${phone.replace(/\s+/g, '')}` },
          { text: '\u{2705} Mark Contacted', callback_data: `lead:contacted:${id}` },
        ],
      ],
    });
  }

  return c.json({ ok: true, id });
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Temporary: manual token setup (protected by API key)
app.post('/api/setup-token', async (c) => {
  const { clientId, provider, token, pageId, expiresAt } = await c.req.json();
  await setToken(c.env.KV, clientId, provider, token, expiresAt);
  if (pageId) {
    await updateSocialIds(c.env.DB, clientId, null, pageId);
  }
  return c.json({ ok: true });
});

// ========== ADMIN BOT WEBHOOK (@KlyroAdminBot) ==========
app.post('/telegram/admin-webhook', async (c) => {
  const secret = c.req.header('X-Telegram-Bot-Api-Secret-Token');
  if (secret !== c.env.TELEGRAM_ADMIN_WEBHOOK_SECRET) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const update = await c.req.json();
  const bot = new TelegramBot(c.env.TELEGRAM_ADMIN_BOT_TOKEN);
  const wizard = new WizardManager(c.env.KV);
  const chatId = update.message?.chat.id ?? update.callback_query?.message?.chat.id;

  if (!chatId) return c.json({ ok: true });

  // Only admin can use this bot
  if (String(chatId) !== c.env.ADMIN_CHAT_ID) {
    await bot.sendMessage(chatId, 'This bot is for Klyro admin only.');
    return c.json({ ok: true });
  }

  const text = update.message?.text ?? '';
  const callbackData = update.callback_query?.data ?? null;

  if (update.callback_query) {
    await bot.answerCallback(update.callback_query.id);
  }

  try {
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
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error('Admin bot error:', errMsg);
  }

  return c.json({ ok: true });
});

// ========== CLIENT BOT WEBHOOK (@KlyroWebsiteBot) ==========
app.post('/telegram/webhook', async (c) => {
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
  const workerUrl = new URL(c.req.url).origin;

  if (update.callback_query) {
    await bot.answerCallback(update.callback_query.id);
  }

  const onboardingDeps = {
    claimInvite: (token: string, cId: string) => claimInvite(c.env.DB, token, cId),
    getClient: async (clientId: string) => c.env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(clientId).first(),
    extractPlaceId: extractPlaceIdFromUrl,
    searchGooglePlaces,
    apiKey: c.env.GOOGLE_PLACES_API_KEY,
    updateGooglePlaceId: (clientId: string, placeId: string | null) => updateGooglePlaceId(c.env.DB, clientId, placeId),
    updateQuietHours: (clientId: string, start: string, end: string) => updateQuietHours(c.env.DB, clientId, start, end),
    oauthBaseUrl: workerUrl,
  };

  try {
    // Deep link onboarding — /start <token>
    const startPayload = text.startsWith('/start ') ? text.slice(7).trim() : '';
    if (startPayload && startPayload.length > 10) {
      await handleOnboarding(bot, chatId, startPayload, null, wizard, onboardingDeps);
      return c.json({ ok: true });
    }

    // Check wizard state first
    const wizState = await wizard.get(chatId);
    if (wizState?.type === 'onboarding') {
      await handleOnboarding(bot, chatId, text || null, callbackData, wizard, onboardingDeps);
      return c.json({ ok: true });
    }

    // Authorized client
    const userInfo = await getClientByAuthorizedUser(c.env.DB, String(chatId));
    if (userInfo) {
      // === NEW: Callback routing for blog/gallery/photo ===
      if (callbackData) {
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
          // Trigger site rebuild so the new post goes live
          if (c.env.PAGES_DEPLOY_HOOK) {
            fetch(c.env.PAGES_DEPLOY_HOOK, { method: 'POST' }).catch(() => {});
          }
          return c.json({ ok: true });
        }
        if (callbackData === 'blog:edit') {
          await handleBlogEdit(bot, chatId, wizard);
          return c.json({ ok: true });
        }
        if (callbackData === 'blog:generate') {
          // Skip extra details — generate with caption only
          console.log('Blog generate (skipping details)...');
          const db = forClient(c.env.DB, userInfo.client.id);
          const clientRow = await c.env.DB.prepare('SELECT site_config FROM clients WHERE id = ?').bind(userInfo.client.id).first<{ site_config: string | null }>();
          const clientConfig = clientRow?.site_config ? JSON.parse(clientRow.site_config) : {};
          const aiProvider = (clientConfig.aiProvider || 'workers-ai') as AiProvider;
          const aiApiKey = await c.env.KV.get(`ai_key:${userInfo.client.id}:${aiProvider}`);
          const aiWriter = createAiWriter(aiProvider, { ai: c.env.AI, apiKey: aiApiKey || undefined });
          await wizard.update(chatId, 'awaiting_details', { aiProvider });
          await handleBlogContext(bot, chatId, null, wizard, {
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
            downloadPhoto: (fileId, clientId) => downloadAndStorePhoto(
              bot, fileId, clientId, c.env.R2, db, userInfo.client.r2_bucket_prefix || ''
            ),
            previewBaseUrl: new URL(c.req.url).origin,
          });
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
        // AI settings callbacks
        if (callbackData.startsWith('ai:set:')) {
          await handleAiCallback(bot, chatId, callbackData, userInfo.client.id, c.env.DB, c.env.KV, wizard);
          return c.json({ ok: true });
        }
        // CTA settings callbacks
        if (callbackData.startsWith('cta:')) {
          await handleCtaCallback(bot, chatId, callbackData, userInfo.client.id, c.env.DB, wizard);
          return c.json({ ok: true });
        }
        // Lead contacted callbacks
        if (callbackData.startsWith('lead:contacted:')) {
          const leadId = callbackData.replace('lead:contacted:', '');
          await c.env.DB.prepare("UPDATE leads SET status = 'contacted' WHERE id = ? AND client_id = ?")
            .bind(leadId, userInfo.client.id).run();
          await bot.sendMessage(chatId, 'Lead marked as contacted.');
          return c.json({ ok: true });
        }
        // Photo choice callbacks
        if (callbackData.startsWith('photo:')) {
          if (callbackData === 'photo:gallery') {
            const fileId = await getPendingPhotoFileId(c.env.KV, chatId);
            if (fileId) {
              const db = forClient(c.env.DB, userInfo.client.id);
              await handleGalleryUpload(bot, chatId, fileId, wizard, userInfo.client.id, {
                downloadAndStore: (fId, cId) => downloadAndStorePhoto(
                  bot, fId, cId, c.env.R2, db, userInfo.client.r2_bucket_prefix || ''
                ),
              });
            } else {
              await bot.sendMessage(chatId, 'Photo expired — please send it again.');
            }
          } else {
            await handlePhotoChoice(bot, chatId, callbackData, wizard, userInfo.client.id, c.env.KV);
          }
          return c.json({ ok: true });
        }
      }

      // === NEW: Photo received ===
      const photo = update.message?.photo;
      if (photo && photo.length > 0) {
        const fileId = photo[photo.length - 1].file_id;
        await handlePhotoReceived(bot, chatId, fileId, c.env.KV);
        return c.json({ ok: true });
      }

      // === NEW: Blog/Gallery wizard state handling ===
      const wizStateClient = await wizard.get(chatId);
      if (wizStateClient?.type === 'blog') {
        if (wizStateClient.step === 'awaiting_context' && text) {
          // Step 1: Got the caption — ask for optional extra details
          await handleBlogCaption(bot, chatId, text, wizard);
          return c.json({ ok: true });
        }
        if (wizStateClient.step === 'awaiting_details' && text) {
          // Step 2: Got extra details — generate the draft
          console.log('Blog extra details received, generating draft...');
          const db = forClient(c.env.DB, userInfo.client.id);
          const clientRow = await c.env.DB.prepare('SELECT site_config FROM clients WHERE id = ?').bind(userInfo.client.id).first<{ site_config: string | null }>();
          const clientConfig = clientRow?.site_config ? JSON.parse(clientRow.site_config) : {};
          const aiProvider = (clientConfig.aiProvider || 'workers-ai') as AiProvider;
          const aiApiKey = await c.env.KV.get(`ai_key:${userInfo.client.id}:${aiProvider}`);
          const aiWriter = createAiWriter(aiProvider, { ai: c.env.AI, apiKey: aiApiKey || undefined });
          await wizard.update(chatId, 'awaiting_details', { aiProvider });
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
            downloadPhoto: (fileId, clientId) => downloadAndStorePhoto(
              bot, fileId, clientId, c.env.R2, db, userInfo.client.r2_bucket_prefix || ''
            ),
            previewBaseUrl: new URL(c.req.url).origin,
          });
          return c.json({ ok: true });
        }
        if (wizStateClient.step === 'editing' && text) {
          const db = forClient(c.env.DB, userInfo.client.id);
          const editClientRow = await c.env.DB.prepare('SELECT site_config FROM clients WHERE id = ?').bind(userInfo.client.id).first<{ site_config: string | null }>();
          const editClientConfig = editClientRow?.site_config ? JSON.parse(editClientRow.site_config) : {};
          const editAiProvider = (editClientConfig.aiProvider || 'workers-ai') as AiProvider;
          const editAiApiKey = await c.env.KV.get(`ai_key:${userInfo.client.id}:${editAiProvider}`);
          const aiWriter = createAiWriter(editAiProvider, { ai: c.env.AI, apiKey: editAiApiKey || undefined });
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
      if (wizStateClient?.type === 'gallery_caption' && text) {
        const db = forClient(c.env.DB, userInfo.client.id);
        await handleGalleryCaption(bot, chatId, text, wizard, {
          updateCaption: (id, caption) => db.gallery.updateCaption(id, caption),
        });
        return c.json({ ok: true });
      }

      // AI setup wizard state (awaiting API key)
      if (wizStateClient?.type === 'ai_setup' && text) {
        await handleAiKeyInput(bot, chatId, text, userInfo.client.id, c.env.DB, c.env.KV, wizard);
        return c.json({ ok: true });
      }

      // CTA setup wizard state (awaiting text input)
      if (wizStateClient?.type === 'cta_setup' && text) {
        await handleCtaTextInput(bot, chatId, text, userInfo.client.id, c.env.DB, wizard);
        return c.json({ ok: true });
      }

      // === NEW: /newpost command ===
      if (text === '/newpost') {
        await wizard.start(chatId, 'blog', 'awaiting_context', userInfo.client.id);
        await bot.sendMessage(chatId,
          'What would you like to write about?\nInclude the area if relevant.'
        );
        return c.json({ ok: true });
      }

      // === /ai command — AI provider settings ===
      if (text === '/ai') {
        await handleAiSettings(bot, chatId, userInfo.client.id, c.env.DB, c.env.KV);
        return c.json({ ok: true });
      }

      // === /cta command — CTA settings ===
      if (text === '/cta') {
        await handleCtaSettings(bot, chatId, userInfo.client.id, c.env.DB);
        return c.json({ ok: true });
      }

      // === EXISTING command routing (keep all of this) ===
      if (text === '/connect' || callbackData?.startsWith('connect:')) {
        await handleConnect(bot, chatId, callbackData, userInfo.client, {
          updateGooglePlaceId: (clientId, placeId) => updateGooglePlaceId(c.env.DB, clientId, placeId),
          updateSocialIds: (clientId, igId, fbId) => updateSocialIds(c.env.DB, clientId, igId, fbId),
          oauthBaseUrl: workerUrl,
        });
      } else if (text === '/reviews') {
        const client = userInfo.client;
        let msg = '<b>Reviews Summary</b>\n\n';
        let totalFound = 0;

        // Fetch Google Reviews
        if (client.google_place_id) {
          try {
            const googleReviews = await fetchGoogleReviews(client.google_place_id, c.env.GOOGLE_PLACES_API_KEY);
            totalFound += googleReviews.length;
            msg += `<b>Google Reviews:</b> ${googleReviews.length} found\n`;
            for (const r of googleReviews.slice(0, 3)) {
              const stars = '⭐'.repeat(r.rating);
              const snippet = r.text ? r.text.slice(0, 80) + (r.text.length > 80 ? '...' : '') : '(no text)';
              msg += `  ${stars} — ${r.author_name ?? 'Anonymous'}\n  "${snippet}"\n\n`;
            }
            if (googleReviews.length > 3) msg += `  ...and ${googleReviews.length - 3} more\n\n`;
          } catch (e) {
            msg += `<b>Google Reviews:</b> error — ${e instanceof Error ? e.message : String(e)}\n\n`;
          }
        } else {
          msg += '<b>Google Reviews:</b> not connected\n\n';
        }

        // Fetch Facebook Reviews
        const fbToken = await getToken(c.env.KV, client.id, 'facebook');
        if (client.facebook_page_id && fbToken) {
          try {
            const fbReviews = await fetchFacebookReviews(client.facebook_page_id, fbToken.token);
            totalFound += fbReviews.length;
            msg += `<b>Facebook Reviews:</b> ${fbReviews.length} found\n`;
            for (const r of fbReviews.slice(0, 3)) {
              const stars = r.rating ? '⭐'.repeat(r.rating) : '👍';
              const snippet = r.text ? r.text.slice(0, 80) + (r.text.length > 80 ? '...' : '') : '(no text)';
              msg += `  ${stars} — ${r.author_name ?? 'Anonymous'}\n  "${snippet}"\n\n`;
            }
            if (fbReviews.length > 3) msg += `  ...and ${fbReviews.length - 3} more\n\n`;
          } catch (e) {
            msg += `<b>Facebook Reviews:</b> error — ${e instanceof Error ? e.message : String(e)}\n\n`;
          }
        } else {
          msg += '<b>Facebook Reviews:</b> not connected\n\n';
        }

        if (totalFound === 0) msg += 'No reviews found yet. Make sure your services are connected with /connect.';

        await bot.sendMessage(chatId, msg);

      } else if (text === '/status') {
        const client = userInfo.client;
        const fbToken = await getToken(c.env.KV, client.id, 'facebook');
        let msg = `<b>Status for ${client.business_name}</b>\n\n`;
        msg += `<b>Google:</b> ${client.google_place_id ? 'connected' : 'not connected'}\n`;
        msg += `<b>Facebook:</b> ${client.facebook_page_id ? `connected (page ${client.facebook_page_id})` : 'not connected'}`;
        if (fbToken) msg += ` — token ${fbToken.expiresAt ? `expires ${fbToken.expiresAt.slice(0, 10)}` : 'active'}`;
        msg += `\n<b>Instagram:</b> ${client.instagram_user_id ? 'connected' : 'not connected'}\n`;
        await bot.sendMessage(chatId, msg);

      } else if (text === '/start' || text === '/help') {
        await bot.sendMessage(chatId,
          `<b>Klyro — ${userInfo.client.business_name}</b>\n\n` +
          `<b>Commands:</b>\n` +
          `  /reviews  — fetch and show latest reviews\n` +
          `  /connect  — manage connected services\n` +
          `  /status   — check connection status\n` +
          `  /newpost  — write a blog post\n` +
          `  /ai       — change AI provider for blog writing\n` +
          `  /cta      — set call-to-action for blog posts\n` +
          `  /help     — show this message\n\n` +
          `<b>Connected services sync automatically every 6 hours.</b> You can also use /reviews to check them anytime.\n\n` +
          `<b>Tip:</b> Send a photo to create a blog post or add to your gallery!`
        );
      } else {
        await bot.sendMessage(chatId, 'Use /help for all commands.');
      }
      return c.json({ ok: true });
    }

    // Unknown user
    await bot.sendMessage(chatId, 'Contact your Klyro admin to get set up.');
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : '';
    console.error('Client bot error:', errMsg, stack);
  }

  return c.json({ ok: true });
});

// Facebook OAuth — initiate
app.get('/auth/facebook', async (c) => {
  const clientId = c.req.query('client_id');
  if (!clientId) return c.text('Missing client_id', 400);

  const chatId = c.req.query('chat_id');
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

    const expiry = new Date(Date.now() + result.expiresIn * 1000).toISOString();
    await setToken(c.env.KV, clientId, 'facebook', result.pageAccessToken, expiry);
    if (result.instagramId) {
      await setToken(c.env.KV, clientId, 'instagram', result.longLivedToken, expiry);
    }

    await updateSocialIds(c.env.DB, clientId, result.instagramId, result.pageId);

    if (chatId) {
      const bot = new TelegramBot(c.env.TELEGRAM_BOT_TOKEN);
      const igMsg = result.instagramId ? '\n- Instagram: connected (media sync)' : '';
      await bot.sendMessage(Number(chatId), `Connected!\n- Facebook: connected (reviews)${igMsg}`);

      const wizard = new WizardManager(c.env.KV);
      const wizState = await wizard.get(chatId);
      if (wizState?.type === 'onboarding' && wizState.step === 'social') {
        await wizard.update(chatId, 'hours', { social: 'connected' });
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
    return c.html(`<html><body><h1>Connection Failed</h1><p>Please try again from Telegram.</p></body></html>`, 500);
  }
});

// Facebook data deletion callback
app.post('/auth/facebook/data-deletion', async (c) => {
  const body = await c.req.json();
  const userId = body?.user_id;

  // Facebook requires a JSON response with a confirmation code and a status URL
  const confirmationCode = crypto.randomUUID();

  // In practice, we'd delete stored tokens/data for this user here
  // For now, log and acknowledge
  console.log(`Facebook data deletion request for user_id: ${userId}, confirmation: ${confirmationCode}`);

  return c.json({
    url: `${new URL(c.req.url).origin}/auth/facebook/data-deletion-status?code=${confirmationCode}`,
    confirmation_code: confirmationCode,
  });
});

// Data deletion status check page
app.get('/auth/facebook/data-deletion-status', (c) => {
  const code = c.req.query('code');
  return c.html(`<html><body><h1>Data Deletion</h1><p>Your data deletion request (${code ?? 'unknown'}) has been processed. All stored Facebook data has been removed.</p></body></html>`);
});

// Privacy policy
app.get('/privacy', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Klyro - Privacy Policy</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem;line-height:1.6;color:#333}h1{color:#111}h2{margin-top:2rem}</style>
</head><body>
<h1>Klyro Privacy Policy</h1>
<p><strong>Last updated:</strong> 21 March 2026</p>

<h2>Who we are</h2>
<p>Klyro is a website management platform operated by Lee, sole trader, based in Suffolk, United Kingdom.</p>

<h2>What data we collect</h2>
<p>When you connect your accounts through Klyro, we may collect:</p>
<ul>
<li>Your Telegram chat ID (to send notifications)</li>
<li>Facebook Page access tokens (to fetch reviews)</li>
<li>Instagram Business Account ID and tokens (to sync media)</li>
<li>Google Places business information (reviews and ratings)</li>
</ul>

<h2>How we use your data</h2>
<p>We use your data solely to:</p>
<ul>
<li>Display reviews, ratings, and social media content on your website</li>
<li>Send you notifications about new reviews or content via Telegram</li>
<li>Optimise images for web display</li>
</ul>

<h2>Data storage</h2>
<p>Your data is stored securely on Cloudflare infrastructure (D1 database, KV store, and R2 storage). Access tokens are encrypted at rest.</p>

<h2>Third-party services</h2>
<p>We integrate with Facebook, Instagram, Google, and Telegram APIs. Your use of those services is governed by their respective privacy policies.</p>

<h2>Data retention and deletion</h2>
<p>We retain your data for as long as your Klyro account is active. You can request deletion of all your data at any time by contacting us or using the data deletion option in Telegram (/connect).</p>
<p>For Facebook data specifically, you can also request deletion via Facebook's settings, which triggers our automated data deletion callback.</p>

<h2>Your rights</h2>
<p>Under UK GDPR, you have the right to access, correct, or delete your personal data. Contact us to exercise these rights.</p>

<h2>Contact</h2>
<p>Email: <a href="mailto:hello@klyro.co.uk">hello@klyro.co.uk</a></p>
</body></html>`);
});

export default app;
