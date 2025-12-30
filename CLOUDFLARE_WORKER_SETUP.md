# Cloudflare Worker Setup for FPL CORS Proxy

This guide will help you deploy a CORS proxy to Cloudflare Workers for free.

## Prerequisites

- A Cloudflare account (free tier works fine)
- 5 minutes of your time

## Step-by-Step Setup

### 1. Create a Cloudflare Account

1. Go to [cloudflare.com](https://cloudflare.com)
2. Sign up for a free account (no credit card required)

### 2. Create a Worker from Hello World Template

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click on "Workers & Pages" in the left sidebar
3. Click "Create application"
4. Click "Create Worker"
5. Give it a name (e.g., `fpl-cors-proxy`)
6. Click "Deploy" (this will deploy the default Hello World worker)

### 3. Edit the Worker Code

1. After deployment, click "Edit code" button in the top right
2. You'll see the Hello World template code
3. **Delete all the code** in the editor
4. **Copy the entire code** from `cloudflare-worker.js` in this repository (shown below)
5. **Paste it** into the editor
6. Click "Save and Deploy" button (top right)

```javascript
export default {
  async fetch(request) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Get the target URL from query parameter
    const url = new URL(request.url)
    const targetUrl = url.searchParams.get('url')

    if (!targetUrl) {
      return new Response('Missing url parameter', { status: 400 })
    }

    // Only allow requests to FPL API
    if (!targetUrl.startsWith('https://fantasy.premierleague.com/api/')) {
      return new Response('Only FPL API requests are allowed', { status: 403 })
    }

    try {
      // Fetch from the FPL API
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      })

      // Create new response with CORS headers
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      })

      // Add CORS headers
      newResponse.headers.set('Access-Control-Allow-Origin', '*')
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type')

      return newResponse
    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: 500 })
    }
  }
}
```

### 4. Get Your Worker URL

After deployment, you'll see your worker URL. It will be something like:
```
https://fpl-cors-proxy.YOUR_USERNAME.workers.dev
```

Copy this URL - you'll need it in the next step.

### 5. Update Your index.html

Open `index.html` and find the `CORS_PROXIES` array (around line 318).

Update it to use your Cloudflare Worker as the first option:

```javascript
const CORS_PROXIES = [
    url => url, // Try direct first (works locally)
    url => `https://fpl-cors-proxy.YOUR_USERNAME.workers.dev?url=${encodeURIComponent(url)}`,
    url => `https://corsproxy.io/?${encodeURIComponent(url)}`
];
```

Replace `fpl-cors-proxy.YOUR_USERNAME.workers.dev` with your actual worker URL.

### 6. Test It

1. Commit and push your changes to GitHub
2. Open your GitHub Pages site
3. The FPL data should now load successfully!

## How It Works

The worker acts as a middleman:
1. Your GitHub Pages site sends a request to the Cloudflare Worker
2. The Worker fetches data from the FPL API
3. The Worker adds CORS headers to the response
4. Your site receives the data with proper CORS headers

## Free Tier Limits

Cloudflare Workers free tier includes:
- 100,000 requests per day
- More than enough for personal use (even with auto-refresh every 30 seconds)

## Troubleshooting

### Worker not working?
- Check the worker logs in the Cloudflare dashboard
- Make sure you copied the entire worker code
- Verify your worker URL is correct in `index.html`

### Still getting CORS errors?
- Clear your browser cache
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Check the browser console for the exact error message

## Security Note

This worker is configured to:
- Only allow GET requests
- Only proxy requests to the FPL API domain
- This prevents abuse of your worker

Your worker URL is public, but it can only be used to fetch FPL data, nothing else.
