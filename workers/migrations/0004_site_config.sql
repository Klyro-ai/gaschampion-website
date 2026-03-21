ALTER TABLE clients ADD COLUMN site_config TEXT;
ALTER TABLE clients ADD COLUMN custom_hostname TEXT;
ALTER TABLE clients ADD COLUMN theme_id TEXT DEFAULT 'champion-blueprint';
ALTER TABLE clients ADD COLUMN trade_type TEXT;
