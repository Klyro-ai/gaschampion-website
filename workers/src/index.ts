import type { Env, FetchQueueMessage } from './types';
import app from './api/index';
import { handleCron } from './cron/index';
import { processFetchJob } from './fetch-worker/index';

export default {
  // HTTP requests — handled by the Hono API app
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  },

  // Cron trigger — dispatches per-client fetch jobs to the queue
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleCron(env.DB, env.FETCH_QUEUE));
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
