/**
 * Health Check Handler
 */

import { jsonResponse } from '../router';

export async function healthCheckHandler(request, env) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: env.API_VERSION || '1.0.0',
    environment: env.ENVIRONMENT || 'development'
  };
  
  // Test database connection
  try {
    const result = await env.DB.prepare('SELECT 1 as test').first();
    health.database = result ? 'connected' : 'error';
  } catch (error) {
    health.database = 'error';
    health.database_error = error.message;
  }
  
  return jsonResponse(health, 200, 'no-store');
}

