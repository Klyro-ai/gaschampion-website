import type { Env, FetchQueueMessage } from '../types';
import { forClient } from '../db/client';
import { fetchGoogleReviews } from '../services/google-reviews';
import { fetchInstagramPosts, refreshInstagramToken } from '../services/instagram';
import { fetchFacebookReviews } from '../services/facebook-reviews';
import { getToken, setToken, isTokenExpiringSoon } from '../utils/tokens';
import { logError } from '../utils/errors';
import { TelegramBot } from '../telegram/bot';

/** Auto-approve high-rated reviews and notify client of new reviews */
async function handleNewReview(
  review: { author_name: string | null; rating: number | null; text: string | null; source: string },
  clientDb: ReturnType<typeof forClient>,
  db: D1Database,
  clientId: string,
  botToken: string,
): Promise<void> {
  // Check if client has auto_approve_5_star enabled
  const client = await db.prepare(
    'SELECT auto_approve_5_star, telegram_chat_id FROM clients WHERE id = ?'
  ).bind(clientId).first<{ auto_approve_5_star: boolean; telegram_chat_id: string }>();

  if (!client || client.telegram_chat_id === 'UNCLAIMED') return;

  const rating = review.rating || 0;
  const isPositive = rating >= 4;

  // Auto-approve 4-5 star reviews if enabled
  if (client.auto_approve_5_star && isPositive) {
    // The review was just upserted — find it and approve
    const pending = await clientDb.reviews.getPending();
    const match = pending.find(r =>
      r.author_name === review.author_name && r.text === review.text
    );
    if (match) {
      await clientDb.reviews.approve(match.id);
    }
  }

  // Notify client of new reviews
  const bot = new TelegramBot(botToken);
  const stars = rating > 0 ? '⭐'.repeat(rating) : '';
  const snippet = review.text ? review.text.slice(0, 200) + (review.text.length > 200 ? '...' : '') : '(no text)';

  let msg = isPositive
    ? `<b>New ${rating}-star review!</b> ${stars}\n\n`
    : `<b>New ${rating}-star review</b> ${stars} ⚠️\n\n`;
  msg += `From: ${review.author_name || 'Anonymous'}\n`;
  msg += `Source: ${review.source}\n\n`;
  msg += `"${snippet}"`;

  if (!isPositive) {
    msg += '\n\n⚠️ This is a lower-rated review. Consider responding promptly.';
  }

  try {
    await bot.sendMessage(Number(client.telegram_chat_id), msg);
  } catch {
    // Don't fail the fetch job if notification fails
  }
}

export async function processFetchJob(
  job: FetchQueueMessage,
  db: D1Database,
  kv: KVNamespace,
  fetchFn: typeof fetch = fetch,
  botToken?: string,
): Promise<void> {
  const clientDb = forClient(db, job.client_id);

  for (const task of job.tasks) {
    try {
      switch (task) {
        case 'google': {
          const tokenInfo = await getToken(kv, job.client_id, 'google');
          if (!tokenInfo) {
            await logError(db, 'klyro-fetch', 'token_expired', `No Google API key for client ${job.client_id}`, job.client_id);
            break;
          }
          const reviews = await fetchGoogleReviews(
            job.client.google_place_id!,
            tokenInfo.token,
            fetchFn
          );
          for (const review of reviews) {
            await clientDb.reviews.upsert(review);
            if (botToken) {
              await handleNewReview({ ...review, source: 'google' }, clientDb, db, job.client_id, botToken).catch(() => {});
            }
          }
          break;
        }

        case 'instagram': {
          const tokenInfo = await getToken(kv, job.client_id, 'instagram');
          if (!tokenInfo) {
            await logError(db, 'klyro-fetch', 'token_expired', `No Instagram token for client ${job.client_id}`, job.client_id);
            break;
          }

          if (isTokenExpiringSoon(tokenInfo.expiresAt)) {
            try {
              const refreshed = await refreshInstagramToken(tokenInfo.token, fetchFn);
              const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
              await setToken(kv, job.client_id, 'instagram', refreshed.access_token, newExpiry);
              tokenInfo.token = refreshed.access_token;
            } catch (e) {
              await logError(db, 'klyro-fetch', 'token_expired', `Instagram token refresh failed for client ${job.client_id}: ${e}`, job.client_id);
            }
          }

          const posts = await fetchInstagramPosts(
            job.client.instagram_user_id!,
            tokenInfo.token,
            fetchFn
          );
          for (const post of posts) {
            await clientDb.instagram.upsert({
              ...post,
              media_url: post.media_url,
            });
          }
          break;
        }

        case 'facebook': {
          const tokenInfo = await getToken(kv, job.client_id, 'facebook');
          if (!tokenInfo) {
            await logError(db, 'klyro-fetch', 'token_expired', `No Facebook token for client ${job.client_id}`, job.client_id);
            break;
          }
          const fbReviews = await fetchFacebookReviews(
            job.client.facebook_page_id!,
            tokenInfo.token,
            fetchFn
          );
          for (const review of fbReviews) {
            await clientDb.reviews.upsert(review);
            if (botToken) {
              await handleNewReview({ ...review, source: 'facebook' }, clientDb, db, job.client_id, botToken).catch(() => {});
            }
          }
          break;
        }
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await logError(db, 'klyro-fetch', 'api_failure', `${task} fetch failed for client ${job.client_id}: ${message}`, job.client_id);
    }
  }
}

export default {
  async queue(batch: MessageBatch<FetchQueueMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        await processFetchJob(message.body, env.DB, env.KV, fetch, env.TELEGRAM_BOT_TOKEN);
        message.ack();
      } catch (e) {
        message.retry();
      }
    }
  },
};
