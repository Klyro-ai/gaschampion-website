-- Klyro D1 Schema v1
-- Multi-tenant platform for tradesperson websites

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  telegram_chat_id TEXT NOT NULL,
  timezone TEXT DEFAULT 'Europe/London',
  quiet_hours_start TEXT DEFAULT '20:00',
  quiet_hours_end TEXT DEFAULT '08:00',
  instagram_user_id TEXT,
  google_place_id TEXT,
  facebook_page_id TEXT,
  pages_project_name TEXT NOT NULL,
  r2_bucket_prefix TEXT NOT NULL,
  auto_approve_5_star INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS authorized_users (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  telegram_chat_id TEXT NOT NULL,
  role TEXT DEFAULT 'editor',
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(client_id, telegram_chat_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  source TEXT NOT NULL,
  author_name TEXT,
  rating INTEGER,
  text TEXT,
  review_date TEXT,
  status TEXT DEFAULT 'pending',
  source_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(client_id, source, source_id)
);

CREATE TABLE IF NOT EXISTS instagram_posts (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  instagram_id TEXT NOT NULL,
  caption TEXT,
  media_type TEXT,
  media_url TEXT,
  thumbnail_url TEXT,
  permalink TEXT,
  posted_at TEXT,
  synced_at TEXT DEFAULT (datetime('now')),
  UNIQUE(client_id, instagram_id)
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  tags TEXT,
  status TEXT DEFAULT 'draft',
  image_url TEXT,
  scheduled_publish_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  published_at TEXT,
  UNIQUE(client_id, slug)
);

CREATE TABLE IF NOT EXISTS gallery_images (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  r2_key TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  width INTEGER,
  height INTEGER,
  srcset TEXT,
  display_order INTEGER DEFAULT 0,
  source TEXT DEFAULT 'upload',
  instagram_post_id TEXT REFERENCES instagram_posts(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notification_queue (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  sent_at TEXT
);

CREATE TABLE IF NOT EXISTS error_log (
  id TEXT PRIMARY KEY,
  client_id TEXT,
  worker TEXT NOT NULL,
  error_type TEXT NOT NULL,
  message TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  actor_chat_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for multi-tenant performance
CREATE INDEX IF NOT EXISTS idx_reviews_client_status ON reviews(client_id, status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_client_status ON blog_posts(client_id, status);
CREATE INDEX IF NOT EXISTS idx_instagram_client ON instagram_posts(client_id);
CREATE INDEX IF NOT EXISTS idx_gallery_client_order ON gallery_images(client_id, display_order);
CREATE INDEX IF NOT EXISTS idx_notification_queue_unsent ON notification_queue(client_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_error_log_client ON error_log(client_id, created_at);
CREATE INDEX IF NOT EXISTS idx_authorized_users_chat ON authorized_users(telegram_chat_id);
