-- API Keys 表
CREATE TABLE IF NOT EXISTS `api_keys` (
  `id` text PRIMARY KEY NOT NULL,
  `key` text NOT NULL,
  `key_prefix` text NOT NULL,
  `name` text,
  `rate_limit` integer DEFAULT 100,
  `is_active` integer DEFAULT 1 NOT NULL,
  `last_used_at` integer,
  `expires_at` integer,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

-- Mailboxes 表
CREATE TABLE IF NOT EXISTS `mailboxes` (
  `id` text PRIMARY KEY NOT NULL,
  `address` text NOT NULL,
  `domain` text NOT NULL,
  `expires_at` integer,
  `api_key_id` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

-- 索引
CREATE UNIQUE INDEX IF NOT EXISTS `api_keys_key_unique` ON `api_keys` (`key`);
CREATE UNIQUE INDEX IF NOT EXISTS `mailboxes_address_unique` ON `mailboxes` (`address`);
CREATE INDEX IF NOT EXISTS `idx_mailboxes_api_key_id` ON `mailboxes` (`api_key_id`);
