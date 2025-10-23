import { handleHealth } from './handlers/health';
import { getAllTours, getTourBySlug } from './handlers/tours';
import { getEmbedTourScript, getEmbedAllToursScript } from './handlers/embed';
import { listClients, getClient, createClient, updateClient, deleteClient } from './handlers/admin-clients';
import { listTours, getTour, createTour, updateTour, deleteTour } from './handlers/admin-tours';
import { syncFromSheets, getSyncStatus } from './handlers/admin-sync';
import { withAdminAuth } from './middleware/auth';

class Router {
  constructor() {
    this.routes = [];
  }

  get(pattern, handler) {
    this.routes.push({ method: 'GET', pattern, handler });
  }

  post(pattern, handler) {
    this.routes.push({ method: 'POST', pattern, handler });
  }

  put(pattern, handler) {
    this.routes.push({ method: 'PUT', pattern, handler });
  }

  delete(pattern, handler) {
    this.routes.push({ method: 'DELETE', pattern, handler });
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

// Public Tours API endpoints
router.get('/api/tours', getAllTours);
router.get('/api/tours/:slug', getTourBySlug);

// Embed endpoints (return JavaScript)
router.get('/embed/tour/:slug', getEmbedTourScript);
router.get('/embed/tours', getEmbedAllToursScript);

// Admin Client Management (protected)
router.get('/admin/clients', withAdminAuth(listClients));
router.get('/admin/clients/:id', withAdminAuth(getClient));
router.post('/admin/clients', withAdminAuth(createClient));
router.put('/admin/clients/:id', withAdminAuth(updateClient));
router.delete('/admin/clients/:id', withAdminAuth(deleteClient));

// Admin Tour Management (protected)
router.get('/admin/tours', withAdminAuth(listTours));
router.get('/admin/tours/:id', withAdminAuth(getTour));
router.post('/admin/tours', withAdminAuth(createTour));
router.put('/admin/tours/:id', withAdminAuth(updateTour));
router.delete('/admin/tours/:id', withAdminAuth(deleteTour));

// Admin Sync Tools (protected)
router.get('/admin/sync/status', withAdminAuth(getSyncStatus));
router.post('/admin/sync/from-sheets', withAdminAuth(syncFromSheets));

export { router };

