ALTER TABLE auth_user ADD COLUMN banned INTEGER NOT NULL DEFAULT 0;
CREATE TABLE api_request_logs (
  id TEXT PRIMARY KEY NOT NULL,
  created_at INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  key_id TEXT NOT NULL,
  method TEXT NOT NULL,
  route TEXT NOT NULL,
  status INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL
);
CREATE INDEX api_logs_time ON api_request_logs(created_at DESC, id DESC);
CREATE INDEX api_logs_user_time ON api_request_logs(user_id, created_at DESC, id DESC);
