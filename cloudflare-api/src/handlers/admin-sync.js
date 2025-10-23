/**
 * Admin endpoint to sync data from Google Sheets to D1
 * This is a one-time migration tool
 */

// Helper to parse array fields from Google Sheets
function parseArrayField(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  
  try {
    const cleaned = value.trim().replace(/,\s*$/, '');
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * POST /admin/sync/from-sheets
 * Fetches data from Google Sheets and imports it into D1
 */
export async function syncFromSheets(request, env) {
  try {
    const body = await request.json();
    const { sheets_url, client_name } = body;

    if (!sheets_url || !client_name) {
      return new Response(
        JSON.stringify({ error: 'sheets_url and client_name are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Ensure client exists
    let client = await env.DB.prepare(
      'SELECT id, name FROM clients WHERE name = ?'
    ).bind(client_name).first();

    if (!client) {
      // Create client if it doesn't exist
      const result = await env.DB.prepare(
        'INSERT INTO clients (name, display_name, status) VALUES (?, ?, ?)'
      ).bind(client_name, client_name, 'active').run();
      
      client = {
        id: result.meta.last_row_id,
        name: client_name
      };
    }

    // Step 2: Fetch data from Google Sheets
    const response = await fetch(sheets_url, {
      method: 'GET',
      follow: 20 // Handle redirects
    });

    if (!response.ok) {
      throw new Error(`Google Sheets API returned ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.tours || !Array.isArray(data.tours)) {
      throw new Error('Invalid response from Google Sheets API');
    }

    // Step 3: Import tours into D1
    let imported = 0;
    let updated = 0;
    let errors = [];

    for (const tour of data.tours) {
      try {
        // Check if tour already exists
        const existing = await env.DB.prepare(
          'SELECT id FROM tours WHERE client_id = ? AND slug = ?'
        ).bind(client.id, tour.slug).first();

        // Parse array fields
        const gallery = parseArrayField(tour.gallery);
        const highlights = parseArrayField(tour.highlights);
        const itinerary = parseArrayField(tour.itinerary);
        const inclusions = parseArrayField(tour.inclusions);
        const exclusions = parseArrayField(tour.exclusions);
        const faqs = parseArrayField(tour.faqs);
        const tags = parseArrayField(tour.tags);

        if (existing) {
          // Update existing tour
          await env.DB.prepare(`
            UPDATE tours SET
              name = ?,
              excerpt = ?,
              description_html = ?,
              image = ?,
              gallery = ?,
              location = ?,
              type = ?,
              duration = ?,
              duration_minutes = ?,
              pricing_type = ?,
              from_price = ?,
              highlights = ?,
              itinerary = ?,
              inclusions = ?,
              exclusions = ?,
              faqs = ?,
              tags = ?,
              status = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(
            tour.name,
            tour.excerpt || null,
            tour.descriptionHTML || tour.description_html || null,
            tour.image || null,
            JSON.stringify(gallery),
            tour.location || null,
            tour.type || null,
            tour.duration || null,
            tour.durationMinutes || tour.duration_minutes || null,
            tour.pricingType || tour.pricing_type || null,
            tour.fromPrice || tour.from_price || null,
            JSON.stringify(highlights),
            JSON.stringify(itinerary),
            JSON.stringify(inclusions),
            JSON.stringify(exclusions),
            JSON.stringify(faqs),
            JSON.stringify(tags),
            tour.status || 'active',
            existing.id
          ).run();
          
          updated++;
        } else {
          // Insert new tour
          await env.DB.prepare(`
            INSERT INTO tours (
              client_id, slug, name, excerpt, description_html, image, gallery,
              location, type, duration, duration_minutes, pricing_type, from_price,
              highlights, itinerary, inclusions, exclusions, faqs, tags, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            client.id,
            tour.slug,
            tour.name,
            tour.excerpt || null,
            tour.descriptionHTML || tour.description_html || null,
            tour.image || null,
            JSON.stringify(gallery),
            tour.location || null,
            tour.type || null,
            tour.duration || null,
            tour.durationMinutes || tour.duration_minutes || null,
            tour.pricingType || tour.pricing_type || null,
            tour.fromPrice || tour.from_price || null,
            JSON.stringify(highlights),
            JSON.stringify(itinerary),
            JSON.stringify(inclusions),
            JSON.stringify(exclusions),
            JSON.stringify(faqs),
            JSON.stringify(tags),
            tour.status || 'active'
          ).run();
          
          imported++;
        }
      } catch (error) {
        console.error(`Error importing tour ${tour.slug}:`, error);
        errors.push({
          slug: tour.slug,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sync completed',
        stats: {
          total: data.tours.length,
          imported,
          updated,
          errors: errors.length
        },
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: 'Sync failed', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /admin/sync/status
 * Returns sync statistics (client and tour counts)
 */
export async function getSyncStatus(request, env) {
  try {
    const clientCount = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM clients'
    ).first();

    const tourCount = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM tours'
    ).first();

    const clientStats = await env.DB.prepare(`
      SELECT 
        c.id,
        c.name,
        c.display_name,
        COUNT(t.id) as tour_count
      FROM clients c
      LEFT JOIN tours t ON t.client_id = c.id
      GROUP BY c.id, c.name, c.display_name
      ORDER BY c.name
    `).all();

    return new Response(
      JSON.stringify({
        success: true,
        totals: {
          clients: clientCount.count,
          tours: tourCount.count
        },
        clients: clientStats.results
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Status error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get status', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

