import type { Env, FetchQueueMessage } from '../types';

export async function handleCron(db: D1Database, queue: Queue<FetchQueueMessage>): Promise<void> {
  const result = await db
    .prepare('SELECT id, google_place_id, instagram_user_id, facebook_page_id FROM clients WHERE is_active = 1')
    .all<{ id: string; google_place_id: string | null; instagram_user_id: string | null; facebook_page_id: string | null }>();

  const messages = result.results.map((client) => {
    const tasks: ('instagram' | 'google' | 'facebook')[] = [];
    if (client.instagram_user_id) tasks.push('instagram');
    if (client.google_place_id) tasks.push('google');
    if (client.facebook_page_id) tasks.push('facebook');

    return {
      body: {
        client_id: client.id,
        client,
        tasks,
      } as FetchQueueMessage,
    };
  });

  if (messages.length > 0) {
    for (let i = 0; i < messages.length; i += 100) {
      await queue.sendBatch(messages.slice(i, i + 100));
    }
  }
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleCron(env.DB, env.FETCH_QUEUE));
  },
};
