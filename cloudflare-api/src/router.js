import { handleHealth } from './handlers/health';
import { getAllTours, getTourBySlug } from './handlers/tours';

class Router {
  constructor() {
    this.routes = [];
  }

  get(pattern, handler) {
    this.routes.push({ method: 'GET', pattern, handler });
  }

  async handle(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    for (const route of this.routes) {
      if (route.method !== method) continue;

      const match = this.matchRoute(path, route.pattern);
      if (match) {
        return route.handler(request, env, match.params);
      }
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  matchRoute(path, pattern) {
    // Simple pattern matching: /api/tours/:slug
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }

    return { params };
  }
}

const router = new Router();

// Health check
router.get('/health', handleHealth);

// Tours endpoints
router.get('/api/tours', getAllTours);
router.get('/api/tours/:slug', getTourBySlug);

export { router };

