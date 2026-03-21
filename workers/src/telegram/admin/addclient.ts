import type { TelegramBot } from '../bot';
import type { WizardManager } from '../wizard';
import { createClient, createInviteToken } from '../../db/client';

export async function handleAddClientStep(
  bot: TelegramBot,
  chatId: number,
  text: string | null,
  callbackData: string | null,
  wizard: WizardManager,
  db: D1Database
): Promise<void> {
  const state = await wizard.get(chatId);

  // No wizard state — start fresh
  if (!state || state.type !== 'addclient') {
    await wizard.start(chatId, 'addclient', 'ask_name');
    await bot.sendMessage(chatId, "Let's set up a new client.\n\nWhat's the business name?");
    return;
  }

  switch (state.step) {
    case 'ask_name': {
      if (!text) return;
      await wizard.update(chatId, 'ask_id', { business_name: text });
      await bot.sendMessage(
        chatId,
        "Got it. Now I need a short ID for this client — lowercase, no spaces. " +
        "This is used internally for the database and file storage.\n\n" +
        "Example: gas-champion, smiths-plumbing\n\nWhat ID would you like?"
      );
      break;
    }

    case 'ask_id': {
      if (!text) return;
      const id = text.toLowerCase().replace(/\s+/g, '-');
      await wizard.update(chatId, 'ask_project', { client_id: id });
      await bot.sendMessage(
        chatId,
        "What's their Cloudflare Pages project name?\n" +
        "(This is the project you created in Cloudflare Pages that hosts their website)"
      );
      break;
    }

    case 'ask_project': {
      if (!text) return;
      await wizard.update(chatId, 'confirm', { pages_project: text });
      const data = { ...state.data, pages_project: text };
      await bot.sendMessage(
        chatId,
        `Here's what I'll create:\n\n` +
        `  Business:      ${data.business_name}\n` +
        `  Client ID:     ${data.client_id}\n` +
        `  Pages project: ${text}\n` +
        `  Storage prefix: ${data.client_id}/\n\n` +
        `This will:\n` +
        `- Create the client in the database\n` +
        `- Set up their storage folder\n` +
        `- Generate an invite link for the owner\n\n` +
        `Go ahead?`,
        {
          inline_keyboard: [
            [
              { text: 'Yes', callback_data: 'addclient:confirm' },
              { text: 'Cancel', callback_data: 'addclient:cancel' },
            ],
          ],
        }
      );
      break;
    }

    case 'confirm': {
      if (callbackData === 'addclient:cancel') {
        await wizard.clear(chatId);
        await bot.sendMessage(chatId, 'Cancelled. No client was created.');
        return;
      }

      if (callbackData === 'addclient:confirm') {
        const data = state.data;
        try {
          await createClient(db, {
            id: data.client_id,
            business_name: data.business_name,
            pages_project_name: data.pages_project,
            r2_bucket_prefix: `${data.client_id}/`,
          });

          const token = await createInviteToken(db, data.client_id);
          await wizard.clear(chatId);

          await bot.sendMessage(
            chatId,
            `Client created: <b>${data.business_name}</b>\n\n` +
            `Send this link to the business owner to start their setup:\n\n` +
            `https://t.me/KlyroWebsiteBot?start=${token}\n\n` +
            `The invite expires in 7 days. Use /clients to see all your clients anytime.`
          );
        } catch (e) {
          await wizard.clear(chatId);
          const message = e instanceof Error ? e.message : String(e);
          await bot.sendMessage(chatId, `Error creating client: ${message}`);
        }
      }
      break;
    }
  }
}
