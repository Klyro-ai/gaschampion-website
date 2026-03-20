import { describe, it, expect, vi } from 'vitest';
import { TelegramBot } from '../../src/telegram/bot';

describe('TelegramBot', () => {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ ok: true, result: { message_id: 1 } }),
  });

  it('sends a text message', async () => {
    const bot = new TelegramBot('fake-token', mockFetch);
    await bot.sendMessage(12345, 'Hello');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('fake-token/sendMessage');
    const body = JSON.parse(opts.body);
    expect(body.chat_id).toBe(12345);
    expect(body.text).toBe('Hello');
  });

  it('sends a message with inline keyboard', async () => {
    mockFetch.mockClear();
    const bot = new TelegramBot('fake-token', mockFetch);
    await bot.sendMessage(12345, 'Choose:', {
      inline_keyboard: [[{ text: 'Yes', callback_data: 'yes' }]],
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.reply_markup.inline_keyboard[0][0].text).toBe('Yes');
  });

  it('answers a callback query', async () => {
    mockFetch.mockClear();
    const bot = new TelegramBot('fake-token', mockFetch);
    await bot.answerCallback('cb-123');

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('answerCallbackQuery');
  });

  it('edits a message', async () => {
    mockFetch.mockClear();
    const bot = new TelegramBot('fake-token', mockFetch);
    await bot.editMessage(12345, 99, 'Updated text');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.chat_id).toBe(12345);
    expect(body.message_id).toBe(99);
    expect(body.text).toBe('Updated text');
  });
});
