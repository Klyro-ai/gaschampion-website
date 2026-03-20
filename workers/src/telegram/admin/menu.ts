import type { TelegramBot } from '../bot';
import type { WizardManager } from '../wizard';
import { getAllClients } from '../../db/client';

const ADMIN_PANEL_TEXT = `<b>Klyro Admin Panel</b>`;

const ADMIN_PANEL_KEYBOARD = {
  inline_keyboard: [
    [{ text: 'Add New Client', callback_data: 'admin:addclient' }],
    [
      { text: 'My Clients', callback_data: 'admin:clients' },
      { text: 'Recent Errors', callback_data: 'admin:errors' },
    ],
    [
      { text: 'Force Refresh', callback_data: 'admin:refresh' },
      { text: 'System Status', callback_data: 'admin:status' },
    ],
  ],
};

export async function handleAdminMessage(
  bot: TelegramBot,
  chatId: number,
  text: string,
  db: D1Database,
  wizard: WizardManager
): Promise<void> {
  // Check if in a wizard
  const wizState = wizard?.get ? await wizard.get(chatId) : null;
  if (wizState && wizState.type === 'addclient') {
    // Delegate to addclient wizard — imported separately
    return;
  }

  switch (text) {
    case '/start':
    case '/menu':
      await bot.sendMessage(chatId, ADMIN_PANEL_TEXT, ADMIN_PANEL_KEYBOARD);
      break;
    case '/clients':
      await showClients(bot, chatId, db);
      break;
    default:
      await bot.sendMessage(chatId, ADMIN_PANEL_TEXT, ADMIN_PANEL_KEYBOARD);
      break;
  }
}

export async function handleAdminCallback(
  bot: TelegramBot,
  chatId: number,
  messageId: number,
  callbackId: string,
  data: string,
  db: D1Database,
  wizard: WizardManager
): Promise<void> {
  await bot.answerCallback(callbackId);

  switch (data) {
    case 'admin:addclient':
      // Start addclient wizard — handled by addclient module
      break;
    case 'admin:clients':
      await showClients(bot, chatId, db);
      break;
    case 'admin:errors':
      await showErrors(bot, chatId, db);
      break;
    case 'admin:status':
      await showStatus(bot, chatId, db);
      break;
    default:
      break;
  }
}

async function showClients(bot: TelegramBot, chatId: number, db: D1Database): Promise<void> {
  const clients = await getAllClients(db);
  if (clients.length === 0) {
    await bot.sendMessage(chatId, 'No clients yet. Tap <b>Add New Client</b> to create one.', ADMIN_PANEL_KEYBOARD);
    return;
  }

  let text = '<b>Your Clients</b>\n\n';
  for (const c of clients) {
    const google = c.google_place_id ? '✓' : '✗';
    const insta = c.instagram_user_id ? '✓' : '✗';
    const fb = c.facebook_page_id ? '✓' : '✗';
    const status = c.telegram_chat_id === 'UNCLAIMED' ? '⏳ Invite pending' : (c.is_active ? '✓ Active' : '✗ Inactive');
    text += `<b>${c.business_name}</b> (${c.id})\n`;
    text += `  Status: ${status}\n`;
    text += `  Google: ${google}  Instagram: ${insta}  Facebook: ${fb}\n\n`;
  }

  await bot.sendMessage(chatId, text);
}

async function showErrors(bot: TelegramBot, chatId: number, db: D1Database): Promise<void> {
  const result = await db
    .prepare("SELECT * FROM error_log WHERE created_at > datetime('now', '-24 hours') ORDER BY created_at DESC LIMIT 10")
    .all();

  if (result.results.length === 0) {
    await bot.sendMessage(chatId, 'No errors in the last 24 hours. All good!');
    return;
  }

  let text = '<b>Recent Errors (24h)</b>\n\n';
  for (const err of result.results as any[]) {
    text += `<b>${err.worker}</b> — ${err.error_type}\n`;
    text += `${err.message}\n`;
    text += `<i>${err.created_at}</i>\n\n`;
  }

  await bot.sendMessage(chatId, text);
}

async function showStatus(bot: TelegramBot, chatId: number, db: D1Database): Promise<void> {
  const clientCount = await db.prepare('SELECT COUNT(*) as c FROM clients WHERE is_active = 1').first<{ c: number }>();
  const errorCount = await db.prepare("SELECT COUNT(*) as c FROM error_log WHERE created_at > datetime('now', '-24 hours')").first<{ c: number }>();
  const reviewCount = await db.prepare('SELECT COUNT(*) as c FROM reviews').first<{ c: number }>();

  const text = `<b>System Status</b>\n\n` +
    `Active clients: ${clientCount?.c ?? 0}\n` +
    `Total reviews: ${reviewCount?.c ?? 0}\n` +
    `Errors (24h): ${errorCount?.c ?? 0}\n` +
    `Environment: production`;

  await bot.sendMessage(chatId, text, ADMIN_PANEL_KEYBOARD);
}
