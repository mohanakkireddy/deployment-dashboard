/**
 * GitHub OAuth Token Exchange Proxy for Cloudflare Workers
 * 
 * This worker handles the OAuth code-to-token exchange securely.
 * Deploy this to Cloudflare Workers (free tier available).
 * 
 * Setup:
 * 1. Go to https://dash.cloudflare.com/
 * 2. Create a new Worker
 * 3. Paste this code
 * 4. Add environment variables:
 *    - GITHUB_CLIENT_ID: Your OAuth App's Client ID
 *    - GITHUB_CLIENT_SECRET: Your OAuth App's Client Secret
 *    - ALLOWED_ORIGINS: Comma-separated list of allowed origins (e.g., "https://username.github.io")
 */

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(request, env);
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(request.url);

    // Token exchange endpoint
    if (url.pathname === '/token') {
      return handleTokenExchange(request, env);
    }

    return new Response('Not found', { status: 404 });
  }
};

async function handleTokenExchange(request, env) {
  try {
    const { code, redirect_uri } = await request.json();

    if (!code) {
      return jsonResponse({ error: 'Missing code parameter' }, 400, request, env);
    }

    // Exchange code for token with GitHub
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: redirect_uri
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return jsonResponse({ error: tokenData.error_description || tokenData.error }, 400, request, env);
    }

    return jsonResponse({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      scope: tokenData.scope
    }, 200, request, env);

  } catch (error) {
    console.error('Token exchange error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500, request, env);
  }
}

function handleCORS(request, env) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = (env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim());

  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };

  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return new Response(null, { headers });
}

function jsonResponse(data, status, request, env) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = (env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim());

  const headers = {
    'Content-Type': 'application/json'
  };

  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return new Response(JSON.stringify(data), { status, headers });
}

