CREATE TABLE IF NOT EXISTS invite_tokens (
  token TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  claimed_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_invite_tokens_client
  ON invite_tokens(client_id);
