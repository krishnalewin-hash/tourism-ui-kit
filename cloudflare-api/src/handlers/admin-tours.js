/**
 * Admin API handlers for tour management
 */

/**
 * Helper to parse and validate JSON array fields
 */
function parseArrayField(value, fieldName) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      throw new Error(`Invalid JSON for ${fieldName}`);
    }
  }
  
  return [];
}

/**
 * GET /admin/tours - List all tours (optionally filtered by client)
 */
export async function listTours(request, env) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = 'SELECT * FROM tours WHERE 1=1';
    const bindings = [];

    if (clientId) {
      query += ' AND client_id = ?';
      bindings.push(clientId);
    }

    if (status !== 'all') {
      query += ' AND status = ?';
      bindings.push(status);
    }

    query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    bindings.push(limit, offset);

    const { results } = await env.DB.prepare(query).bind(...bindings).all();

    // Parse JSON fields
    const tours = results.map(t => ({
      ...t,
      gallery: JSON.parse(t.gallery || '[]'),
      highlights: JSON.parse(t.highlights || '[]'),
      itinerary: JSON.parse(t.itinerary || '[]'),
      inclusions: JSON.parse(t.inclusions || '[]'),
      exclusions: JSON.parse(t.exclusions || '[]'),
      faqs: JSON.parse(t.faqs || '[]'),
      tags: JSON.parse(t.tags || '[]'),
    }));

    return new Response(
      JSON.stringify({
        success: true,
        tours: tours,
        pagination: {
          limit,
          offset,
          count: tours.length,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error listing tours:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to list tours', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /admin/tours/:id - Get a single tour
 */
export async function getTour(request, env, params) {
  const { id } = params;

  try {
    const tour = await env.DB.prepare(
      'SELECT * FROM tours WHERE id = ?'
    ).bind(id).first();

    if (!tour) {
      return new Response(
        JSON.stringify({ error: 'Tour not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON fields
    const tourData = {
      ...tour,
      gallery: JSON.parse(tour.gallery || '[]'),
      highlights: JSON.parse(tour.highlights || '[]'),
      itinerary: JSON.parse(tour.itinerary || '[]'),
      inclusions: JSON.parse(tour.inclusions || '[]'),
      exclusions: JSON.parse(tour.exclusions || '[]'),
      faqs: JSON.parse(tour.faqs || '[]'),
      tags: JSON.parse(tour.tags || '[]'),
    };

    return new Response(
      JSON.stringify({
        success: true,
        tour: tourData,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error getting tour:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get tour', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /admin/tours - Create a new tour
 */
export async function createTour(request, env) {
  try {
    const body = await request.json();
    const {
      client_id,
      slug,
      name,
      excerpt,
      description_html,
      image,
      gallery,
      location,
      type,
      duration,
      duration_minutes,
      pricing_type,
      from_price,
      highlights,
      itinerary,
      inclusions,
      exclusions,
      faqs,
      tags,
      status = 'active',
    } = body;

    // Validate required fields
    if (!client_id || !slug || !name) {
      return new Response(
        JSON.stringify({ error: 'client_id, slug, and name are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if client exists
    const client = await env.DB.prepare(
      'SELECT id FROM clients WHERE id = ?'
    ).bind(client_id).first();

    if (!client) {
      return new Response(
        JSON.stringify({ error: 'Client not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if slug already exists for this client
    const existing = await env.DB.prepare(
      'SELECT id FROM tours WHERE client_id = ? AND slug = ?'
    ).bind(client_id, slug).first();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Tour with this slug already exists for this client' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate array fields
    const galleryArray = parseArrayField(gallery, 'gallery');
    const highlightsArray = parseArrayField(highlights, 'highlights');
    const itineraryArray = parseArrayField(itinerary, 'itinerary');
    const inclusionsArray = parseArrayField(inclusions, 'inclusions');
    const exclusionsArray = parseArrayField(exclusions, 'exclusions');
    const faqsArray = parseArrayField(faqs, 'faqs');
    const tagsArray = parseArrayField(tags, 'tags');

    // Create tour
    const result = await env.DB.prepare(`
      INSERT INTO tours (
        client_id, slug, name, excerpt, description_html, image, gallery,
        location, type, duration, duration_minutes, pricing_type, from_price,
        highlights, itinerary, inclusions, exclusions, faqs, tags, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      client_id, slug, name, excerpt, description_html, image,
      JSON.stringify(galleryArray),
      location, type, duration, duration_minutes, pricing_type, from_price,
      JSON.stringify(highlightsArray),
      JSON.stringify(itineraryArray),
      JSON.stringify(inclusionsArray),
      JSON.stringify(exclusionsArray),
      JSON.stringify(faqsArray),
      JSON.stringify(tagsArray),
      status
    ).run();

    // Get the created tour
    const tour = await env.DB.prepare(
      'SELECT * FROM tours WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    // Parse JSON fields for response
    const tourData = {
      ...tour,
      gallery: JSON.parse(tour.gallery || '[]'),
      highlights: JSON.parse(tour.highlights || '[]'),
      itinerary: JSON.parse(tour.itinerary || '[]'),
      inclusions: JSON.parse(tour.inclusions || '[]'),
      exclusions: JSON.parse(tour.exclusions || '[]'),
      faqs: JSON.parse(tour.faqs || '[]'),
      tags: JSON.parse(tour.tags || '[]'),
    };

    return new Response(
      JSON.stringify({
        success: true,
        tour: tourData,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating tour:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create tour', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * PUT /admin/tours/:id - Update a tour
 */
export async function updateTour(request, env, params) {
  const { id } = params;

  try {
    const body = await request.json();

    // Check if tour exists
    const existing = await env.DB.prepare(
      'SELECT id FROM tours WHERE id = ?'
    ).bind(id).first();

    if (!existing) {
      return new Response(
        JSON.stringify({ error: 'Tour not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    // Simple fields
    const simpleFields = [
      'slug', 'name', 'excerpt', 'description_html', 'image', 'location',
      'type', 'duration', 'duration_minutes', 'pricing_type', 'from_price', 'status'
    ];

    for (const field of simpleFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    // Array fields (need JSON stringification)
    const arrayFields = ['gallery', 'highlights', 'itinerary', 'inclusions', 'exclusions', 'faqs', 'tags'];
    
    for (const field of arrayFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        const arrayData = parseArrayField(body[field], field);
        values.push(JSON.stringify(arrayData));
      }
    }

    if (updates.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No fields to update' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id); // For WHERE clause

    await env.DB.prepare(
      `UPDATE tours SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    // Get updated tour
    const tour = await env.DB.prepare(
      'SELECT * FROM tours WHERE id = ?'
    ).bind(id).first();

    // Parse JSON fields for response
    const tourData = {
      ...tour,
      gallery: JSON.parse(tour.gallery || '[]'),
      highlights: JSON.parse(tour.highlights || '[]'),
      itinerary: JSON.parse(tour.itinerary || '[]'),
      inclusions: JSON.parse(tour.inclusions || '[]'),
      exclusions: JSON.parse(tour.exclusions || '[]'),
      faqs: JSON.parse(tour.faqs || '[]'),
      tags: JSON.parse(tour.tags || '[]'),
    };

    return new Response(
      JSON.stringify({
        success: true,
        tour: tourData,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating tour:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update tour', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * DELETE /admin/tours/:id - Delete a tour
 */
export async function deleteTour(request, env, params) {
  const { id } = params;

  try {
    // Check if tour exists
    const existing = await env.DB.prepare(
      'SELECT id, name FROM tours WHERE id = ?'
    ).bind(id).first();

    if (!existing) {
      return new Response(
        JSON.stringify({ error: 'Tour not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete tour
    await env.DB.prepare(
      'DELETE FROM tours WHERE id = ?'
    ).bind(id).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Tour "${existing.name}" deleted`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting tour:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete tour', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

