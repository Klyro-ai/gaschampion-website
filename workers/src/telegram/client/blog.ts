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
  getClient: (clientId: string) => Promise<{ business_name: string; r2_bucket_prefix: string; site_config?: string } | null>;
  ensureUniqueSlug: (slug: string) => Promise<string>;
  downloadPhoto?: (fileId: string, clientId: string) => Promise<{ r2Key: string; galleryId: string }>;
  previewBaseUrl?: string;
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

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function formatPreview(draft: BlogDraftOutput): string {
  const tags = draft.tags.map(t => `#${t.replace(/[^a-zA-Z0-9_]/g, '')}`).join(' ');
  // Strip markdown formatting for preview, keep plain text
  const plainContent = draft.content
    .replace(/^#{1,3}\s+/gm, '') // strip heading markers
    .replace(/\*\*(.+?)\*\*/g, '$1') // strip bold
    .replace(/\*(.+?)\*/g, '$1') // strip italic
    .replace(/^[*-]\s+/gm, '• ') // convert list markers to bullets
    .replace(/^>\s+/gm, ''); // strip blockquotes
  const contentLines = plainContent.split('\n\n');
  const preview = escapeHtml(contentLines.slice(0, 3).join('\n\n'));
  const wordCount = draft.content.split(/\s+/).length;

  let text = `<b>${escapeHtml(draft.title)}</b>\n\n`;
  text += `<i>${escapeHtml(draft.description)}</i>\n\n`;
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
    // Download photo to R2 if one was attached
    let photoR2Key: string | null = null;
    if (state.data.photoFileId && deps.downloadPhoto) {
      const { r2Key } = await deps.downloadPhoto(state.data.photoFileId, state.clientId!);
      photoR2Key = r2Key;
      await wizard.update(chatId, 'generating', { photoR2Key: r2Key });
    }

    // Parse site_config for enriched prompt data
    const siteConfig = client.site_config ? JSON.parse(client.site_config) : {};

    const draft = await deps.aiWriter.generateDraft({
      businessName: client.business_name,
      serviceArea: siteConfig.address?.town
        ? `${siteConfig.address.town}, ${siteConfig.address.county || 'Suffolk'} and surrounding areas`
        : 'Suffolk and surrounding areas',
      caption,
      hasPhoto: !!state.data.photoFileId,
      phone: siteConfig.phone,
      yearsExperience: siteConfig.yearsExperience,
      registrationNumber: siteConfig.registrationNumber,
      nearbyAreas: siteConfig.serviceAreas?.slice(0, 5),
      ctaConfig: siteConfig.ctaConfig,
      currentMonth: new Date().toLocaleString('en-GB', { month: 'long' }),
    });

    const uniqueSlug = await deps.ensureUniqueSlug(draft.slug);

    const postId = await deps.createDraft({
      title: draft.title,
      slug: uniqueSlug,
      content: draft.content,
      description: draft.description,
      tags: JSON.stringify(draft.tags),
      status: 'draft',
      image_url: photoR2Key,
      image_alt_text: draft.image_alt_text,
      scheduled_publish_at: null,
    });

    await wizard.update(chatId, 'preview', { draftPostId: postId });

    const preview = formatPreview(draft);
    const previewUrl = deps.previewBaseUrl
      ? `${deps.previewBaseUrl}/api/${state.clientId}/blog/preview/${postId}`
      : null;
    const previewLink = previewUrl ? `\n\n<a href="${previewUrl}">View full preview</a>` : '';
    await bot.sendMessage(chatId, preview + previewLink, {
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
    const stack = e instanceof Error ? e.stack : '';
    console.error('AI draft error:', msg, stack);
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
