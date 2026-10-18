CREATE TABLE outbound_logs (
  id TEXT PRIMARY KEY NOT NULL,
  created_at INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  mailbox TEXT NOT NULL,
  recipient TEXT NOT NULL,
  channel TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending','sent','failed'))
);
CREATE INDEX outbound_time ON outbound_logs(created_at DESC,id DESC);
CREATE INDEX outbound_user_time ON outbound_logs(user_id,created_at DESC,id DESC);
