import { describe, it, expect, vi } from 'vitest';
import { handlePhotoReceived, handlePhotoChoice } from '../../src/telegram/client/photo';

describe('handlePhotoReceived', () => {
  it('stashes file_id in KV and sends short callback buttons', async () => {
    const bot = { sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }) };
    const kv = { put: vi.fn().mockResolvedValue(undefined) };
    await handlePhotoReceived(bot as any, 123, 'file-id-abc', kv as any);
    expect(kv.put).toHaveBeenCalledWith('pending_photo:123', 'file-id-abc', { expirationTtl: 3600 });
    expect(bot.sendMessage).toHaveBeenCalledOnce();
    const [chatId, text, markup] = bot.sendMessage.mock.calls[0];
    expect(chatId).toBe(123);
    expect(text).toContain('What would you like to do');
    expect(markup.inline_keyboard).toHaveLength(1);
    expect(markup.inline_keyboard[0]).toHaveLength(3);
    // Callback data should be short — no file_id embedded
    expect(markup.inline_keyboard[0][0].callback_data).toBe('photo:blog');
    expect(markup.inline_keyboard[0][1].callback_data).toBe('photo:gallery');
    expect(markup.inline_keyboard[0][2].callback_data).toBe('photo:both');
  });
});

describe('handlePhotoChoice', () => {
  it('starts blog wizard for blog choice', async () => {
    const wizard = {
      start: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
    };
    const bot = { sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }) };
    const kv = { get: vi.fn().mockResolvedValue('file-id') };
    await handlePhotoChoice(bot as any, 123, 'photo:blog', wizard as any, 'client1', kv as any);
    expect(kv.get).toHaveBeenCalledWith('pending_photo:123');
    expect(wizard.start).toHaveBeenCalledWith(123, 'blog', 'awaiting_context', 'client1');
    expect(wizard.update).toHaveBeenCalledWith(123, 'awaiting_context', {
      photoFileId: 'file-id',
      addToGallery: 'false',
    });
  });

  it('sets addToGallery for both choice', async () => {
    const wizard = {
      start: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
    };
    const bot = { sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }) };
    const kv = { get: vi.fn().mockResolvedValue('file-id') };
    await handlePhotoChoice(bot as any, 123, 'photo:both', wizard as any, 'client1', kv as any);
    expect(wizard.update).toHaveBeenCalledWith(123, 'awaiting_context', {
      photoFileId: 'file-id',
      addToGallery: 'true',
    });
  });

  it('returns early for gallery choice', async () => {
    const wizard = {
      start: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
    };
    const bot = { sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }) };
    const kv = { get: vi.fn().mockResolvedValue('file-id') };
    await handlePhotoChoice(bot as any, 123, 'photo:gallery', wizard as any, 'client1', kv as any);
    expect(wizard.start).not.toHaveBeenCalled();
  });

  it('handles expired photo gracefully', async () => {
    const wizard = { start: vi.fn(), update: vi.fn() };
    const bot = { sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }) };
    const kv = { get: vi.fn().mockResolvedValue(null) };
    await handlePhotoChoice(bot as any, 123, 'photo:blog', wizard as any, 'client1', kv as any);
    expect(wizard.start).not.toHaveBeenCalled();
    expect(bot.sendMessage).toHaveBeenCalledWith(123, 'Photo expired — please send it again.');
  });
});
