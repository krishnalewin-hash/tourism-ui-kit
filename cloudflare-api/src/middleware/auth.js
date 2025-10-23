/**
 * Authentication middleware for admin endpoints
 */

/**
 * Validate admin API key from request headers
 */
export function requireAdminAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing Authorization header' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Support both "Bearer token" and "token" formats
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  // Check against environment variable
  const adminKey = env.ADMIN_API_KEY;
  
  if (!adminKey || token !== adminKey) {
    return new Response(
      JSON.stringify({ error: 'Invalid API key' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return null; // Auth successful
}

/**
 * Wrap a handler with admin authentication
 */
export function withAdminAuth(handler) {
  return async (request, env, params) => {
    const authError = requireAdminAuth(request, env);
    if (authError) return authError;
    
    return handler(request, env, params);
  };
}

