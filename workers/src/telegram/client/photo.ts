import type { TelegramBot } from '../bot';
import type { WizardManager } from '../wizard';

export async function handlePhotoReceived(
  bot: TelegramBot,
  chatId: number,
  fileId: string,
): Promise<void> {
  await bot.sendMessage(chatId, 'What would you like to do with this?', {
    inline_keyboard: [[
      { text: '📝 Blog Post', callback_data: `photo:blog:${fileId}` },
      { text: '🖼 Gallery', callback_data: `photo:gallery:${fileId}` },
      { text: '📝+🖼 Both', callback_data: `photo:both:${fileId}` },
    ]],
  });
}

export async function handlePhotoChoice(
  bot: TelegramBot,
  chatId: number,
  callbackData: string,
  wizard: WizardManager,
  clientId: string,
): Promise<void> {
  const parts = callbackData.split(':');
  const choice = parts[1]; // 'blog' | 'gallery' | 'both'
  const fileId = parts.slice(2).join(':');

  if (choice === 'gallery') {
    // Gallery flow handled separately
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
