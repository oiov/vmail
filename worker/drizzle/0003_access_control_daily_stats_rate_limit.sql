-- Daily stats table for day-over-day growth metrics
CREATE TABLE IF NOT EXISTS `daily_stats` (
  `date` text PRIMARY KEY NOT NULL,
  `addresses_created` integer DEFAULT 0 NOT NULL,
  `emails_received` integer DEFAULT 0 NOT NULL,
  `api_calls` integer DEFAULT 0 NOT NULL,
  `api_keys_created` integer DEFAULT 0 NOT NULL,
  `updated_at` integer NOT NULL
);

-- API rate limit window counters (per api key, per minute window)
CREATE TABLE IF NOT EXISTS `api_rate_limits` (
  `api_key_id` text NOT NULL,
  `window_start_epoch_sec` integer NOT NULL,
  `request_count` integer DEFAULT 0 NOT NULL,
  PRIMARY KEY (`api_key_id`, `window_start_epoch_sec`)
);

CREATE INDEX IF NOT EXISTS `idx_api_rate_limits_window`
ON `api_rate_limits` (`window_start_epoch_sec`);

CREATE INDEX IF NOT EXISTS `idx_emails_message_to_created_at`
ON `emails` (`message_to`, `created_at`);
