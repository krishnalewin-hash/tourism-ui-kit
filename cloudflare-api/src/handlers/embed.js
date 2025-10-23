/**
 * Embed endpoint - returns JavaScript that injects tour data
 * Usage: <script src="/embed/tour/:slug?client=xxx"></script>
 */

/**
 * Get a single tour by slug and return as embeddable JavaScript
 * GET /embed/tour/:slug?client=xxx
 */
export async function getEmbedTourScript(request, env, params) {
  const url = new URL(request.url);
  const client = url.searchParams.get('client');
  const slug = params.slug;

  if (!client) {
    return new Response(
      'console.error("[Embed] Missing client parameter");',
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'public, max-age=300' // 5 minutes
        }
      }
    );
  }

  if (!slug) {
    return new Response(
      'console.error("[Embed] Missing slug parameter");',
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'public, max-age=300'
        }
      }
    );
  }

  try {
    // Get client ID first
    const clientRecord = await env.DB.prepare(
      'SELECT id FROM clients WHERE name = ? AND status = "active"'
    ).bind(client).first();

    if (!clientRecord) {
      return new Response(
        `console.error("[Embed] Client not found: ${client}");`,
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'public, max-age=300'
          }
        }
      );
    }

    // Fetch tour from D1
    const result = await env.DB.prepare(`
      SELECT * FROM tours
      WHERE client_id = ? AND slug = ? AND status = "active"
      LIMIT 1
    `).bind(clientRecord.id, slug).first();

    if (!result) {
      return new Response(
        `console.error("[Embed] Tour not found: ${slug} for client: ${client}");`,
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'public, max-age=300'
          }
        }
      );
    }

    // Transform to match existing API format
    const tour = {
      slug: result.slug,
      name: result.name,
      excerpt: result.excerpt,
      descriptionHTML: result.description_html,
      image: result.image,
      gallery: tryParseJSON(result.gallery),
      location: result.location,
      type: result.type,
      duration: result.duration,
      durationMinutes: result.duration_minutes,
      pricingType: result.pricing_type,
      fromPrice: result.from_price,
      highlights: tryParseJSON(result.highlights),
      itinerary: tryParseJSON(result.itinerary),
      inclusions: tryParseJSON(result.inclusions),
      exclusions: tryParseJSON(result.exclusions),
      faqs: tryParseJSON(result.faqs),
      tags: tryParseJSON(result.tags)
    };

    // Generate JavaScript that injects data into the page
    const js = `
// Tourism UI Kit - Embedded Tour Data
(function() {
  'use strict';
  
  // Initialize global storage
  window.__TOUR_DATA__ = window.__TOUR_DATA__ || {};
  
  // Inject tour data
  window.__TOUR_DATA__["${slug}"] = ${JSON.stringify(tour)};
  
  // Set version for cache busting
  window.__TOUR_VERSION__ = "${Date.now()}";
  
  // Dispatch event for blocks that are already loaded
  if (typeof CustomEvent !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tour:ready', {
      detail: { 
        slug: "${slug}",
        tour: window.__TOUR_DATA__["${slug}"],
        version: window.__TOUR_VERSION__,
        source: 'embed'
      }
    }));
  }
  
  console.log('[Embed] Tour data loaded:', "${tour.name}");
})();
`.trim();

    return new Response(js, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5 min cache, 10 min stale
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff'
      }
    });

  } catch (error) {
    console.error('Embed error:', error);
    return new Response(
      `console.error("[Embed] Error loading tour: ${error.message}");`,
      {
        status: 500,
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'public, max-age=60' // Cache errors for 1 min only
        }
      }
    );
  }
}

/**
 * Get all tours for a client and return as embeddable JavaScript
 * GET /embed/tours?client=xxx
 */
export async function getEmbedAllToursScript(request, env) {
  const url = new URL(request.url);
  const client = url.searchParams.get('client');

  if (!client) {
    return new Response(
      'console.error("[Embed] Missing client parameter");',
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'public, max-age=300'
        }
      }
    );
  }

  try {
    // Get client ID first
    const clientRecord = await env.DB.prepare(
      'SELECT id FROM clients WHERE name = ? AND status = "active"'
    ).bind(client).first();

    if (!clientRecord) {
      return new Response(
        `console.error("[Embed] Client not found: ${client}");
window.__ALL_TOURS__ = [];`,
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'public, max-age=300'
          }
        }
      );
    }

    // Fetch all tours from D1
    const { results } = await env.DB.prepare(`
      SELECT * FROM tours
      WHERE client_id = ? AND status = "active"
      ORDER BY name ASC
    `).bind(clientRecord.id).all();

    if (!results || results.length === 0) {
      return new Response(
        `console.warn("[Embed] No tours found for client: ${client}");
window.__ALL_TOURS__ = [];`,
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'public, max-age=300'
          }
        }
      );
    }

    // Transform to match existing API format
    const tours = results.map(result => ({
      slug: result.slug,
      name: result.name,
      excerpt: result.excerpt,
      descriptionHTML: result.description_html,
      image: result.image,
      gallery: tryParseJSON(result.gallery),
      location: result.location,
      type: result.type,
      duration: result.duration,
      durationMinutes: result.duration_minutes,
      pricingType: result.pricing_type,
      fromPrice: result.from_price,
      highlights: tryParseJSON(result.highlights),
      itinerary: tryParseJSON(result.itinerary),
      inclusions: tryParseJSON(result.inclusions),
      exclusions: tryParseJSON(result.exclusions),
      faqs: tryParseJSON(result.faqs),
      tags: tryParseJSON(result.tags)
    }));

    // Generate JavaScript that injects data into the page
    const js = `
// Tourism UI Kit - Embedded All Tours Data
(function() {
  'use strict';
  
  // Initialize global storage
  window.__ALL_TOURS__ = ${JSON.stringify(tours)};
  window.__TOUR_DATA__ = window.__TOUR_DATA__ || {};
  
  // Also populate individual tour data for easy access
  window.__ALL_TOURS__.forEach(function(tour) {
    window.__TOUR_DATA__[tour.slug] = tour;
  });
  
  // Set version for cache busting
  window.__TOUR_VERSION__ = "${Date.now()}";
  
  console.log('[Embed] All tours loaded:', window.__ALL_TOURS__.length, 'tours');
})();
`.trim();

    return new Response(js, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5 min cache, 10 min stale
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff'
      }
    });

  } catch (error) {
    console.error('Embed error:', error);
    return new Response(
      `console.error("[Embed] Error loading tours: ${error.message}");`,
      {
        status: 500,
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'public, max-age=60'
        }
      }
    );
  }
}

/**
 * Helper: Try to parse JSON, return null if invalid
 */
function tryParseJSON(str) {
  if (!str || typeof str !== 'string') return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

