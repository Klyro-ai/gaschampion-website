CREATE TABLE IF NOT EXISTS signup_requests (
  id TEXT PRIMARY KEY,
  telegram_chat_id TEXT NOT NULL,
  telegram_username TEXT,
  telegram_first_name TEXT,
  business_name TEXT,
  trade_type TEXT,
  town TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  processed_at TEXT
);
