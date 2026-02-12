-- Site Stats 表：用于存储站点累计统计数据
CREATE TABLE IF NOT EXISTS `site_stats` (
  `id` text PRIMARY KEY NOT NULL,
  `total_addresses_created` integer DEFAULT 0 NOT NULL,
  `total_emails_received` integer DEFAULT 0 NOT NULL,
  `total_api_calls` integer DEFAULT 0 NOT NULL,
  `total_api_keys_created` integer DEFAULT 0 NOT NULL,
  `updated_at` integer NOT NULL
);

-- 插入初始记录
INSERT OR IGNORE INTO `site_stats` (`id`, `total_addresses_created`, `total_emails_received`, `total_api_calls`, `total_api_keys_created`, `updated_at`)
VALUES ('global', 0, 0, 0, 0, strftime('%s', 'now') * 1000);
