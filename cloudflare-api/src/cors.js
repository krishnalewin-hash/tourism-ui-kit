/**
 * CORS Handler
 */

export function corsHeaders(request) {
  const origin = request.headers.get('Origin');
  
  // Allow specific origins or all in development
  const allowedOrigins = [
    'https://funtriptoursinjamaica.com',
    'https://kamartoursjamaica.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  const isAllowed = allowedOrigins.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

export function handleCors(request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request)
  });
}

