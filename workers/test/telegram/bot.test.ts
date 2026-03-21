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

  describe('getFile', () => {
    it('calls getFile API and returns file path', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true, result: { file_path: 'photos/file_123.jpg' } }))
      );
      const bot = new TelegramBot('test-token', mockFetch);
      const result = await bot.getFile('file-id-abc');
      expect(result).toBe('photos/file_123.jpg');
      expect(mockFetch).toHaveBeenCalledOnce();
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('/getFile');
    });
  });

  describe('getFileUrl', () => {
    it('constructs download URL from file path', () => {
      const bot = new TelegramBot('test-token');
      const url = bot.getFileUrl('photos/file_123.jpg');
      expect(url).toBe('https://api.telegram.org/file/bottest-token/photos/file_123.jpg');
    });
  });

  describe('sendPhoto', () => {
    it('calls sendPhoto API with photo URL and caption', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true, result: { message_id: 42 } }))
      );
      const bot = new TelegramBot('test-token', mockFetch);
      const result = await bot.sendPhoto(12345, 'https://example.com/photo.jpg', 'A caption');
      expect(result.message_id).toBe(42);
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('/sendPhoto');
    });
  });

  describe('deleteMessage', () => {
    it('calls deleteMessage API', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true, result: true }))
      );
      const bot = new TelegramBot('test-token', mockFetch);
      await bot.deleteMessage(12345, 99);
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('/deleteMessage');
    });
  });
});
