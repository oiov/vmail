# Upgrading to v3.0: authentication, quotas and administration

This release changes credentials. Test a separate deployment and save a D1 export/Time Travel recovery point before production migration.

## Breaking changes

- MAILBOX_TOKEN_SECRET is mandatory for browser mailboxes, even without outbound sending. Preserve an existing secret. Old client-derived mailbox passwords cannot prove ownership. Historical mailboxes lack activation records and must be recreated; the UI shows an upgrade notice.
- Migration 0004_authenticated_api.sql disables anonymous API keys. Users sign in with GitHub or Google and create new keys. The migration does not delete existing mail, but retention cleanup continues. Old mailboxes are not reassigned to new users.
- Users default to user. Registration is not capped. Each user has up to 3 active keys sharing account quotas. Recreating keys does not reset quotas. Keys expire after 90 days.
- Mail lists use cursor pagination, maximum limit 50, and pagination.nextCursor. page, total, totalPages and live messageCount are removed. Read message bodies through the detail endpoint.
- Only activated, unexpired mailboxes receive mail. Default limits: at most 24-hour lifetime, 100 messages/mailbox/day, 256 KiB/message. Sending to arbitrary, uncreated addresses is no longer supported.
- SQLite Durable Objects store quotas and request authorization; D1 stores identity, key management, mail and aggregate usage. Cloudflare requests, storage, CPU and logs still cost money. Quotas are not a hard account spending cap.

## Configure

Copy .env.example to ignored .env, preserving the existing D1 identity and email domain. Browser-only deployments need D1_DATABASE_ID, D1_DATABASE_NAME, EMAIL_DOMAIN and MAILBOX_TOKEN_SECRET (at least 32 characters). Generate independent secrets using a password manager or openssl rand -base64 48.

For sign-in and API access, set:

- BETTER_AUTH_URL: your HTTPS origin, e.g. https://mail.example.com.
- BETTER_AUTH_SECRET and API_KEY_SECRET: separate random secrets, at least 32 characters each. Rotating them invalidates associated credentials.
- GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET: your own OAuth applications.
- ADMIN_EMAILS: comma-separated verified OAuth emails of bootstrap administrators.
- ENABLE_OPENAPI=true only after verification; default false.

Callbacks: https://mail.example.com/api/auth/callback/github and https://mail.example.com/api/auth/callback/google. Google's JavaScript origin is your site origin. Add test users while Google is in Testing, then publish according to Google's requirements. Never reuse the maintainer's credentials.

Without OAuth, leave API access disabled. Browser mailboxes still work and the dialog explains incomplete sign-in setup. Deployment checks reject missing mandatory settings and incomplete OAuth when API access is enabled.

## Administrators

Set your verified OAuth email in ADMIN_EMAILS, sign in, then open /admin. No first-user auto-promotion occurs. Administrators can change other users' roles from user details, but cannot change their own role. Remove bootstrap admins from ADMIN_EMAILS before demotion. Every admin request checks the current server-side role.

The dashboard paginates registered users, keys, mailboxes and the last 30 days of per-key daily usage. Metrics start after upgrade and may lag about 5 minutes. API calls count requests that pass key validation and consume user quota, including later business errors/global quota denials. Invalid-key and user-quota denials are excluded. Historical anonymous usage cannot be assigned to registered users. The dashboard does not expose full keys or message bodies.

## Deploy

Run:

    pnpm install --frozen-lockfile
    pnpm setup:check
    pnpm run deploy

Deployment validates settings, runs checks/build, applies D1 migrations, uploads Secrets, and deploys the Worker and DO migration. Generated wrangler.deploy.toml contains no secrets and is Git-ignored. Use CLOUDFLARE_API_TOKEN/CLOUDFLARE_ACCOUNT_ID (legacy CF names supported).

Forks using Actions must add these repository Actions Secrets. The workflow uses the same script. Upgrade with ENABLE_OPENAPI=false, verify both providers and mailbox flows, then enable API access. Preserve the existing mailbox signing secret. Failed configuration checks stop before migration.

Rolling back the Worker does not reactivate old keys or roll back D1/DO state. Prefer leaving this release deployed with API access disabled while investigating. Database restores require reviewing consistency with DO authorization state.

## Verify and monitor

Check both OAuth callbacks, three-key cap, shared quotas after rotation, immediate revocation, unauthenticated mailbox 401s, ordinary-user admin 403s, mailbox creation/receipt/read/delete/recovery and admin access.

Defaults: 30 API requests/minute, 1,000/day, 20 mailboxes/day and 20 active mailboxes/user. HTTP and inbound global limits are separately 100,000/day. The global cap is split into 16 fixed disjoint budgets: their sum cannot exceed the cap, but a busy shard can exhaust early. Daily windows reset at 00:00 UTC. Configure Cloudflare WAF rules and alerts, observe D1 rows and Worker/DO requests/CPU. Disable unused preview routes that bypass domain WAF.

ENABLE_OPENAPI=false pauses public API and key creation. SUSPEND_DATABASE_ACCESS=true pauses HTTP database entry, incoming mail and scheduled cleanup; queued aggregation may complete a small number of writes. Rejected requests still cost money.

For local development, copy .dev.vars.example to .dev.vars, use separate localhost OAuth apps, apply migrations with pnpm exec wrangler d1 migrations apply DB --local, then run pnpm dev.

GitHub Actions Secrets: use GH_OAUTH_CLIENT_ID and GH_OAUTH_CLIENT_SECRET (GitHub reserves the GITHUB_ prefix). The workflow maps these to Worker GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET.
