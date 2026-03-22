import type { Env, FetchQueueMessage } from './types';
import app from './api/index';
import { handleCron } from './cron/index';
import { sendWeeklyDigests } from './cron/weekly-digest';
import { processFetchJob } from './fetch-worker/index';

export default {
  // HTTP requests — handled by the Hono API app
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  },

  // Cron trigger — dispatches per-client fetch jobs to the queue, and sends weekly digest on Mondays
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        await handleCron(env.DB, env.FETCH_QUEUE);

        // Monday morning (UTC 8–10) — send weekly digests
        const now = new Date();
        const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon
        const hour = now.getUTCHours();
        if (dayOfWeek === 1 && hour >= 8 && hour < 10) {
          await sendWeeklyDigests(env.DB, env.TELEGRAM_BOT_TOKEN);
        }
      })()
    );
  },

  // Queue consumer — processes per-client fetch jobs
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
