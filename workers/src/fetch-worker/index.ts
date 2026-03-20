import type { Env, FetchQueueMessage } from '../types';
import { forClient } from '../db/client';
import { fetchGoogleReviews } from '../services/google-reviews';
import { fetchInstagramPosts, refreshInstagramToken } from '../services/instagram';
import { fetchFacebookReviews } from '../services/facebook-reviews';
import { getToken, setToken, isTokenExpiringSoon } from '../utils/tokens';
import { logError } from '../utils/errors';

export async function processFetchJob(
  job: FetchQueueMessage,
  db: D1Database,
  kv: KVNamespace,
  fetchFn: typeof fetch = fetch
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
          const reviews = await fetchFacebookReviews(
            job.client.facebook_page_id!,
            tokenInfo.token,
            fetchFn
          );
          for (const review of reviews) {
            await clientDb.reviews.upsert(review);
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
        await processFetchJob(message.body, env.DB, env.KV);
        message.ack();
      } catch (e) {
        message.retry();
      }
    }
  },
};
