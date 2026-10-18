CREATE TABLE auth_user (role TEXT NOT NULL DEFAULT 'user', id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, email_verified INTEGER NOT NULL DEFAULT 0, image TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE auth_session (id TEXT PRIMARY KEY NOT NULL, token TEXT NOT NULL UNIQUE, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, ip_address TEXT, user_agent TEXT, user_id TEXT NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE);
CREATE INDEX auth_session_user ON auth_session(user_id);
CREATE TABLE auth_account (id TEXT PRIMARY KEY NOT NULL, account_id TEXT NOT NULL, provider_id TEXT NOT NULL, user_id TEXT NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE, access_token TEXT, refresh_token TEXT, id_token TEXT, access_token_expires_at INTEGER, refresh_token_expires_at INTEGER, scope TEXT, password TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE INDEX auth_account_user ON auth_account(user_id);
CREATE UNIQUE INDEX auth_account_provider ON auth_account(provider_id, account_id);
CREATE TABLE auth_verification (id TEXT PRIMARY KEY NOT NULL, identifier TEXT NOT NULL, value TEXT NOT NULL, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE INDEX auth_verification_identifier ON auth_verification(identifier);
CREATE TABLE auth_apikey (id TEXT PRIMARY KEY NOT NULL, config_id TEXT NOT NULL DEFAULT 'default', name TEXT, start TEXT, reference_id TEXT NOT NULL, prefix TEXT, key TEXT NOT NULL UNIQUE, refill_interval INTEGER, refill_amount INTEGER, last_refill_at INTEGER, enabled INTEGER DEFAULT 1, rate_limit_enabled INTEGER DEFAULT 0, rate_limit_time_window INTEGER, rate_limit_max INTEGER, request_count INTEGER DEFAULT 0, remaining INTEGER, last_request INTEGER, expires_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, permissions TEXT, metadata TEXT);
CREATE INDEX auth_apikey_owner ON auth_apikey(reference_id);
CREATE TRIGGER auth_apikey_max_three BEFORE INSERT ON auth_apikey
WHEN NEW.enabled = 1 AND (SELECT COUNT(*) FROM auth_apikey WHERE reference_id = NEW.reference_id AND enabled = 1 AND (expires_at IS NULL OR expires_at > unixepoch() * 1000)) >= 3
BEGIN SELECT RAISE(ABORT, 'API_KEY_LIMIT'); END;
ALTER TABLE mailboxes ADD COLUMN user_id TEXT;
CREATE INDEX mailboxes_user_expiry ON mailboxes(user_id, expires_at);
CREATE INDEX mailboxes_user_cursor ON mailboxes(user_id, id);
CREATE INDEX emails_expiry ON emails(created_at);
CREATE INDEX emails_cursor ON emails(message_to, created_at, id);
-- Legacy anonymous keys cannot be used with the authenticated API.
UPDATE api_keys SET is_active = 0;

CREATE TABLE usage_daily (date TEXT NOT NULL, owner_id TEXT NOT NULL, key_id TEXT NOT NULL DEFAULT '', api_calls INTEGER NOT NULL DEFAULT 0, mailboxes_created INTEGER NOT NULL DEFAULT 0, emails_received INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL, PRIMARY KEY(date, owner_id, key_id));
CREATE INDEX usage_daily_owner ON usage_daily(owner_id, date);

-- Aggregate absolute snapshots using deltas, so alarm retries never double count.
CREATE TRIGGER usage_totals_insert AFTER INSERT ON usage_daily BEGIN
  UPDATE site_stats SET total_api_calls = total_api_calls + NEW.api_calls,
    total_addresses_created = total_addresses_created + NEW.mailboxes_created,
    total_emails_received = total_emails_received + NEW.emails_received,
    updated_at = NEW.updated_at WHERE id = 'global';
  INSERT INTO daily_stats(date, api_calls, addresses_created, emails_received, updated_at)
    VALUES(NEW.date, NEW.api_calls, NEW.mailboxes_created, NEW.emails_received, NEW.updated_at)
    ON CONFLICT(date) DO UPDATE SET api_calls = api_calls + NEW.api_calls,
      addresses_created = addresses_created + NEW.mailboxes_created,
      emails_received = emails_received + NEW.emails_received, updated_at = NEW.updated_at;
END;
CREATE TRIGGER usage_totals_update AFTER UPDATE ON usage_daily BEGIN
  UPDATE site_stats SET total_api_calls = total_api_calls + NEW.api_calls - OLD.api_calls,
    total_addresses_created = total_addresses_created + NEW.mailboxes_created - OLD.mailboxes_created,
    total_emails_received = total_emails_received + NEW.emails_received - OLD.emails_received,
    updated_at = NEW.updated_at WHERE id = 'global';
  UPDATE daily_stats SET api_calls = api_calls + NEW.api_calls - OLD.api_calls,
    addresses_created = addresses_created + NEW.mailboxes_created - OLD.mailboxes_created,
    emails_received = emails_received + NEW.emails_received - OLD.emails_received,
    updated_at = NEW.updated_at WHERE date = NEW.date;
END;
CREATE TRIGGER key_totals_insert AFTER INSERT ON auth_apikey BEGIN
  UPDATE site_stats SET total_api_keys_created = total_api_keys_created + 1,
    updated_at = NEW.created_at WHERE id = 'global';
  INSERT INTO daily_stats(date, api_keys_created, updated_at)
    VALUES(strftime('%Y-%m-%d', NEW.created_at / 1000, 'unixepoch'), 1, NEW.created_at)
    ON CONFLICT(date) DO UPDATE SET api_keys_created = api_keys_created + 1, updated_at = NEW.created_at;
END;
