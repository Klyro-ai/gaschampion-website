import type { TelegramBot } from '../bot';
import type { WizardManager } from '../wizard';
import { CloudflareDomainManager } from '../../services/cloudflare-domains';

export async function handleDomainCommand(
  bot: TelegramBot,
  chatId: number,
  clientId: string,
  db: D1Database,
): Promise<void> {
  const client = await db.prepare(
    'SELECT custom_hostname, domain_status, cf_hostname_id FROM clients WHERE id = ?'
  ).bind(clientId).first<{ custom_hostname: string | null; domain_status: string | null; cf_hostname_id: string | null }>();

  const subdomain = `${clientId}.klyro.co.uk`;

  if (client?.custom_hostname && client.domain_status === 'active') {
    await bot.sendMessage(chatId,
      `<b>Your domains</b>\n\n` +
      `Custom: <b>${client.custom_hostname}</b> (active)\n` +
      `Subdomain: ${subdomain}\n\n` +
      `Both URLs work. Want to change your domain?`,
      {
        inline_keyboard: [
          [{ text: 'Change domain', callback_data: 'domain:change' }],
          [{ text: 'Remove custom domain', callback_data: 'domain:remove' }],
        ],
      }
    );
  } else if (client?.custom_hostname && client.domain_status === 'pending_dns') {
    await bot.sendMessage(chatId,
      `<b>Domain setup in progress</b>\n\n` +
      `Domain: ${client.custom_hostname}\n` +
      `Status: Waiting for DNS\n\n` +
      `Add this DNS record at your registrar:\n\n` +
      `Type: <b>CNAME</b>\n` +
      `Name: <b>${getDnsName(client.custom_hostname)}</b>\n` +
      `Target: <b>proxy-fallback.klyro.co.uk</b>\n\n` +
      `I'll check automatically and let you know when it's live.`,
      {
        inline_keyboard: [
          [{ text: 'Check now', callback_data: 'domain:check' }],
          [{ text: 'Cancel setup', callback_data: 'domain:remove' }],
        ],
      }
    );
  } else {
    await bot.sendMessage(chatId,
      `<b>Your site</b>\n\n` +
      `Currently live at: ${subdomain}\n\n` +
      `Want to use your own domain (e.g., www.yourbusiness.co.uk)?`,
      {
        inline_keyboard: [
          [{ text: 'Connect my domain', callback_data: 'domain:setup' }],
        ],
      }
    );
  }
}

export async function handleDomainCallback(
  bot: TelegramBot,
  chatId: number,
  callbackData: string,
  clientId: string,
  db: D1Database,
  wizard: WizardManager,
  cfApiToken?: string,
  cfZoneId?: string,
): Promise<void> {
  if (callbackData === 'domain:setup' || callbackData === 'domain:change') {
    await wizard.start(chatId, 'domain_setup' as any, 'awaiting_domain', clientId);
    await bot.sendMessage(chatId, 'Enter the domain you want to use (e.g., www.yourbusiness.co.uk):');
    return;
  }

  if (callbackData === 'domain:check') {
    if (!cfApiToken || !cfZoneId) {
      await bot.sendMessage(chatId, 'Domain management is not configured yet. Contact your admin.');
      return;
    }

    const client = await db.prepare(
      'SELECT cf_hostname_id, custom_hostname FROM clients WHERE id = ?'
    ).bind(clientId).first<{ cf_hostname_id: string | null; custom_hostname: string | null }>();

    if (!client?.cf_hostname_id) {
      await bot.sendMessage(chatId, 'No domain setup found. Use /domain to start.');
      return;
    }

    const cfDomains = new CloudflareDomainManager(cfApiToken, cfZoneId);
    const status = await cfDomains.getHostnameStatus(client.cf_hostname_id);

    if (!status) {
      await bot.sendMessage(chatId, 'Could not check domain status. Try again later.');
      return;
    }

    if (cfDomains.isActive(status)) {
      await db.prepare(
        "UPDATE clients SET domain_status = 'active', updated_at = datetime('now') WHERE id = ?"
      ).bind(clientId).run();
      await bot.sendMessage(chatId,
        `Your domain <b>${client.custom_hostname}</b> is now live!\n\n` +
        `Your site is accessible at both:\n` +
        `- ${client.custom_hostname}\n` +
        `- ${clientId}.klyro.co.uk`
      );
    } else {
      await bot.sendMessage(chatId,
        `Domain: ${client.custom_hostname}\n` +
        `DNS: ${status.status}\n` +
        `SSL: ${status.sslStatus}\n\n` +
        `Still waiting. Make sure the CNAME record is set correctly:\n` +
        `${getDnsName(client.custom_hostname!)} CNAME proxy-fallback.klyro.co.uk`,
        {
          inline_keyboard: [[{ text: 'Check again', callback_data: 'domain:check' }]],
        }
      );
    }
    return;
  }

  if (callbackData === 'domain:remove') {
    const client = await db.prepare(
      'SELECT cf_hostname_id FROM clients WHERE id = ?'
    ).bind(clientId).first<{ cf_hostname_id: string | null }>();

    if (client?.cf_hostname_id && cfApiToken && cfZoneId) {
      const cfDomains = new CloudflareDomainManager(cfApiToken, cfZoneId);
      await cfDomains.deleteCustomHostname(client.cf_hostname_id).catch(() => {});
    }

    await db.prepare(
      "UPDATE clients SET custom_hostname = NULL, cf_hostname_id = NULL, domain_status = 'none', updated_at = datetime('now') WHERE id = ?"
    ).bind(clientId).run();

    await bot.sendMessage(chatId, `Custom domain removed. Your site is still available at ${clientId}.klyro.co.uk`);
    return;
  }
}

export async function handleDomainInput(
  bot: TelegramBot,
  chatId: number,
  domain: string,
  clientId: string,
  db: D1Database,
  wizard: WizardManager,
  cfApiToken?: string,
  cfZoneId?: string,
): Promise<void> {
  const state = await wizard.get(chatId);
  if (!state || (state.type as string) !== 'domain_setup') return;

  // Basic domain validation
  const cleaned = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!cleaned.includes('.') || cleaned.includes(' ')) {
    await bot.sendMessage(chatId, 'That doesn\'t look like a valid domain. Try again (e.g., www.yourbusiness.co.uk):');
    return;
  }

  if (!cfApiToken || !cfZoneId) {
    // CF not configured — just store the domain for later
    await db.prepare(
      "UPDATE clients SET custom_hostname = ?, domain_status = 'pending_dns', updated_at = datetime('now') WHERE id = ?"
    ).bind(cleaned, clientId).run();
    await wizard.clear(chatId);
    await bot.sendMessage(chatId,
      `Domain <b>${cleaned}</b> registered.\n\n` +
      `Add this DNS record at your registrar:\n\n` +
      `Type: <b>CNAME</b>\n` +
      `Name: <b>${getDnsName(cleaned)}</b>\n` +
      `Target: <b>proxy-fallback.klyro.co.uk</b>\n\n` +
      `Use /domain to check the status.`
    );
    return;
  }

  // Register with Cloudflare
  const cfDomains = new CloudflareDomainManager(cfApiToken, cfZoneId);
  try {
    const result = await cfDomains.createCustomHostname(cleaned);

    await db.prepare(
      "UPDATE clients SET custom_hostname = ?, cf_hostname_id = ?, domain_status = 'pending_dns', updated_at = datetime('now') WHERE id = ?"
    ).bind(cleaned, result.id, clientId).run();

    await wizard.clear(chatId);
    await bot.sendMessage(chatId,
      `Domain <b>${cleaned}</b> registered with Cloudflare.\n\n` +
      `Now add this DNS record at your registrar:\n\n` +
      `Type: <b>CNAME</b>\n` +
      `Name: <b>${getDnsName(cleaned)}</b>\n` +
      `Target: <b>proxy-fallback.klyro.co.uk</b>\n\n` +
      `I'll check automatically and let you know when it's live. Or use /domain to check manually.`
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await wizard.clear(chatId);
    await bot.sendMessage(chatId, `Failed to register domain: ${msg}\nTry again with /domain.`);
  }
}

/** Extract the DNS name part from a hostname (e.g., "www" from "www.example.com") */
function getDnsName(hostname: string): string {
  const parts = hostname.split('.');
  if (parts.length > 2) return parts[0]; // www.example.com → www
  return '@'; // example.com → @ (apex)
}
