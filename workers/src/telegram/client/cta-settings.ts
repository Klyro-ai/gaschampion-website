import type { TelegramBot } from '../bot';
import type { WizardManager } from '../wizard';

const ctaTypeLabels: Record<string, string> = {
  phone: 'Phone',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  booking: 'Booking Link',
  email: 'Email',
};

const ctaTypePrompts: Record<string, string> = {
  phone: 'Enter your phone number (e.g. 07700 900000):',
  sms: 'Enter your phone number for SMS (e.g. 07700 900000):',
  whatsapp: 'Enter your WhatsApp number (e.g. 447700900000):',
  booking: 'Enter your booking URL (e.g. https://calendly.com/your-name):',
  email: 'Enter your email address:',
};

export async function handleCtaSettings(
  bot: TelegramBot,
  chatId: number,
  clientId: string,
  db: D1Database,
): Promise<void> {
  const client = await db.prepare('SELECT site_config FROM clients WHERE id = ?').bind(clientId).first<{ site_config: string | null }>();
  const config = client?.site_config ? JSON.parse(client.site_config) : {};
  const cta = config.ctaConfig;

  let msg = '<b>Blog CTA Settings</b>\n\n';

  if (cta?.defaultCta) {
    msg += `Default: ${ctaTypeLabels[cta.defaultCta.type] || cta.defaultCta.type} - ${cta.defaultCta.value}\n`;
    if (cta.serviceOverrides?.length) {
      msg += '\nService overrides:\n';
      for (const o of cta.serviceOverrides) {
        msg += `- ${o.serviceKeywords.join(', ')}: ${ctaTypeLabels[o.cta.type] || o.cta.type} - ${o.cta.value}\n`;
      }
    }
  } else {
    msg += 'No CTAs configured yet. Your blog posts will use a generic "get in touch" call to action.\n';
  }

  msg += '\nChoose an option:';

  await bot.sendMessage(chatId, msg, {
    inline_keyboard: [
      [{ text: 'Set default CTA', callback_data: 'cta:setdefault' }],
      [{ text: 'Add service override', callback_data: 'cta:addoverride' }],
      ...(cta?.serviceOverrides?.length ? [[{ text: 'Clear overrides', callback_data: 'cta:clearoverrides' }]] : []),
    ],
  });
}

export async function handleCtaCallback(
  bot: TelegramBot,
  chatId: number,
  callbackData: string,
  clientId: string,
  db: D1Database,
  wizard: WizardManager,
): Promise<void> {
  if (callbackData === 'cta:setdefault') {
    await wizard.start(chatId, 'cta_setup', 'pick_default_type', clientId);
    await bot.sendMessage(chatId, 'What type of CTA for your blog posts?', {
      inline_keyboard: [
        [
          { text: 'Phone', callback_data: 'cta:type:phone' },
          { text: 'SMS', callback_data: 'cta:type:sms' },
        ],
        [
          { text: 'WhatsApp', callback_data: 'cta:type:whatsapp' },
          { text: 'Email', callback_data: 'cta:type:email' },
        ],
        [
          { text: 'Booking Link', callback_data: 'cta:type:booking' },
        ],
      ],
    });
    return;
  }

  if (callbackData === 'cta:addoverride') {
    await wizard.start(chatId, 'cta_setup', 'override_keywords', clientId);
    await bot.sendMessage(chatId, 'Which services should use a different CTA?\n\nType keywords separated by commas (e.g. boiler installation, boiler replacement):');
    return;
  }

  if (callbackData === 'cta:clearoverrides') {
    const client = await db.prepare('SELECT site_config FROM clients WHERE id = ?').bind(clientId).first<{ site_config: string | null }>();
    const config = client?.site_config ? JSON.parse(client.site_config) : {};
    if (config.ctaConfig) {
      config.ctaConfig.serviceOverrides = [];
      await db.prepare("UPDATE clients SET site_config = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(JSON.stringify(config), clientId).run();
    }
    await bot.sendMessage(chatId, 'All service overrides cleared.');
    return;
  }

  // CTA type selection (for default or override)
  if (callbackData.startsWith('cta:type:')) {
    const ctaType = callbackData.replace('cta:type:', '');
    const state = await wizard.get(chatId);
    if (!state || (state.type as string) !== 'cta_setup') return;

    if (state.step === 'pick_default_type') {
      await wizard.update(chatId, 'awaiting_default_value', { ctaType });
      await bot.sendMessage(chatId, ctaTypePrompts[ctaType] || 'Enter the value:');
      return;
    }

    if (state.step === 'pick_override_type') {
      await wizard.update(chatId, 'awaiting_override_value', { ctaType });
      await bot.sendMessage(chatId, ctaTypePrompts[ctaType] || 'Enter the value:');
      return;
    }
  }
}

export async function handleCtaTextInput(
  bot: TelegramBot,
  chatId: number,
  text: string,
  clientId: string,
  db: D1Database,
  wizard: WizardManager,
): Promise<void> {
  const state = await wizard.get(chatId);
  if (!state || (state.type as string) !== 'cta_setup') return;

  if (state.step === 'override_keywords') {
    // User typed service keywords — now ask for CTA type
    const keywords = text.split(',').map(k => k.trim()).filter(Boolean);
    await wizard.update(chatId, 'pick_override_type', { overrideKeywords: keywords.join(',') });
    await bot.sendMessage(chatId, `CTA type for: ${keywords.join(', ')}?`, {
      inline_keyboard: [
        [
          { text: 'Phone', callback_data: 'cta:type:phone' },
          { text: 'SMS', callback_data: 'cta:type:sms' },
        ],
        [
          { text: 'WhatsApp', callback_data: 'cta:type:whatsapp' },
          { text: 'Email', callback_data: 'cta:type:email' },
        ],
        [
          { text: 'Booking Link', callback_data: 'cta:type:booking' },
        ],
      ],
    });
    return;
  }

  if (state.step === 'awaiting_default_value') {
    const ctaType = state.data.ctaType;
    const client = await db.prepare('SELECT site_config FROM clients WHERE id = ?').bind(clientId).first<{ site_config: string | null }>();
    const config = client?.site_config ? JSON.parse(client.site_config) : {};
    if (!config.ctaConfig) {
      config.ctaConfig = { defaultCta: { type: ctaType, value: text.trim() }, displayMode: 'single' };
    } else {
      config.ctaConfig.defaultCta = { type: ctaType, value: text.trim() };
    }
    await db.prepare("UPDATE clients SET site_config = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(JSON.stringify(config), clientId).run();
    await wizard.clear(chatId);
    await bot.sendMessage(chatId, `Default CTA set: ${ctaTypeLabels[ctaType]} - ${text.trim()}`);
    return;
  }

  if (state.step === 'awaiting_override_value') {
    const ctaType = state.data.ctaType;
    const keywords = state.data.overrideKeywords.split(',');
    const client = await db.prepare('SELECT site_config FROM clients WHERE id = ?').bind(clientId).first<{ site_config: string | null }>();
    const config = client?.site_config ? JSON.parse(client.site_config) : {};
    if (!config.ctaConfig) {
      config.ctaConfig = {
        defaultCta: { type: 'phone', value: config.phone || '' },
        serviceOverrides: [],
        displayMode: 'single',
      };
    }
    if (!config.ctaConfig.serviceOverrides) {
      config.ctaConfig.serviceOverrides = [];
    }
    config.ctaConfig.serviceOverrides.push({
      serviceKeywords: keywords,
      cta: { type: ctaType, value: text.trim() },
    });
    await db.prepare("UPDATE clients SET site_config = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(JSON.stringify(config), clientId).run();
    await wizard.clear(chatId);
    await bot.sendMessage(chatId, `Override added: ${keywords.join(', ')} \u2192 ${ctaTypeLabels[ctaType]} - ${text.trim()}`);
    return;
  }
}
