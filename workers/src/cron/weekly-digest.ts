import { TelegramBot } from '../telegram/bot';
import { getActiveClients } from '../db/client';

export async function sendWeeklyDigests(db: D1Database, botToken: string): Promise<void> {
  const bot = new TelegramBot(botToken);
  const clients = await getActiveClients(db);

  for (const client of clients) {
    if (!client.telegram_chat_id || client.telegram_chat_id === 'UNCLAIMED' || client.telegram_chat_id === 'PLACEHOLDER_CHAT_ID') continue;

    try {
      // Query metrics for the last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // New reviews
      const reviews = await db.prepare(
        "SELECT COUNT(*) as count FROM reviews WHERE client_id = ? AND created_at > ?"
      ).bind(client.id, sevenDaysAgo).first<{ count: number }>();

      // New blog posts
      const posts = await db.prepare(
        "SELECT COUNT(*) as count FROM blog_posts WHERE client_id = ? AND published_at > ? AND status = 'published'"
      ).bind(client.id, sevenDaysAgo).first<{ count: number }>();

      // New leads
      const leads = await db.prepare(
        "SELECT COUNT(*) as total, SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted FROM leads WHERE client_id = ? AND created_at > ?"
      ).bind(client.id, sevenDaysAgo).first<{ total: number; contacted: number }>();

      // Total reviews and rating
      const aggregate = await db.prepare(
        "SELECT COUNT(*) as count, AVG(rating) as avg_rating FROM reviews WHERE client_id = ? AND status = 'approved' AND rating IS NOT NULL"
      ).bind(client.id).first<{ count: number; avg_rating: number }>();

      // Gallery images added
      const gallery = await db.prepare(
        "SELECT COUNT(*) as count FROM gallery_images WHERE client_id = ? AND created_at > ?"
      ).bind(client.id, sevenDaysAgo).first<{ count: number }>();

      // Build message
      let msg = '<b>Weekly Summary</b>\n\n';

      // Leads section
      const totalLeads = leads?.total || 0;
      const contactedLeads = leads?.contacted || 0;
      if (totalLeads > 0) {
        msg += `<b>Leads:</b> ${totalLeads} new`;
        if (contactedLeads > 0) msg += ` (${contactedLeads} contacted)`;
        if (totalLeads > contactedLeads) msg += ` — ${totalLeads - contactedLeads} still waiting`;
        msg += '\n';
      } else {
        msg += '<b>Leads:</b> none this week\n';
      }

      // Reviews
      const newReviews = reviews?.count || 0;
      const totalReviews = aggregate?.count || 0;
      const avgRating = aggregate?.avg_rating ? aggregate.avg_rating.toFixed(1) : '—';
      msg += `<b>Reviews:</b> ${newReviews} new this week`;
      if (totalReviews > 0) msg += ` (${totalReviews} total, ${avgRating} avg)`;
      msg += '\n';

      // Content
      const newPosts = posts?.count || 0;
      const newImages = gallery?.count || 0;
      msg += `<b>Content:</b> ${newPosts} blog post${newPosts !== 1 ? 's' : ''}, ${newImages} gallery image${newImages !== 1 ? 's' : ''}\n`;

      // Tips
      msg += '\n';
      if (totalLeads === 0 && newPosts === 0) {
        msg += 'Tip: Send a photo of a recent job to create a blog post. Fresh content helps your Google ranking.';
      } else if (totalLeads > contactedLeads && totalLeads > 0) {
        msg += `Tip: You have ${totalLeads - contactedLeads} lead${totalLeads - contactedLeads !== 1 ? 's' : ''} waiting for a response. Quick replies convert better.`;
      } else if (newPosts > 0) {
        msg += 'Keep it up! Regular blog posts build your Google ranking over time.';
      }

      await bot.sendMessage(Number(client.telegram_chat_id), msg);
    } catch (e) {
      console.error(`Weekly digest failed for ${client.id}:`, e instanceof Error ? e.message : String(e));
    }
  }
}
