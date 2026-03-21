import { describe, it, expect, vi } from 'vitest';
import { handleGalleryUpload, handleGalleryCaption, handleGallerySkip } from '../../src/telegram/client/gallery';

describe('handleGalleryUpload', () => {
  it('adds image to gallery and asks for caption', async () => {
    const bot = {
      sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }),
    };
    const deps = {
      downloadAndStore: vi.fn().mockResolvedValue({ r2Key: 'gc/gallery/abc-0.original', galleryId: 'gal-1' }),
    };
    const wizard = {
      start: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
    };

    await handleGalleryUpload(bot as any, 123, 'file-id', wizard as any, 'client1', deps);
    expect(deps.downloadAndStore).toHaveBeenCalledWith('file-id', 'client1');
    expect(wizard.start).toHaveBeenCalledWith(123, 'gallery_caption', 'awaiting_caption', 'client1');
    expect(wizard.update).toHaveBeenCalledWith(123, 'awaiting_caption', { galleryImageId: 'gal-1' });
    expect(bot.sendMessage).toHaveBeenCalled();
    const msgText = bot.sendMessage.mock.calls[0][1];
    expect(msgText).toContain('gallery');
  });
});

describe('handleGalleryCaption', () => {
  it('updates caption and clears wizard', async () => {
    const bot = { sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }) };
    const deps = {
      updateCaption: vi.fn().mockResolvedValue(undefined),
    };
    const wizard = {
      get: vi.fn().mockResolvedValue({
        type: 'gallery_caption', step: 'awaiting_caption',
        clientId: 'client1', data: { galleryImageId: 'gal-1' },
      }),
      clear: vi.fn().mockResolvedValue(undefined),
    };

    await handleGalleryCaption(bot as any, 123, 'A nice boiler', wizard as any, deps);
    expect(deps.updateCaption).toHaveBeenCalledWith('gal-1', 'A nice boiler');
    expect(wizard.clear).toHaveBeenCalledWith(123);
    expect(bot.sendMessage).toHaveBeenCalled();
  });

  it('does nothing if no wizard state', async () => {
    const bot = { sendMessage: vi.fn() };
    const deps = { updateCaption: vi.fn() };
    const wizard = { get: vi.fn().mockResolvedValue(null), clear: vi.fn() };

    await handleGalleryCaption(bot as any, 123, 'text', wizard as any, deps);
    expect(deps.updateCaption).not.toHaveBeenCalled();
  });
});

describe('handleGallerySkip', () => {
  it('clears wizard and confirms', async () => {
    const bot = { sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }) };
    const wizard = { clear: vi.fn().mockResolvedValue(undefined) };

    await handleGallerySkip(bot as any, 123, wizard as any);
    expect(wizard.clear).toHaveBeenCalledWith(123);
    expect(bot.sendMessage).toHaveBeenCalled();
  });
});
