import { describe, it, expect, vi } from 'vitest';
import { handleBlogContext, handleBlogApprove, handleBlogReject, handleBlogEdit, formatPreview } from '../../src/telegram/client/blog';

describe('formatPreview', () => {
  it('truncates content for Telegram', () => {
    const preview = formatPreview({
      title: 'Test Title',
      description: 'Meta desc',
      content: 'Paragraph one.\n\nParagraph two.\n\nParagraph three.\n\nParagraph four.',
      tags: ['boiler', 'suffolk'],
      slug: 'test-title',
      image_alt_text: null,
    });
    expect(preview).toContain('<b>Test Title</b>');
    expect(preview).toContain('Meta desc');
    expect(preview).toContain('#boiler #suffolk');
    expect(preview.length).toBeLessThan(4096);
  });
});

describe('handleBlogContext', () => {
  it('calls AI writer and sends preview', async () => {
    const mockDraft = {
      title: 'Boiler Install in Clare',
      slug: 'boiler-install-clare',
      content: 'Content here',
      description: 'A boiler was installed',
      tags: ['boiler'],
      image_alt_text: null,
    };
    const bot = { sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }) };
    const wizard = {
      get: vi.fn().mockResolvedValue({
        type: 'blog', step: 'awaiting_context',
        clientId: 'gc', data: { photoFileId: 'f1', addToGallery: 'false' },
      }),
      update: vi.fn().mockResolvedValue(undefined),
    };
    const deps = {
      aiWriter: { generateDraft: vi.fn().mockResolvedValue(mockDraft) },
      createDraft: vi.fn().mockResolvedValue('post-id-1'),
      getClient: vi.fn().mockResolvedValue({ business_name: 'Gas Champion', r2_bucket_prefix: 'gc/' }),
      ensureUniqueSlug: vi.fn().mockResolvedValue('boiler-install-clare'),
    };

    await handleBlogContext(bot as any, 123, 'New boiler fitted in Clare', wizard as any, deps as any);
    expect(deps.aiWriter.generateDraft).toHaveBeenCalled();
    expect(deps.createDraft).toHaveBeenCalled();
    // Should send "Drafting..." then the preview
    expect(bot.sendMessage).toHaveBeenCalledTimes(2);
  });
});

describe('handleBlogApprove', () => {
  it('publishes the draft and clears wizard', async () => {
    const bot = { sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }) };
    const wizard = {
      get: vi.fn().mockResolvedValue({
        type: 'blog', step: 'preview',
        clientId: 'gc', data: { draftPostId: 'post-1', addToGallery: 'false' },
      }),
      clear: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
    };
    const deps = {
      publishPost: vi.fn().mockResolvedValue(undefined),
    };

    await handleBlogApprove(bot as any, 123, wizard as any, deps);
    expect(deps.publishPost).toHaveBeenCalledWith('post-1');
    expect(wizard.clear).toHaveBeenCalledWith(123);
  });
});

describe('handleBlogReject', () => {
  it('deletes draft and clears wizard', async () => {
    const bot = { sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }) };
    const wizard = {
      get: vi.fn().mockResolvedValue({
        type: 'blog', step: 'preview',
        clientId: 'gc', data: { draftPostId: 'post-1' },
      }),
      clear: vi.fn().mockResolvedValue(undefined),
    };
    const deps = {
      deletePost: vi.fn().mockResolvedValue(undefined),
    };

    await handleBlogReject(bot as any, 123, wizard as any, deps);
    expect(deps.deletePost).toHaveBeenCalledWith('post-1');
    expect(wizard.clear).toHaveBeenCalledWith(123);
  });
});

describe('handleBlogEdit', () => {
  it('sets wizard to editing and prompts user', async () => {
    const bot = { sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }) };
    const wizard = {
      get: vi.fn().mockResolvedValue({
        type: 'blog', step: 'preview',
        clientId: 'gc', data: { draftPostId: 'post-1' },
      }),
      update: vi.fn().mockResolvedValue(undefined),
    };

    await handleBlogEdit(bot as any, 123, wizard as any);
    expect(wizard.update).toHaveBeenCalledWith(123, 'editing');
    expect(bot.sendMessage).toHaveBeenCalled();
  });
});
