import { describe, it, expect, vi } from 'vitest';
import { handleAdminMessage, handleAdminCallback } from '../../../src/telegram/admin/menu';

describe('Admin Menu', () => {
  const mockBot = {
    sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }),
    answerCallback: vi.fn().mockResolvedValue(undefined),
    editMessage: vi.fn().mockResolvedValue(undefined),
  };

  it('sends admin panel on /start', async () => {
    await handleAdminMessage(mockBot as any, 11111, '/start', {} as any, {} as any);

    expect(mockBot.sendMessage).toHaveBeenCalledOnce();
    const [chatId, text, markup] = mockBot.sendMessage.mock.calls[0];
    expect(chatId).toBe(11111);
    expect(text).toContain('Klyro Admin Panel');
    expect(markup.inline_keyboard).toBeDefined();
    expect(markup.inline_keyboard.length).toBeGreaterThan(0);
  });

  it('sends admin panel on /menu', async () => {
    mockBot.sendMessage.mockClear();
    await handleAdminMessage(mockBot as any, 11111, '/menu', {} as any, {} as any);

    expect(mockBot.sendMessage).toHaveBeenCalledOnce();
    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('Klyro Admin Panel');
  });
});
