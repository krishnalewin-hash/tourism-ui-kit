import { router } from './router';
import { corsHeaders, handleCors } from './cors';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCors();
    }

    // Serve static assets (JS/CSS files)
    if (url.pathname.startsWith('/static/')) {
      try {
        // Remove '/static/' prefix to get the asset path
        const assetPath = url.pathname.substring(8); // Remove '/static/'
        const asset = await env.ASSETS.fetch(new Request(`https://dummy.com/${assetPath}`));
        
        if (asset.status === 404) {
          return new Response('File not found', { status: 404 });
        }
        
        // Clone response and add custom headers
        const response = new Response(asset.body, asset);
        response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600'); // 5 min cache
        response.headers.set('Access-Control-Allow-Origin', '*');
        
        return response;
      } catch (err) {
        console.error('Static file error:', err);
        return new Response('Error serving static file', { status: 500 });
      }
    }

    // Handle API routes
    try {
      const response = await router.handle(request, env);
      
      // Add CORS headers to all responses
      const newResponse = new Response(response.body, response);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newResponse.headers.set(key, value);
      });
      
      return newResponse;
    } catch (err) {
      console.error('Worker error:', err);
      return new Response(
        JSON.stringify({ error: 'Internal server error', message: err.message }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }
  },
};

