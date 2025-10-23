/**
 * API Router
 */

import { getToursHandler, getTourBySlugHandler } from './handlers/tours';
import { healthCheckHandler } from './handlers/health';

export async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Health check
  if (path === '/health' || path === '/') {
    return healthCheckHandler(request, env);
  }

  // API routes
  if (path.startsWith('/api/')) {
    
    // GET /api/tours - Get all tours for a client
    if (path === '/api/tours' && method === 'GET') {
      return getToursHandler(request, env);
    }
    
    // GET /api/tours/:slug - Get a specific tour
    const tourSlugMatch = path.match(/^\/api\/tours\/([^\/]+)$/);
    if (tourSlugMatch && method === 'GET') {
      return getTourBySlugHandler(request, env, tourSlugMatch[1]);
    }
    
    // No matching route
    return jsonResponse({ error: 'Not Found' }, 404);
  }

  // Fallback 404
  return jsonResponse({ error: 'Not Found' }, 404);
}

// Helper to create JSON responses
export function jsonResponse(data, status = 200, cacheControl = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (cacheControl) {
    headers['Cache-Control'] = cacheControl;
  }
  
  return new Response(JSON.stringify(data), {
    status,
    headers
  });
}

