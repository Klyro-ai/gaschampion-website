import type { TelegramBot } from '../bot';
import type { WizardManager } from '../wizard';

interface GalleryUploadDeps {
  downloadAndStore: (fileId: string, clientId: string) => Promise<{ r2Key: string; galleryId: string }>;
}

interface GalleryCaptionDeps {
  updateCaption: (galleryImageId: string, caption: string) => Promise<void>;
}

export async function handleGalleryUpload(
  bot: TelegramBot,
  chatId: number,
  fileId: string,
  wizard: WizardManager,
  clientId: string,
  deps: GalleryUploadDeps,
): Promise<void> {
  const { galleryId } = await deps.downloadAndStore(fileId, clientId);

  await wizard.start(chatId, 'gallery_caption', 'awaiting_caption', clientId);
  await wizard.update(chatId, 'awaiting_caption', { galleryImageId: galleryId });

  await bot.sendMessage(chatId, 'Added to your gallery! Want to add a caption?', {
    inline_keyboard: [[{ text: 'Skip', callback_data: 'gallery:skip_caption' }]],
  });
}

export async function handleGalleryCaption(
  bot: TelegramBot,
  chatId: number,
  text: string,
  wizard: WizardManager,
  deps: GalleryCaptionDeps,
): Promise<void> {
  const state = await wizard.get(chatId);
  if (!state || state.type !== 'gallery_caption') return;

  const galleryImageId = state.data.galleryImageId;
  await deps.updateCaption(galleryImageId, text);
  await wizard.clear(chatId);
  await bot.sendMessage(chatId, 'Gallery updated with caption.');
}

export async function handleGallerySkip(
  bot: TelegramBot,
  chatId: number,
  wizard: WizardManager,
): Promise<void> {
  await wizard.clear(chatId);
  await bot.sendMessage(chatId, 'Gallery image saved.');
}
