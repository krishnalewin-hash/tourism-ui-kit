/**
 * Tourism UI Kit - Cloudflare Workers API
 * Main entry point
 */

import { handleRequest } from './router';
import { corsHeaders, handleCors } from './cors';

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCors(request);
    }

    try {
      // Route the request
      const response = await handleRequest(request, env, ctx);
      
      // Add CORS headers to response
      const headers = new Headers(response.headers);
      Object.entries(corsHeaders(request)).forEach(([key, value]) => {
        headers.set(key, value);
      });
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
      
    } catch (error) {
      console.error('Unhandled error:', error);
      
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(request)
        }
      });
    }
  }
};

