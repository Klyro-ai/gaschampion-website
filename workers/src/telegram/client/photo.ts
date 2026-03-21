import type { TelegramBot } from '../bot';
import type { WizardManager } from '../wizard';

/**
 * Store the file_id in KV and present short callback buttons.
 * Telegram callback_data has a 64-byte limit — file_ids are much longer.
 */
export async function handlePhotoReceived(
  bot: TelegramBot,
  chatId: number,
  fileId: string,
  kv: KVNamespace,
): Promise<void> {
  // Stash file_id in KV keyed by chat — overwritten on each new photo
  await kv.put(`pending_photo:${chatId}`, fileId, { expirationTtl: 3600 });

  await bot.sendMessage(chatId, 'What would you like to do with this?', {
    inline_keyboard: [[
      { text: '📝 Blog Post', callback_data: 'photo:blog' },
      { text: '🖼 Gallery', callback_data: 'photo:gallery' },
      { text: '📝+🖼 Both', callback_data: 'photo:both' },
    ]],
  });
}

export async function handlePhotoChoice(
  bot: TelegramBot,
  chatId: number,
  callbackData: string,
  wizard: WizardManager,
  clientId: string,
  kv: KVNamespace,
): Promise<void> {
  const choice = callbackData.split(':')[1]; // 'blog' | 'gallery' | 'both'

  // Retrieve stashed file_id
  const fileId = await kv.get(`pending_photo:${chatId}`);
  if (!fileId) {
    await bot.sendMessage(chatId, 'Photo expired — please send it again.');
    return;
  }

  if (choice === 'gallery') {
    // Gallery flow handled separately — return fileId for caller
    return;
  }

  // Blog or Both — start blog wizard
  const addToGallery = choice === 'both';
  await wizard.start(chatId, 'blog', 'awaiting_context', clientId);

  // Store file ID in wizard data for later upload
  await wizard.update(chatId, 'awaiting_context', {
    photoFileId: fileId,
    addToGallery: addToGallery ? 'true' : 'false',
  });

  await bot.sendMessage(
    chatId,
    'Tell me about this job:\n' +
    '• What work was done?\n' +
    '• What area? (town/village)\n' +
    '• Anything else to mention?\n\n' +
    'Just type it naturally, e.g. "Worcester boiler install, Clare, replaced 20 year old system"'
  );
}

/** Helper to get the pending photo file_id for gallery flow */
export async function getPendingPhotoFileId(kv: KVNamespace, chatId: number): Promise<string | null> {
  return kv.get(`pending_photo:${chatId}`);
}
