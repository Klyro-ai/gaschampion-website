import type { Client, Review, InstagramPost, BlogPost, GalleryImage } from '../types';

export class ClientDB {
  constructor(
    private db: D1Database,
    private clientId: string
  ) {}

  reviews = {
    getApproved: async (): Promise<Review[]> => {
      const result = await this.db
        .prepare('SELECT * FROM reviews WHERE client_id = ? AND status = ? ORDER BY review_date DESC')
        .bind(this.clientId, 'approved')
        .all<Review>();
      return result.results;
    },

    getPending: async (): Promise<Review[]> => {
      const result = await this.db
        .prepare('SELECT * FROM reviews WHERE client_id = ? AND status = ? ORDER BY created_at DESC')
        .bind(this.clientId, 'pending')
        .all<Review>();
      return result.results;
    },

    upsert: async (review: {
      source: string;
      author_name: string | null;
      rating: number | null;
      text: string | null;
      review_date: string | null;
      source_id: string;
    }): Promise<string> => {
      const id = crypto.randomUUID();
      await this.db
        .prepare(
          `INSERT INTO reviews (id, client_id, source, author_name, rating, text, review_date, source_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (client_id, source, source_id) DO UPDATE SET
             text = excluded.text,
             rating = excluded.rating,
             updated_at = datetime('now')`
        )
        .bind(id, this.clientId, review.source, review.author_name, review.rating, review.text, review.review_date, review.source_id)
        .run();
      return id;
    },

    approve: async (reviewId: string): Promise<void> => {
      await this.db
        .prepare("UPDATE reviews SET status = 'approved', updated_at = datetime('now') WHERE id = ? AND client_id = ?")
        .bind(reviewId, this.clientId)
        .run();
    },

    reject: async (reviewId: string): Promise<void> => {
      await this.db
        .prepare("UPDATE reviews SET status = 'rejected', updated_at = datetime('now') WHERE id = ? AND client_id = ?")
        .bind(reviewId, this.clientId)
        .run();
    },

    getAggregateRating: async (): Promise<{ average: number; count: number }> => {
      const result = await this.db
        .prepare('SELECT AVG(rating) as average, COUNT(*) as count FROM reviews WHERE client_id = ? AND status = ? AND rating IS NOT NULL')
        .bind(this.clientId, 'approved')
        .first<{ average: number; count: number }>();
      return { average: result?.average ?? 0, count: result?.count ?? 0 };
    },
  };

  instagram = {
    getAll: async (): Promise<InstagramPost[]> => {
      const result = await this.db
        .prepare('SELECT * FROM instagram_posts WHERE client_id = ? ORDER BY posted_at DESC')
        .bind(this.clientId)
        .all<InstagramPost>();
      return result.results;
    },

    upsert: async (post: {
      instagram_id: string;
      caption: string | null;
      media_type: string;
      media_url: string | null;
      thumbnail_url?: string | null;
      permalink: string | null;
      posted_at: string | null;
    }): Promise<string> => {
      const id = crypto.randomUUID();
      await this.db
        .prepare(
          `INSERT INTO instagram_posts (id, client_id, instagram_id, caption, media_type, media_url, thumbnail_url, permalink, posted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (client_id, instagram_id) DO UPDATE SET
             caption = excluded.caption,
             media_url = excluded.media_url,
             thumbnail_url = excluded.thumbnail_url`
        )
        .bind(id, this.clientId, post.instagram_id, post.caption, post.media_type, post.media_url, post.thumbnail_url ?? null, post.permalink, post.posted_at)
        .run();
      return id;
    },

    getLatestSyncTime: async (): Promise<string | null> => {
      const result = await this.db
        .prepare('SELECT MAX(synced_at) as latest FROM instagram_posts WHERE client_id = ?')
        .bind(this.clientId)
        .first<{ latest: string | null }>();
      return result?.latest ?? null;
    },
  };

  blogPosts = {
    getPublished: async (): Promise<BlogPost[]> => {
      const now = new Date().toISOString();
      const result = await this.db
        .prepare(
          `SELECT * FROM blog_posts
           WHERE client_id = ? AND status = 'published'
           AND (scheduled_publish_at IS NULL OR scheduled_publish_at <= ?)
           ORDER BY published_at DESC`
        )
        .bind(this.clientId, now)
        .all<BlogPost>();
      return result.results;
    },

    getPending: async (): Promise<BlogPost[]> => {
      const result = await this.db
        .prepare("SELECT * FROM blog_posts WHERE client_id = ? AND status = 'pending_approval' ORDER BY created_at DESC")
        .bind(this.clientId)
        .all<BlogPost>();
      return result.results;
    },

    getBySlug: async (slug: string): Promise<BlogPost | null> => {
      return await this.db.prepare(
        'SELECT * FROM blog_posts WHERE client_id = ? AND slug = ?'
      ).bind(this.clientId, slug).first<BlogPost>();
    },

    create: async (post: {
      title: string;
      slug: string;
      content: string;
      description?: string | null;
      tags?: string | null;
      status?: string;
      image_url?: string | null;
      image_alt_text?: string | null;
      scheduled_publish_at?: string | null;
    }): Promise<string> => {
      const id = crypto.randomUUID();
      await this.db
        .prepare(
          `INSERT INTO blog_posts (id, client_id, title, slug, content, description, tags, status, image_url, image_alt_text, scheduled_publish_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(id, this.clientId, post.title, post.slug, post.content, post.description ?? null, post.tags ?? null, post.status ?? 'draft', post.image_url ?? null, post.image_alt_text ?? null, post.scheduled_publish_at ?? null)
        .run();
      return id;
    },

    publish: async (postId: string): Promise<void> => {
      await this.db
        .prepare(
          "UPDATE blog_posts SET status = 'published', published_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND client_id = ?"
        )
        .bind(postId, this.clientId)
        .run();
    },

    update: async (postId: string, fields: { title?: string; content?: string; description?: string; tags?: string; image_url?: string | null; image_alt_text?: string | null }): Promise<void> => {
      const sets: string[] = [];
      const values: (string | null)[] = [];
      if (fields.title !== undefined) { sets.push('title = ?'); values.push(fields.title); }
      if (fields.content !== undefined) { sets.push('content = ?'); values.push(fields.content); }
      if (fields.description !== undefined) { sets.push('description = ?'); values.push(fields.description); }
      if (fields.tags !== undefined) { sets.push('tags = ?'); values.push(fields.tags); }
      if (fields.image_url !== undefined) { sets.push('image_url = ?'); values.push(fields.image_url); }
      if (fields.image_alt_text !== undefined) { sets.push('image_alt_text = ?'); values.push(fields.image_alt_text); }
      if (sets.length === 0) return;
      sets.push("updated_at = datetime('now')");
      await this.db
        .prepare(`UPDATE blog_posts SET ${sets.join(', ')} WHERE id = ? AND client_id = ?`)
        .bind(...values, postId, this.clientId)
        .run();
    },

    delete: async (postId: string): Promise<void> => {
      await this.db.prepare(
        'DELETE FROM blog_posts WHERE id = ? AND client_id = ?'
      ).bind(postId, this.clientId).run();
    },
  };

  gallery = {
    getAll: async (): Promise<GalleryImage[]> => {
      const result = await this.db
        .prepare('SELECT * FROM gallery_images WHERE client_id = ? ORDER BY display_order ASC, created_at DESC')
        .bind(this.clientId)
        .all<GalleryImage>();
      return result.results;
    },

    add: async (image: {
      r2_key: string;
      alt_text?: string | null;
      caption?: string | null;
      width?: number | null;
      height?: number | null;
      srcset?: string | null;
      source?: string;
      instagram_post_id?: string | null;
    }): Promise<string> => {
      const id = crypto.randomUUID();
      const max = await this.db
        .prepare('SELECT MAX(display_order) as m FROM gallery_images WHERE client_id = ?')
        .bind(this.clientId)
        .first<{ m: number | null }>();
      const order = (max?.m ?? -1) + 1;

      await this.db
        .prepare(
          `INSERT INTO gallery_images (id, client_id, r2_key, alt_text, caption, width, height, srcset, display_order, source, instagram_post_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(id, this.clientId, image.r2_key, image.alt_text ?? null, image.caption ?? null, image.width ?? null, image.height ?? null, image.srcset ?? null, order, image.source ?? 'upload', image.instagram_post_id ?? null)
        .run();
      return id;
    },

    updateCaption: async (imageId: string, caption: string, altText?: string): Promise<void> => {
      if (altText) {
        await this.db.prepare(
          'UPDATE gallery_images SET caption = ?, alt_text = ? WHERE id = ? AND client_id = ?'
        ).bind(caption, altText, imageId, this.clientId).run();
      } else {
        await this.db.prepare(
          'UPDATE gallery_images SET caption = ? WHERE id = ? AND client_id = ?'
        ).bind(caption, imageId, this.clientId).run();
      }
    },
  };

  config = {
    getSiteConfig: async (): Promise<import('../types').SiteConfig | null> => {
      const row = await this.db
        .prepare('SELECT site_config FROM clients WHERE id = ?')
        .bind(this.clientId)
        .first<{ site_config: string | null }>();
      if (!row?.site_config) return null;
      return JSON.parse(row.site_config);
    },

    updateSiteConfig: async (config: import('../types').SiteConfig): Promise<void> => {
      await this.db
        .prepare("UPDATE clients SET site_config = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(JSON.stringify(config), this.clientId)
        .run();
    },
  };

  notifications = {
    queue: async (type: string, payload: object): Promise<void> => {
      const id = crypto.randomUUID();
      await this.db
        .prepare('INSERT INTO notification_queue (id, client_id, type, payload) VALUES (?, ?, ?, ?)')
        .bind(id, this.clientId, type, JSON.stringify(payload))
        .run();
    },

    getUnsent: async (): Promise<Array<{ id: string; type: string; payload: string; created_at: string }>> => {
      const result = await this.db
        .prepare('SELECT * FROM notification_queue WHERE client_id = ? AND sent_at IS NULL ORDER BY created_at ASC')
        .bind(this.clientId)
        .all();
      return result.results as any;
    },

    markSent: async (ids: string[]): Promise<void> => {
      if (ids.length === 0) return;
      const placeholders = ids.map(() => '?').join(',');
      await this.db
        .prepare(`UPDATE notification_queue SET sent_at = datetime('now') WHERE id IN (${placeholders}) AND client_id = ?`)
        .bind(...ids, this.clientId)
        .run();
    },

    pruneOld: async (daysOld: number = 30): Promise<void> => {
      await this.db
        .prepare("DELETE FROM notification_queue WHERE client_id = ? AND sent_at IS NOT NULL AND sent_at < datetime('now', ?)")
        .bind(this.clientId, `-${daysOld} days`)
        .run();
    },
  };
}

/** Factory: creates a tenant-scoped DB wrapper */
export function forClient(db: D1Database, clientId: string): ClientDB {
  return new ClientDB(db, clientId);
}

/** Get all active clients */
export async function getActiveClients(db: D1Database): Promise<Array<{ id: string; business_name: string; telegram_chat_id: string; google_place_id: string | null; instagram_user_id: string | null; facebook_page_id: string | null }>> {
  const result = await db
    .prepare('SELECT id, business_name, telegram_chat_id, google_place_id, instagram_user_id, facebook_page_id FROM clients WHERE is_active = 1')
    .all();
  return result.results as any;
}

/** Create a new client (admin operation) */
export async function createClient(
  db: D1Database,
  client: {
    id: string;
    business_name: string;
    pages_project_name: string;
    r2_bucket_prefix: string;
  }
): Promise<string> {
  await db
    .prepare(
      `INSERT INTO clients (id, business_name, telegram_chat_id, pages_project_name, r2_bucket_prefix)
       VALUES (?, ?, 'UNCLAIMED', ?, ?)`
    )
    .bind(client.id, client.business_name, client.pages_project_name, client.r2_bucket_prefix)
    .run();
  return client.id;
}

/** Create an invite token for a client */
export async function createInviteToken(db: D1Database, clientId: string): Promise<string> {
  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await db
    .prepare('INSERT INTO invite_tokens (token, client_id, expires_at) VALUES (?, ?, ?)')
    .bind(token, clientId, expiresAt)
    .run();
  return token;
}

/** Claim an invite token — returns client_id or null if invalid/expired */
export async function claimInvite(
  db: D1Database,
  token: string,
  chatId: string
): Promise<string | null> {
  const invite = await db
    .prepare("SELECT * FROM invite_tokens WHERE token = ? AND claimed_by IS NULL AND expires_at > datetime('now')")
    .bind(token)
    .first<{ client_id: string }>();

  if (!invite) return null;

  // Claim the invite
  await db
    .prepare("UPDATE invite_tokens SET claimed_by = ? WHERE token = ?")
    .bind(chatId, token)
    .run();

  // Update client's telegram_chat_id
  await db
    .prepare("UPDATE clients SET telegram_chat_id = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(chatId, invite.client_id)
    .run();

  // Add as authorized user with admin role
  const userId = crypto.randomUUID();
  await db
    .prepare('INSERT OR IGNORE INTO authorized_users (id, client_id, telegram_chat_id, role) VALUES (?, ?, ?, ?)')
    .bind(userId, invite.client_id, chatId, 'admin')
    .run();

  return invite.client_id;
}

/** Find a client by their primary telegram_chat_id */
export async function getClientByChatId(
  db: D1Database,
  chatId: string
): Promise<Client | null> {
  return db
    .prepare('SELECT * FROM clients WHERE telegram_chat_id = ?')
    .bind(chatId)
    .first<Client>();
}

/** Find a client by an authorized user's chat_id */
export async function getClientByAuthorizedUser(
  db: D1Database,
  chatId: string
): Promise<{ client: Client; role: string } | null> {
  const row = await db
    .prepare(
      `SELECT c.*, au.role FROM authorized_users au
       JOIN clients c ON c.id = au.client_id
       WHERE au.telegram_chat_id = ?`
    )
    .bind(chatId)
    .first<Client & { role: string }>();

  if (!row) return null;
  const { role, ...client } = row;
  return { client: client as Client, role };
}

/** Get all clients with basic status info (admin) */
export async function getAllClients(
  db: D1Database
): Promise<Array<{
  id: string;
  business_name: string;
  is_active: boolean;
  google_place_id: string | null;
  instagram_user_id: string | null;
  facebook_page_id: string | null;
  telegram_chat_id: string;
}>> {
  const result = await db
    .prepare('SELECT id, business_name, is_active, google_place_id, instagram_user_id, facebook_page_id, telegram_chat_id FROM clients ORDER BY created_at DESC')
    .all();
  return result.results as any;
}

/** Update a client's Google Place ID */
export async function updateGooglePlaceId(
  db: D1Database,
  clientId: string,
  placeId: string | null
): Promise<void> {
  await db
    .prepare("UPDATE clients SET google_place_id = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(placeId, clientId)
    .run();
}

/** Update a client's Instagram/Facebook IDs */
export async function updateSocialIds(
  db: D1Database,
  clientId: string,
  instagramUserId: string | null,
  facebookPageId: string | null
): Promise<void> {
  await db
    .prepare("UPDATE clients SET instagram_user_id = ?, facebook_page_id = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(instagramUserId, facebookPageId, clientId)
    .run();
}

/** Update a client's quiet hours */
export async function updateQuietHours(
  db: D1Database,
  clientId: string,
  start: string,
  end: string
): Promise<void> {
  await db
    .prepare("UPDATE clients SET quiet_hours_start = ?, quiet_hours_end = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(start, end, clientId)
    .run();
}
