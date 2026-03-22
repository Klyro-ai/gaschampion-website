import type { Env } from '../../types';
import type { TelegramBot } from '../bot';
import type { WizardManager } from '../wizard';
import { createClient, createInviteToken, forClient } from '../../db/client';
import { getAllTradeTypes, getTradeType } from '../../data/trade-catalog';
import { generateSiteConfig } from '../../services/ai-onboarding';
import { WorkersAiWriter } from '../../services/ai-writer';
import { searchGoogleBusiness, downloadGooglePhotos } from '../../services/google-harvester';

export async function handleAddClientStep(
  bot: TelegramBot,
  chatId: number,
  text: string | null,
  callbackData: string | null,
  wizard: WizardManager,
  env: Env
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
      await wizard.update(chatId, 'ask_trade', { client_id: id });

      const trades = getAllTradeTypes();
      const buttons = trades.map(t => ({
        text: t.name,
        callback_data: `addclient:trade:${t.id}`,
      }));
      // One button per row for clarity
      await bot.sendMessage(
        chatId,
        "What type of trade is this business?",
        { inline_keyboard: buttons.map(b => [b]) }
      );
      break;
    }

    case 'ask_trade': {
      if (!callbackData?.startsWith('addclient:trade:')) return;
      const tradeId = callbackData.replace('addclient:trade:', '');
      const trade = getTradeType(tradeId);
      if (!trade) return;

      await wizard.update(chatId, 'ask_owner', { trade_type: tradeId });
      await bot.sendMessage(chatId, `Selected: <b>${trade.name}</b>\n\nWhat's the owner's name?`);
      break;
    }

    case 'ask_owner': {
      if (!text) return;
      await wizard.update(chatId, 'ask_phone', { owner_name: text });
      await bot.sendMessage(chatId, "What's their phone number?");
      break;
    }

    case 'ask_phone': {
      if (!text) return;
      await wizard.update(chatId, 'ask_email', { phone: text });
      await bot.sendMessage(chatId, "What's their email address?");
      break;
    }

    case 'ask_email': {
      if (!text) return;
      await wizard.update(chatId, 'ask_town', { email: text });
      await bot.sendMessage(chatId, "What town are they based in?");
      break;
    }

    case 'ask_town': {
      if (!text) return;
      await wizard.update(chatId, 'ask_project', { town: text });
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
      const trade = getTradeType(data.trade_type);
      await bot.sendMessage(
        chatId,
        `Here's what I'll create:\n\n` +
        `  Business:      ${data.business_name}\n` +
        `  Client ID:     ${data.client_id}\n` +
        `  Trade:         ${trade?.name || data.trade_type}\n` +
        `  Owner:         ${data.owner_name}\n` +
        `  Phone:         ${data.phone}\n` +
        `  Email:         ${data.email}\n` +
        `  Town:          ${data.town}\n` +
        `  Pages project: ${text}\n` +
        `  Theme:         ${trade?.defaultTheme || 'default'}\n` +
        `  Storage prefix: ${data.client_id}/\n\n` +
        `This will:\n` +
        `- Create the client in the database\n` +
        `- Generate site_config with services, FAQs, credentials\n` +
        `- Set theme from trade catalog\n` +
        `- Site accessible at ${data.client_id}.klyro.co.uk\n` +
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
          const trade = getTradeType(data.trade_type);

          // 1. Create client DB record
          await createClient(env.DB, {
            id: data.client_id,
            business_name: data.business_name,
            pages_project_name: data.pages_project,
            r2_bucket_prefix: `${data.client_id}/`,
          });

          // 2. Set trade_type and theme_id on the client record
          await env.DB
            .prepare("UPDATE clients SET trade_type = ?, theme_id = ?, updated_at = datetime('now') WHERE id = ?")
            .bind(data.trade_type, trade?.defaultTheme || 'default', data.client_id)
            .run();

          // 3. Generate site_config using AI onboarding
          const aiWriter = new WorkersAiWriter(env.AI);
          const siteConfig = await generateSiteConfig(
            {
              businessName: data.business_name,
              ownerName: data.owner_name,
              tradeType: data.trade_type,
              town: data.town,
              county: '',
              phone: data.phone,
              email: data.email,
            },
            aiWriter,
          );

          // 4. Save site_config to DB
          const clientDb = forClient(env.DB, data.client_id);
          await clientDb.config.updateSiteConfig(siteConfig);

          // 5. Harvest Google Business data (if API key available)
          let googleInfo = '';
          if (env.GOOGLE_PLACES_API_KEY) {
            try {
              await bot.sendMessage(chatId, 'Searching Google for the business...');
              const googleResult = await searchGoogleBusiness(data.business_name, data.town, env.GOOGLE_PLACES_API_KEY);

              if (googleResult.found) {
                // Import reviews
                const db = forClient(env.DB, data.client_id);
                for (const review of googleResult.reviews) {
                  await db.reviews.upsert({
                    source: 'google',
                    author_name: review.authorName,
                    rating: review.rating,
                    text: review.text,
                    review_date: review.publishTime,
                    source_id: `google_${review.publishTime}`,
                  });
                  // Auto-approve 4-5 star reviews
                  if (review.rating >= 4) {
                    const pending = await db.reviews.getPending();
                    const match = pending.find(r => r.text === review.text);
                    if (match) await db.reviews.approve(match.id);
                  }
                }

                // Download photos to R2
                if (googleResult.photoRefs.length > 0) {
                  const photos = await downloadGooglePhotos(
                    googleResult.photoRefs.slice(0, 5),
                    env.GOOGLE_PLACES_API_KEY,
                    env.R2,
                    `${data.client_id}/`,
                  );
                  for (const photo of photos) {
                    await db.gallery.add({
                      r2_key: photo.r2Key,
                      alt_text: null,
                      caption: null,
                      width: null,
                      height: null,
                      srcset: null,
                      source: 'upload',
                      instagram_post_id: null,
                    });
                  }
                }

                // Enrich site_config with Google data
                if (googleResult.rating || googleResult.description) {
                  const enriched = { ...siteConfig };
                  if (googleResult.rating) {
                    enriched.stats = { ...enriched.stats, reviewCount: googleResult.reviewCount || 0, averageRating: googleResult.rating };
                  }
                  if (googleResult.description && !enriched.description) {
                    enriched.description = googleResult.description;
                  }
                  await clientDb.config.updateSiteConfig(enriched);
                }

                googleInfo = `\nGoogle: ${googleResult.reviewCount || 0} reviews imported, ${googleResult.photoRefs.length} photos`;
              } else {
                googleInfo = '\nGoogle: business not found (can be connected later)';
              }
            } catch (e) {
              googleInfo = `\nGoogle: harvest failed (${e instanceof Error ? e.message : 'unknown error'})`;
            }
          }

          // 6. Generate invite link
          const token = await createInviteToken(env.DB, data.client_id);
          await wizard.clear(chatId);

          await bot.sendMessage(
            chatId,
            `Client created: <b>${data.business_name}</b>\n\n` +
            `Trade: ${trade?.name || data.trade_type}\n` +
            `Theme: ${trade?.defaultTheme || 'default'}\n` +
            `Services: ${trade?.defaultServices.length || 0} pre-configured\n` +
            `Site: ${data.client_id}.klyro.co.uk${googleInfo}\n\n` +
            `Send this link to the business owner to start their setup:\n\n` +
            `https://t.me/klyro_clientbot?start=${token}\n\n` +
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
