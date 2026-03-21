ALTER TABLE clients ADD COLUMN cf_hostname_id TEXT;
ALTER TABLE clients ADD COLUMN domain_status TEXT DEFAULT 'none';
CREATE INDEX IF NOT EXISTS idx_clients_custom_hostname ON clients(custom_hostname);
