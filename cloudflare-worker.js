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
