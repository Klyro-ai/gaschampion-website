import type { Env, TelegramUpdate, Client } from '../types';

export interface RouteHandlers {
  adminHandler: (update: TelegramUpdate, env: Env) => Promise<void>;
  clientHandler: (update: TelegramUpdate, env: Env, client: Client, role: string) => Promise<void>;
  onboardHandler: (update: TelegramUpdate, env: Env, inviteToken: string) => Promise<void>;
  lookupUser?: (chatId: string) => Promise<{ client: Client; role: string } | null>;
}

export async function routeUpdate(
  update: TelegramUpdate,
  env: Env,
  handlers: RouteHandlers
): Promise<void> {
  const chatId = update.message?.chat.id ?? update.callback_query?.message?.chat.id;
  if (!chatId) return;

  const text = update.message?.text ?? '';

  // Check for deep link onboarding
  if (text.startsWith('/start invite_')) {
    const inviteToken = text.replace('/start ', '');
    await handlers.onboardHandler(update, env, inviteToken);
    return;
  }

  // Admin routing
  if (String(chatId) === env.ADMIN_CHAT_ID) {
    await handlers.adminHandler(update, env);
    return;
  }

  // Client routing — check if authorized user
  if (handlers.lookupUser) {
    const result = await handlers.lookupUser(String(chatId));
    if (result) {
      await handlers.clientHandler(update, env, result.client, result.role);
      return;
    }
  }

  // Unknown user — ignore or send generic message
  // (handled by the webhook endpoint, not the router)
}
