import { describe, it, expect, vi } from 'vitest';

describe('Cron Dispatcher', () => {
  it('enqueues a message per active client', async () => {
    const mockDB = {
      prepare: vi.fn().mockReturnValue({
        all: vi.fn().mockResolvedValue({
          results: [
            { id: 'client-1', google_place_id: 'ChIJ1', instagram_user_id: 'ig1', facebook_page_id: 'fb1' },
            { id: 'client-2', google_place_id: 'ChIJ2', instagram_user_id: null, facebook_page_id: 'fb2' },
          ],
        }),
      }),
    };

    const sentMessages: any[] = [];
    const mockQueue = {
      sendBatch: vi.fn().mockImplementation((msgs: any[]) => {
        sentMessages.push(...msgs);
        return Promise.resolve();
      }),
    };

    const { handleCron } = await import('../../src/cron/index');
    await handleCron(mockDB as any, mockQueue as any);

    expect(mockQueue.sendBatch).toHaveBeenCalledOnce();
    expect(sentMessages).toHaveLength(2);

    // Client 2 should not have 'instagram' in tasks (no instagram_user_id)
    const client2Msg = sentMessages.find((m: any) => m.body.client_id === 'client-2');
    expect(client2Msg.body.tasks).not.toContain('instagram');
    expect(client2Msg.body.tasks).toContain('facebook');
  });
});
