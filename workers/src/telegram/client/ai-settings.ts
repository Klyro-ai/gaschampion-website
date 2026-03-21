import type { TelegramBot } from '../bot';
import type { WizardManager } from '../wizard';

const providerNames: Record<string, string> = {
  'workers-ai': 'Workers AI (Free)',
  'claude': 'Claude (Anthropic)',
  'openai': 'OpenAI (ChatGPT)',
  'gemini': 'Google Gemini',
};

const costs: Record<string, string> = {
  'workers-ai': 'Free - basic quality, may need more editing',
  'claude': '~1-2p per post - best quality',
  'openai': '~0.5-3p per post - good quality',
  'gemini': 'Free tier available - good quality',
};

export async function handleAiSettings(
  bot: TelegramBot,
  chatId: number,
  clientId: string,
  db: D1Database,
  kv: KVNamespace,
): Promise<void> {
  const client = await db.prepare('SELECT site_config FROM clients WHERE id = ?').bind(clientId).first<{ site_config: string | null }>();
  const config = client?.site_config ? JSON.parse(client.site_config) : {};
  const current = config.aiProvider || 'workers-ai';

  let msg = `<b>AI Blog Writer Settings</b>\n\n`;
  msg += `Current: <b>${providerNames[current]}</b>\n`;
  msg += `${costs[current]}\n\n`;
  msg += `Choose your AI provider:`;

  await bot.sendMessage(chatId, msg, {
    inline_keyboard: [
      [
        { text: current === 'workers-ai' ? '\u2705 Free (Workers AI)' : 'Free (Workers AI)', callback_data: 'ai:set:workers-ai' },
      ],
      [
        { text: current === 'gemini' ? '\u2705 Google Gemini' : 'Google Gemini', callback_data: 'ai:set:gemini' },
      ],
      [
        { text: current === 'claude' ? '\u2705 Claude' : 'Claude', callback_data: 'ai:set:claude' },
        { text: current === 'openai' ? '\u2705 OpenAI' : 'OpenAI', callback_data: 'ai:set:openai' },
      ],
    ],
  });
}

export async function handleAiCallback(
  bot: TelegramBot,
  chatId: number,
  callbackData: string,
  clientId: string,
  db: D1Database,
  kv: KVNamespace,
  wizard: WizardManager,
): Promise<void> {
  const provider = callbackData.replace('ai:set:', '');

  if (provider === 'workers-ai') {
    // Free - switch immediately
    const client = await db.prepare('SELECT site_config FROM clients WHERE id = ?').bind(clientId).first<{ site_config: string | null }>();
    const config = client?.site_config ? JSON.parse(client.site_config) : {};
    config.aiProvider = 'workers-ai';
    await db.prepare("UPDATE clients SET site_config = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(JSON.stringify(config), clientId).run();
    await bot.sendMessage(chatId, 'Switched to Workers AI (free). Note: the free model may occasionally make technical errors - always review before approving.');
    return;
  }

  // Paid provider - need API key
  const instructions: Record<string, string> = {
    'claude': 'Get your API key from console.anthropic.com\nPaste it below:',
    'openai': 'Get your API key from platform.openai.com\nPaste it below:',
    'gemini': 'Get your API key from aistudio.google.com\nPaste it below:',
  };

  await wizard.start(chatId, 'ai_setup', 'awaiting_key', clientId);
  await wizard.update(chatId, 'awaiting_key', { provider });
  await bot.sendMessage(chatId, instructions[provider] || 'Paste your API key:');
}

export async function handleAiKeyInput(
  bot: TelegramBot,
  chatId: number,
  apiKey: string,
  clientId: string,
  db: D1Database,
  kv: KVNamespace,
  wizard: WizardManager,
): Promise<void> {
  const state = await wizard.get(chatId);
  if (!state || (state.type as string) !== 'ai_setup') return;

  const provider = state.data.provider;

  // Store key in KV
  await kv.put(`ai_key:${clientId}:${provider}`, apiKey.trim());

  // Update site_config
  const client = await db.prepare('SELECT site_config FROM clients WHERE id = ?').bind(clientId).first<{ site_config: string | null }>();
  const config = client?.site_config ? JSON.parse(client.site_config) : {};
  config.aiProvider = provider;
  await db.prepare("UPDATE clients SET site_config = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(JSON.stringify(config), clientId).run();

  await wizard.clear(chatId);

  const names: Record<string, string> = {
    'claude': 'Claude',
    'openai': 'OpenAI',
    'gemini': 'Google Gemini',
  };

  await bot.sendMessage(chatId, `Switched to ${names[provider]}. Your API key has been stored securely. Try /newpost to test it out.`);
}
