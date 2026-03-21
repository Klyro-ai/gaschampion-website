import { describe, it, expect, vi } from 'vitest';
import { handlePhotoReceived, handlePhotoChoice } from '../../src/telegram/client/photo';

describe('handlePhotoReceived', () => {
  it('sends blog/gallery/both buttons', async () => {
    const bot = { sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }) };
    await handlePhotoReceived(bot as any, 123, 'file-id-abc');
    expect(bot.sendMessage).toHaveBeenCalledOnce();
    const [chatId, text, markup] = bot.sendMessage.mock.calls[0];
    expect(chatId).toBe(123);
    expect(text).toContain('What would you like to do');
    expect(markup.inline_keyboard).toHaveLength(1);
    expect(markup.inline_keyboard[0]).toHaveLength(3);
  });
});

describe('handlePhotoChoice', () => {
  it('starts blog wizard for blog choice', async () => {
    const wizard = {
      start: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
    };
    const bot = { sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }) };
    await handlePhotoChoice(bot as any, 123, 'photo:blog:file-id', wizard as any, 'client1');
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
    await handlePhotoChoice(bot as any, 123, 'photo:both:file-id', wizard as any, 'client1');
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
    await handlePhotoChoice(bot as any, 123, 'photo:gallery:file-id', wizard as any, 'client1');
    expect(wizard.start).not.toHaveBeenCalled();
  });
});
