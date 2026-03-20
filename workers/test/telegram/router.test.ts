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
