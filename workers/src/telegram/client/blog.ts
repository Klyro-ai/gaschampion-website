import type { TelegramBot } from '../bot';
import type { WizardManager } from '../wizard';
import type { AiWriter } from '../../services/ai-writer';
import type { BlogDraftOutput } from '../../services/ai-prompts';

interface BlogContextDeps {
  aiWriter: AiWriter;
  createDraft: (post: {
    title: string; slug: string; content: string;
    description: string | null; tags: string | null; status: string;
    image_url: string | null; image_alt_text: string | null;
    scheduled_publish_at: string | null;
  }) => Promise<string>;
  getClient: (clientId: string) => Promise<{ business_name: string; r2_bucket_prefix: string } | null>;
  ensureUniqueSlug: (slug: string) => Promise<string>;
}

interface BlogActionDeps {
  publishPost: (postId: string) => Promise<void>;
  addToGallery?: (r2Key: string, altText: string | null) => Promise<void>;
}

interface BlogEditDeps {
  aiWriter: AiWriter;
  updateDraft: (postId: string, fields: Record<string, string | null>) => Promise<void>;
  getDraft: (postId: string) => Promise<{ content: string; title: string } | null>;
}

export function formatPreview(draft: BlogDraftOutput): string {
  const tags = draft.tags.map(t => `#${t}`).join(' ');
  const contentLines = draft.content.split('\n\n');
  const preview = contentLines.slice(0, 3).join('\n\n');
  const wordCount = draft.content.split(/\s+/).length;

  let text = `<b>${draft.title}</b>\n\n`;
  text += `<i>${draft.description}</i>\n\n`;
  text += preview;
  text += `\n\n${tags}`;
  text += `\n\n<i>Full post: ~${wordCount} words</i>`;

  // Truncate if over Telegram limit
  if (text.length > 4000) {
    text = text.slice(0, 3950) + '\n\n<i>... (truncated)</i>';
  }
  return text;
}

export async function handleBlogContext(
  bot: TelegramBot,
  chatId: number,
  caption: string,
  wizard: WizardManager,
  deps: BlogContextDeps,
): Promise<void> {
  const state = await wizard.get(chatId);
  if (!state || state.type !== 'blog') return;

  const client = await deps.getClient(state.clientId!);
  if (!client) return;

  await bot.sendMessage(chatId, 'Drafting your post...');
  await wizard.update(chatId, 'generating', { caption });

  try {
    const draft = await deps.aiWriter.generateDraft({
      businessName: client.business_name,
      serviceArea: 'Suffolk and surrounding areas',
      caption,
      hasPhoto: !!state.data.photoFileId,
    });

    const uniqueSlug = await deps.ensureUniqueSlug(draft.slug);

    const postId = await deps.createDraft({
      title: draft.title,
      slug: uniqueSlug,
      content: draft.content,
      description: draft.description,
      tags: JSON.stringify(draft.tags),
      status: 'draft',
      image_url: state.data.photoR2Key || null,
      image_alt_text: draft.image_alt_text,
      scheduled_publish_at: null,
    });

    await wizard.update(chatId, 'preview', { draftPostId: postId });

    const preview = formatPreview(draft);
    await bot.sendMessage(chatId, preview, {
      inline_keyboard: [
        [
          { text: '✅ Approve', callback_data: 'blog:approve' },
          { text: '✏️ Edit', callback_data: 'blog:edit' },
          { text: '❌ Reject', callback_data: 'blog:reject' },
        ],
      ],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('AI draft error:', msg);
    await wizard.clear(chatId);
    await bot.sendMessage(chatId, "Sorry, I couldn't generate a draft right now. Try again or use /newpost.");
  }
}

export async function handleBlogApprove(
  bot: TelegramBot,
  chatId: number,
  wizard: WizardManager,
  deps: BlogActionDeps,
): Promise<void> {
  const state = await wizard.get(chatId);
  if (!state || state.type !== 'blog') return;

  const postId = state.data.draftPostId;
  await deps.publishPost(postId);

  // If "Both" was selected, add photo to gallery
  if (state.data.addToGallery === 'true' && state.data.photoR2Key) {
    await deps.addToGallery?.(state.data.photoR2Key, state.data.imageAltText || null);
    await wizard.clear(chatId);
    await bot.sendMessage(chatId, 'Published and added to your gallery!');
    return;
  }

  // If blog only with photo, ask about gallery
  if (state.data.photoR2Key) {
    await wizard.update(chatId, 'ask_gallery');
    await bot.sendMessage(chatId, 'Published! Also add this photo to your gallery?', {
      inline_keyboard: [
        [
          { text: 'Yes', callback_data: 'blog:gallery_yes' },
          { text: 'No', callback_data: 'blog:gallery_no' },
        ],
      ],
    });
    return;
  }

  await wizard.clear(chatId);
  await bot.sendMessage(chatId, 'Published!');
}

export async function handleBlogReject(
  bot: TelegramBot,
  chatId: number,
  wizard: WizardManager,
  deps: { deletePost: (postId: string) => Promise<void> },
): Promise<void> {
  const state = await wizard.get(chatId);
  if (!state || state.type !== 'blog') return;

  await deps.deletePost(state.data.draftPostId);
  await wizard.clear(chatId);
  await bot.sendMessage(chatId, 'Draft discarded.');
}

export async function handleBlogEdit(
  bot: TelegramBot,
  chatId: number,
  wizard: WizardManager,
): Promise<void> {
  const state = await wizard.get(chatId);
  if (!state || state.type !== 'blog') return;

  await wizard.update(chatId, 'editing');
  await bot.sendMessage(
    chatId,
    'Send me the updated text, or tell me what to change.\n' +
    'e.g. "change the title to..." or "add a section about..."'
  );
}

export async function handleBlogEditResponse(
  bot: TelegramBot,
  chatId: number,
  editInstruction: string,
  wizard: WizardManager,
  deps: BlogEditDeps,
): Promise<void> {
  const state = await wizard.get(chatId);
  if (!state || state.type !== 'blog' || state.step !== 'editing') return;

  const postId = state.data.draftPostId;
  const existing = await deps.getDraft(postId);
  if (!existing) return;

  await bot.sendMessage(chatId, 'Updating your post...');

  try {
    const existingJson = JSON.stringify({
      title: existing.title,
      content: existing.content,
    });
    const updated = await deps.aiWriter.editDraft(existingJson, editInstruction);

    await deps.updateDraft(postId, {
      title: updated.title,
      content: updated.content,
      description: updated.description,
      tags: JSON.stringify(updated.tags),
    });

    await wizard.update(chatId, 'preview');

    const preview = formatPreview(updated);
    await bot.sendMessage(chatId, preview, {
      inline_keyboard: [
        [
          { text: '✅ Approve', callback_data: 'blog:approve' },
          { text: '✏️ Edit', callback_data: 'blog:edit' },
          { text: '❌ Reject', callback_data: 'blog:reject' },
        ],
      ],
    });
  } catch (e) {
    console.error('AI edit error:', e);
    await bot.sendMessage(chatId, "Couldn't apply that edit. Try again or approve as-is.");
    await wizard.update(chatId, 'preview');
  }
}
