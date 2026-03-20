import type { TelegramBot } from '../bot';
import type { Client } from '../../types';

interface ConnectDeps {
  updateGooglePlaceId?: (clientId: string, placeId: string | null) => Promise<void>;
  updateSocialIds?: (clientId: string, igId: string | null, fbId: string | null) => Promise<void>;
  deleteTokens?: (clientId: string, provider: string) => Promise<void>;
  oauthBaseUrl?: string;
}

export async function handleConnect(
  bot: TelegramBot,
  chatId: number,
  callbackData: string | null,
  client: Client,
  deps: ConnectDeps
): Promise<void> {
  // Handle disconnect callbacks
  if (callbackData === 'connect:disconnect_google') {
    await deps.updateGooglePlaceId?.(client.id, null);
    await bot.sendMessage(
      chatId,
      'Google Reviews disconnected.\n\nGoogle reviews will no longer be fetched. Your existing reviews stay on the site.\n\nYou can reconnect anytime with /connect.'
    );
    return;
  }

  if (callbackData === 'connect:disconnect_social') {
    await deps.updateSocialIds?.(client.id, null, null);
    await deps.deleteTokens?.(client.id, 'instagram');
    await deps.deleteTokens?.(client.id, 'facebook');
    await bot.sendMessage(
      chatId,
      'Instagram & Facebook disconnected.\n\nInstagram posts will no longer sync and Facebook reviews won\'t be fetched. Your existing content stays on the site.\n\nYou can reconnect anytime with /connect.'
    );
    return;
  }

  // Show connection status
  const buttons: Array<Array<{ text: string; callback_data?: string; url?: string }>> = [];
  let text = '<b>Your connections:</b>\n\n';

  if (client.google_place_id) {
    text += `<b>Google Reviews:</b> connected\n  [Disconnect below]\n\n`;
    buttons.push([{ text: 'Disconnect Google', callback_data: 'connect:disconnect_google' }]);
  } else {
    text += `<b>Google Reviews:</b> not connected\n\n`;
    buttons.push([{ text: 'Connect Google Reviews', callback_data: 'connect:setup_google' }]);
  }

  if (client.instagram_user_id || client.facebook_page_id) {
    text += `<b>Instagram & Facebook:</b> connected\n  [Disconnect below]\n\n`;
    buttons.push([{ text: 'Disconnect Instagram & Facebook', callback_data: 'connect:disconnect_social' }]);
  } else {
    text += `<b>Instagram & Facebook:</b> not connected\n\n`;
    if (deps.oauthBaseUrl) {
      buttons.push([{ text: 'Connect Instagram & Facebook', url: `${deps.oauthBaseUrl}/auth/facebook?client_id=${client.id}&chat_id=${chatId}` }]);
    }
  }

  await bot.sendMessage(chatId, text, { inline_keyboard: buttons });
}
