<div align="center">
  <h1>𝐕𝐌𝐀𝐈𝐋.𝐃𝐄𝐕</h1>
  <p><a href="https://discord.gg/d68kWCBDEs">Discord</a> · English | <a href="/README.md">简体中文</a></p>
  <p>Temporary email service build with email worker.</p>
  </div>

## Features

- 🎯 Privacy-friendly, no registration required, out-of-the-box
- ✈️ Support email sending and receiving
- ✨ Support saving passwords and retrieving email addresses
- 😄 Support multiple domain name suffixes
- 🔌 **Open RESTful API**, support programmatic access
- 🚀 100% open source, quick deployment, pure Cloudflare solution, no server required

Principles：

- Receiving emails (Cloudflare Email Worker)
- Display email (Vite + React on Cloudflare Pages)
- Mail Storage (Cloudflare D1)
- Send email using MailChannels API

## 📖 API Documentation

Vmail provides a complete RESTful API for programmatic access to create temporary mailboxes and query inboxes.

### Get API Key

Visit the [API Documentation Page](https://vmail.dev/api-docs) to create a free API Key.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/mailboxes` | Create temporary mailbox |
| `GET` | `/api/v1/mailboxes/:id` | Get mailbox information |
| `GET` | `/api/v1/mailboxes/:id/messages` | Get inbox (with pagination) |
| `GET` | `/api/v1/mailboxes/:id/messages/:messageId` | Get message details |
| `DELETE` | `/api/v1/mailboxes/:id/messages/:messageId` | Delete message |

### Quick Start

```bash
# 1. Create temporary mailbox
curl -X POST https://vmail.dev/api/v1/mailboxes \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json"

# Response: { "data": { "id": "abc123", "address": "random@domain.com", ... } }

# 2. Query inbox
curl https://vmail.dev/api/v1/mailboxes/abc123/messages \
  -H "X-API-Key: your-api-key"

# 3. Get message details
curl https://vmail.dev/api/v1/mailboxes/abc123/messages/msg_001 \
  -H "X-API-Key: your-api-key"
```

Full documentation: [https://vmail.dev/api-docs](https://vmail.dev/api-docs)

## Self-hosted Tutorial

This project is now fully based on Cloudflare Pages and Cloudflare D1, which greatly simplifies the deployment process. All you need is a domain name hosted on Cloudflare.

### Requirements

- [Cloudflare](https://dash.cloudflare.com/) account and a domain name hosted on Cloudflare
- Local installation of [Node.js](https://nodejs.org) (version >= 18.x) and [pnpm](https://pnpm.io/installation)

### Automatic Deployment (Recommended)

This project includes a pre-configured GitHub Action workflow to help you automatically deploy the Vmail application to Cloudflare.

For detailed steps, please refer to the [GitHub Action Auto-Deployment Tutorial](/docs/github-action-tutorial.md).

### Manual Deployment Steps

1.  **Clone the project locally**
    ```bash
    git clone https://github.com/oiov/vmail
    cd vmail
    pnpm install
    ```

2.  **Create a Cloudflare D1 Database**
    Create a D1 database in the Cloudflare dashboard or using the Wrangler CLI.

3.  **Configure `wrangler.toml`**
    Replace the `${...}` placeholders in the `wrangler.toml` file in the root directory with your Cloudflare and D1 configuration information. You can also set these values through environment variables in Cloudflare Pages.

4.  **Build and Deploy**
    ```bash
    # Build the frontend application
    pnpm run build
    
    # Deploy to Cloudflare
    pnpm run deploy
    ```
    Wrangler will automatically handle the deployment of frontend static assets and the Worker, and apply database migrations according to the configuration.

5.  **Configure Email Routing Rules**
    In your Cloudflare domain management interface, go to `Email` -> `Email Routing` -> `Routes`, set up a `Catch-all` rule, and set the action to `Send to a Worker`, selecting the Worker you just deployed.

## Local development

1.  **Copy the environment variable file**
    ```bash
    # This command creates a local environment variable file that wrangler dev will load automatically
    cp .env.example .env
    ```

2.  **Fill in local environment variables**
    Fill in the necessary environment variables in the `.env` file, especially `D1_DATABASE_ID`, etc. You need to create a D1 database in Cloudflare for local development first.

3.  **Start the development server**
    ```bash
    pnpm run dev
    ```
    This command starts both the frontend Vite development server and the local Wrangler Worker environment at the same time.


### Environment Variables

When deploying to Cloudflare Pages, you need to configure the following environment variables:

-   `DATABASE_NAME`: Your D1 database name.
-   `DATABASE_ID`: Your D1 database ID.
-   `TURNSTILE_KEY`: Your Turnstile site key.
-   `TURNSTILE_SECRET`: Your Turnstile secret key.
-   `COOKIES_SECRET`: A secret used to sign cookies.

## Community Group

- Discord: https://discord.gg/d68kWCBDEs

## License

GNU General Public License v3.0

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=oiov/vmail&type=Date)](https://star-history.com/#oiov/vmail&Date)