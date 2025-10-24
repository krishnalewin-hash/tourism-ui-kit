/**
 * Parse JSON fields from database strings
 */
function parseJsonField(value) {
  if (!value) return [];
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

/**
 * Transform DB tour to API format (matches Google Sheets format)
 */
function transformTour(dbTour) {
  return {
    slug: dbTour.slug,
    name: dbTour.name,
    excerpt: dbTour.excerpt,
    descriptionHTML: dbTour.description_html,
    image: dbTour.image,
    gallery: parseJsonField(dbTour.gallery),
    location: dbTour.location,
    type: dbTour.type,
    duration: dbTour.duration,
    durationMinutes: dbTour.duration_minutes,
    pricingType: dbTour.pricing_type,
    fromPrice: dbTour.from_price,
    highlights: parseJsonField(dbTour.highlights),
    itinerary: parseJsonField(dbTour.itinerary),
    inclusions: parseJsonField(dbTour.inclusions),
    exclusions: parseJsonField(dbTour.exclusions),
    faqs: parseJsonField(dbTour.faqs),
    tags: parseJsonField(dbTour.tags),
  };
}

/**
 * Filter tours by mode and value (client-side filtering for JSON fields)
 */
function filterTours(tours, mode, value) {
  if (!mode || !value || mode === 'all') {
    return tours;
  }

  const normalizedValue = value.toLowerCase().trim();

  return tours.filter(tour => {
    switch (mode) {
      case 'type':
        return tour.type && tour.type.toLowerCase().trim() === normalizedValue;
      
      case 'tag':
        return tour.tags && Array.isArray(tour.tags) && 
               tour.tags.some(tag => tag.toLowerCase().trim() === normalizedValue);
      
      case 'keyword':
        const searchableText = [
          tour.name,
          tour.excerpt,
          ...(tour.tags || [])
        ].join(' ').toLowerCase();
        return searchableText.includes(normalizedValue);
      
      default:
        return true;
    }
  });
}

/**
 * GET /api/tours?client=xxx&mode=type&value=Adventure
 * Get all tours for a client, optionally filtered
 */
export async function getAllTours(request, env) {
  const { searchParams } = new URL(request.url);
  const clientName = searchParams.get('client');
  const filterMode = searchParams.get('mode');
  const filterValue = searchParams.get('value');

  if (!clientName) {
    return new Response(
      JSON.stringify({ error: 'Client parameter is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get client
    const client = await env.DB.prepare(
      'SELECT id FROM clients WHERE name = ? AND status = "active"'
    ).bind(clientName).first();

    if (!client) {
      return new Response(
        JSON.stringify({ error: 'Client not found', client: clientName }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get all tours for client
    const { results } = await env.DB.prepare(
      'SELECT * FROM tours WHERE client_id = ? AND status = "active" ORDER BY name ASC'
    ).bind(client.id).all();

    let tours = results.map(transformTour);

    // Apply filtering if requested
    if (filterMode && filterValue) {
      tours = filterTours(tours, filterMode, filterValue);
      console.log(`[API] Filtered ${results.length} tours to ${tours.length} (mode: ${filterMode}, value: ${filterValue})`);
    }

    return new Response(
      JSON.stringify({
        version: new Date().toISOString(),
        client: clientName,
        tours: tours,
        filter: filterMode && filterValue ? { mode: filterMode, value: filterValue } : null,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching tours:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch tours', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /api/tours/:slug?client=xxx
 * Get a single tour by slug
 */
export async function getTourBySlug(request, env, params) {
  const { searchParams } = new URL(request.url);
  const clientName = searchParams.get('client');
  const { slug } = params;

  if (!clientName) {
    return new Response(
      JSON.stringify({ error: 'Client parameter is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!slug) {
    return new Response(
      JSON.stringify({ error: 'Slug is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get client
    const client = await env.DB.prepare(
      'SELECT id FROM clients WHERE name = ? AND status = "active"'
    ).bind(clientName).first();

    if (!client) {
      return new Response(
        JSON.stringify({ error: 'Client not found', client: clientName }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get tour
    const tour = await env.DB.prepare(
      'SELECT * FROM tours WHERE client_id = ? AND slug = ? AND status = "active"'
    ).bind(client.id, slug).first();

    if (!tour) {
      return new Response(
        JSON.stringify({ error: 'Tour not found', slug: slug }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        version: new Date().toISOString(),
        client: clientName,
        tours: [transformTour(tour)],
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching tour:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch tour', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

