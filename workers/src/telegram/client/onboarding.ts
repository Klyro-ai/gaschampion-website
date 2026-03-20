import type { TelegramBot } from '../bot';
import type { WizardManager } from '../wizard';

interface OnboardingDeps {
  claimInvite: (token: string, chatId: string) => Promise<string | null>;
  getClient: (clientId: string) => Promise<any>;
  updateGooglePlaceId?: (clientId: string, placeId: string | null) => Promise<void>;
  updateQuietHours?: (clientId: string, start: string, end: string) => Promise<void>;
  searchGooglePlaces?: (query: string, apiKey: string) => Promise<Array<{ placeId: string; name: string; address: string }>>;
  extractPlaceId?: (url: string) => string | null;
  oauthBaseUrl?: string;
}

export async function handleOnboarding(
  bot: TelegramBot,
  chatId: number,
  text: string | null,
  callbackData: string | null,
  wizard: WizardManager,
  deps: OnboardingDeps
): Promise<void> {
  const state = await wizard.get(chatId);

  // Deep link entry — claim invite
  if (text && text.startsWith('invite_')) {
    const clientId = await deps.claimInvite(text, String(chatId));
    if (!clientId) {
      await bot.sendMessage(chatId, 'This invite link has expired or is invalid.\nPlease contact your Klyro admin for a new link.');
      return;
    }

    const client = await deps.getClient(clientId);
    await wizard.start(chatId, 'onboarding', 'google', clientId);

    // Welcome message
    await bot.sendMessage(
      chatId,
      `Welcome to Klyro! I'm your website manager for <b>${client.business_name}</b>.\n\n` +
      `I keep your site updated automatically with fresh reviews, Instagram posts, and more.\n\n` +
      `Let's get you connected — it only takes a couple of minutes.`
    );

    // Immediately ask about Google
    await bot.sendMessage(
      chatId,
      `First, let's connect your Google Reviews.\n\n` +
      `If you have your Google Maps link handy, paste it here. It looks like:\nhttps://maps.google.com/maps?cid=1234...\n\n` +
      `Or just tell me your business name and town and I'll find you.`,
      {
        inline_keyboard: [[{ text: 'Skip for now', callback_data: 'onboard:skip_google' }]],
      }
    );
    return;
  }

  if (!state || state.type !== 'onboarding') return;

  switch (state.step) {
    case 'google': {
      if (callbackData === 'onboard:skip_google') {
        await wizard.update(chatId, 'social', { google: 'skipped' });
        await sendSocialStep(bot, chatId, state.clientId!, deps);
        return;
      }

      if (text) {
        // Try to extract Place ID from URL
        const placeId = deps.extractPlaceId?.(text);
        if (placeId) {
          await deps.updateGooglePlaceId?.(state.clientId!, placeId);
          await wizard.update(chatId, 'social', { google: 'connected' });
          await bot.sendMessage(chatId, 'Google Reviews connected!');
          await sendSocialStep(bot, chatId, state.clientId!, deps);
          return;
        }

        // Otherwise treat as search query
        if (deps.searchGooglePlaces) {
          // Search and show results — simplified for now
          await bot.sendMessage(
            chatId,
            "I'll search for that. For now, you can connect Google later via /connect.",
            { inline_keyboard: [[{ text: 'Continue setup', callback_data: 'onboard:skip_google' }]] }
          );
          return;
        }
      }
      break;
    }

    case 'social': {
      if (callbackData === 'onboard:skip_social') {
        await wizard.update(chatId, 'hours', { social: 'skipped' });
        await sendHoursStep(bot, chatId);
        return;
      }
      // OAuth callback will advance to hours step via a separate mechanism
      break;
    }

    case 'hours': {
      let start = '09:00';
      let end = '18:00';

      if (callbackData === 'onboard:hours_9_18') {
        start = '09:00'; end = '18:00';
      } else if (callbackData === 'onboard:hours_8_20') {
        start = '08:00'; end = '20:00';
      } else if (callbackData === 'onboard:hours_always') {
        start = '00:00'; end = '23:59';
      } else if (callbackData === 'onboard:hours_custom') {
        await bot.sendMessage(chatId, 'Send me your preferred hours in the format: HH:MM-HH:MM\nExample: 07:30-19:00');
        return;
      } else if (text && text.match(/^\d{2}:\d{2}-\d{2}:\d{2}$/)) {
        [start, end] = text.split('-');
      } else {
        return;
      }

      await deps.updateQuietHours?.(state.clientId!, start, end);
      await wizard.clear(chatId);

      // Show setup complete
      const client = await deps.getClient?.(state.clientId!);
      const google = client?.google_place_id ? `Google Reviews: connected` : `Google Reviews: skipped`;
      const insta = client?.instagram_user_id ? `Instagram: connected` : `Instagram: skipped`;
      const fb = client?.facebook_page_id ? `Facebook: connected` : `Facebook: skipped`;

      await bot.sendMessage(
        chatId,
        `You're all set! Here's your setup:\n\n` +
        `  ${google}\n` +
        `  ${insta}\n` +
        `  ${fb}\n` +
        `  Notifications: ${start} - ${end}\n\n` +
        `I'll start syncing your content now.\n\n` +
        `Here's what you can do anytime:\n\n` +
        `  /reviews  — approve new reviews\n` +
        `  /newpost  — create a blog post\n` +
        `  /gallery  — upload photos\n` +
        `  /status   — check everything's running\n` +
        `  /connect  — change connected services\n` +
        `  /hours    — change notification times\n` +
        `  /help     — full guide`
      );
      break;
    }
  }
}

async function sendSocialStep(bot: TelegramBot, chatId: number, clientId: string, deps: OnboardingDeps): Promise<void> {
  const buttons: Array<Array<{ text: string; callback_data?: string; url?: string }>> = [];

  if (deps.oauthBaseUrl) {
    buttons.push([{ text: 'Connect Instagram & Facebook', url: `${deps.oauthBaseUrl}/auth/facebook?client_id=${clientId}&chat_id=${chatId}` }]);
  }
  buttons.push([{ text: 'Skip for now', callback_data: 'onboard:skip_social' }]);

  await bot.sendMessage(
    chatId,
    `Now let's connect your Instagram & Facebook.\n\n` +
    `This links both at once — I'll pull in your Instagram posts and Facebook reviews automatically.\n\n` +
    `Tap the button below to log in through Facebook:`,
    { inline_keyboard: buttons }
  );
}

async function sendHoursStep(bot: TelegramBot, chatId: number): Promise<void> {
  await bot.sendMessage(
    chatId,
    `Last step — when should I send you notifications?\n\n` +
    `I'll queue anything outside these hours and send a morning summary instead.`,
    {
      inline_keyboard: [
        [
          { text: '9am - 6pm', callback_data: 'onboard:hours_9_18' },
          { text: '8am - 8pm', callback_data: 'onboard:hours_8_20' },
        ],
        [
          { text: 'Custom', callback_data: 'onboard:hours_custom' },
          { text: 'Always on', callback_data: 'onboard:hours_always' },
        ],
      ],
    }
  );
}
