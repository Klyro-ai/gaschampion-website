import { Hono } from 'hono';
import type { Env } from '../types';
import { forClient, claimInvite, getClientByAuthorizedUser, updateGooglePlaceId, updateSocialIds, updateQuietHours } from '../db/client';
import { TelegramBot } from '../telegram/bot';
import { WizardManager } from '../telegram/wizard';
import { handleAdminMessage, handleAdminCallback } from '../telegram/admin/menu';
import { handleAddClientStep } from '../telegram/admin/addclient';
import { handleOnboarding } from '../telegram/client/onboarding';
import { handleConnect } from '../telegram/client/connect';
import { buildFacebookAuthUrl, handleFacebookCallback, extractPlaceIdFromUrl } from '../auth/facebook';
import { setToken } from '../utils/tokens';

const app = new Hono<{ Bindings: Env }>();

// Auth middleware — build-time API key
app.use('/api/*', async (c, next) => {
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
  const db = forClient(c.env.DB, clientId);
  const posts = await db.blogPosts.getPublished();
  return c.json({ posts });
});

// GET /api/:clientId/gallery — gallery images ordered by display_order
app.get('/api/:clientId/gallery', async (c) => {
  const clientId = c.req.param('clientId');
  const db = forClient(c.env.DB, clientId);
  const images = await db.gallery.getAll();
  return c.json({ images });
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Telegram webhook
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
        getClient: async (clientId) => c.env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(clientId).first(),
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

export default app;
