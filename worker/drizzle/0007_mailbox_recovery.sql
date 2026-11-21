CREATE TABLE mailbox_recovery_logs (
  id TEXT PRIMARY KEY NOT NULL,
  actor_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  address TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT NOT NULL,
  previous_user_id TEXT,
  previous_expires_at INTEGER,
  expires_at INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX mailbox_recovery_user_time ON mailbox_recovery_logs(user_id, created_at DESC);
CREATE INDEX mailboxes_address_nocase ON mailboxes(address COLLATE NOCASE);
