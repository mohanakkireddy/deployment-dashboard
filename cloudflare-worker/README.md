# GitHub OAuth Token Exchange Proxy

This Cloudflare Worker handles the OAuth code-to-token exchange for the Deployment Dashboard.

## Why is this needed?

GitHub OAuth requires exchanging an authorization code for an access token. This exchange requires the **Client Secret**, which must never be exposed in client-side code. A backend proxy is needed to securely handle this exchange.

## Setup Instructions

### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Application name**: `Deployment Dashboard`
   - **Homepage URL**: `https://YOUR_USERNAME.github.io/deployment-dashboard/`
   - **Authorization callback URL**: `https://YOUR_USERNAME.github.io/deployment-dashboard/`
4. Click **Register application**
5. Copy the **Client ID**
6. Generate and copy the **Client Secret**

### 2. Deploy the Cloudflare Worker

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Sign up or log in (free tier works!)
3. Go to **Workers & Pages** → **Create application** → **Create Worker**
4. Give it a name (e.g., `github-oauth-proxy`)
5. Click **Deploy**
6. Click **Edit code** and replace with the contents of `worker.js`
7. Click **Save and Deploy**

### 3. Configure Environment Variables

In the Cloudflare Worker settings:

1. Go to **Settings** → **Variables**
2. Add the following environment variables:

| Variable | Value |
|----------|-------|
| `GITHUB_CLIENT_ID` | Your OAuth App's Client ID |
| `GITHUB_CLIENT_SECRET` | Your OAuth App's Client Secret |
| `ALLOWED_ORIGINS` | `https://YOUR_USERNAME.github.io` |

3. Click **Save**

### 4. Update the Dashboard Configuration

Edit `src/app/core/services/oauth.service.ts`:

```typescript
export const OAUTH_CONFIG = {
  clientId: 'YOUR_GITHUB_CLIENT_ID',
  tokenProxyUrl: 'https://YOUR_WORKER_NAME.YOUR_SUBDOMAIN.workers.dev/token',
  redirectUri: 'https://YOUR_USERNAME.github.io/deployment-dashboard/',
  scopes: 'repo read:org'
};
```

### 5. Rebuild and Deploy

```bash
npm run deploy
```

## Testing Locally

For local testing, you can add `http://localhost:4200` to the `ALLOWED_ORIGINS` in your Worker.

## Security Notes

- The Client Secret is stored securely in Cloudflare's environment variables
- CORS is configured to only allow requests from your GitHub Pages domain
- The worker only handles token exchange, not token storage
- Tokens are returned to the client for storage in localStorage

