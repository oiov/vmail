// worker/src/env.ts — 共享绑定类型，深模块与浅入口共用
export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  EMAIL_DOMAIN: string;
  COOKIES_SECRET: string;
  TURNSTILE_KEY: string;
  TURNSTILE_SECRET: string;
  PASSWORD?: string;
  RESEND_API_KEY?: string;
  MAILCHANNELS_API_KEY?: string;
  MAILBOX_TOKEN_SECRET?: string;
  SENDER_EMAIL?: string;
  SEND_RATE_LIMIT_PER_MINUTE?: string;
  SEND_IP_RATE_LIMIT_PER_MINUTE?: string;
  API_RATE_LIMIT_PER_MINUTE?: string;
  SHOW_AFF?: string;
  ENABLE_OPENAPI?: string;
  SEND_CHANNEL?: string;
  SEND_EMAIL?: SendEmail;
}
