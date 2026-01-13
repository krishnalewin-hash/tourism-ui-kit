import { router } from './router';
import { corsHeaders, handleCors } from './cors';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCors();
    }

    // Redirect old edit-tour URLs to main dashboard
    if (url.pathname === '/edit-tour' || url.pathname.startsWith('/edit-tour?')) {
      const redirectUrl = new URL('/index.html', url.origin);
      // Preserve query parameters
      url.searchParams.forEach((value, key) => {
        redirectUrl.searchParams.set(key, value);
      });
      return Response.redirect(redirectUrl.toString(), 301);
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

    // Serve client core/config and other public client assets
    if (url.pathname.startsWith('/clients/')) {
      try {
        // Strip leading slash
        const assetPath = url.pathname.substring(1); // 'clients/...'
        const asset = await env.ASSETS.fetch(new Request(`https://dummy.com/${assetPath}`));
        
        if (asset.status === 404) {
          return new Response('File not found', { status: 404 });
        }
        
        const response = new Response(asset.body, asset);
        response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
        
        // Content type hints
        if (assetPath.endsWith('.json')) {
          response.headers.set('Content-Type', 'application/json');
        }
        
        return response;
      } catch (err) {
        console.error('Client asset error:', err);
        return new Response('Error serving client asset', { status: 500 });
      }
    }

    // Serve admin UI index.html for root path or /index.html
    if (url.pathname === '/' || url.pathname === '/index.html') {
      try {
        const asset = await env.ASSETS.fetch(new Request(`https://dummy.com/admin-ui/index.html`));
        
        if (asset.status === 404) {
          return new Response('Admin UI not found', { status: 404 });
        }
        
        const response = new Response(asset.body, asset);
        response.headers.set('Content-Type', 'text/html');
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        response.headers.set('Access-Control-Allow-Origin', '*');
        
        return response;
      } catch (err) {
        console.error('Admin UI index error:', err);
        return new Response('Error serving admin UI', { status: 500 });
      }
    }

    // Serve admin interface files
    if (url.pathname.startsWith('/admin-ui/')) {
      try {
        // Remove '/admin-ui/' prefix to get the file path
        const filePath = url.pathname.substring(10); // Remove '/admin-ui/'
        const asset = await env.ASSETS.fetch(new Request(`https://dummy.com/admin-ui/${filePath}`));
        
        if (asset.status === 404) {
          return new Response('File not found', { status: 404 });
        }
        
        // Clone response and add custom headers
        const response = new Response(asset.body, asset);
        
        // Set correct content type and cache headers
        if (filePath.endsWith('.html')) {
          response.headers.set('Content-Type', 'text/html');
          // No cache for HTML files to ensure updates are picked up
          response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
          response.headers.set('Pragma', 'no-cache');
          response.headers.set('Expires', '0');
        } else if (filePath.endsWith('.js')) {
          response.headers.set('Content-Type', 'application/javascript');
          response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600'); // 5 min cache
        } else if (filePath.endsWith('.css')) {
          response.headers.set('Content-Type', 'text/css');
          response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600'); // 5 min cache
        } else {
          response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600'); // 5 min cache
        }
        response.headers.set('Access-Control-Allow-Origin', '*');
        
        return response;
      } catch (err) {
        console.error('Admin UI file error:', err);
        return new Response('Error serving admin file', { status: 500 });
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

