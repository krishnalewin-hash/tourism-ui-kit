/**
 * Tours Handler
 */

import { jsonResponse } from '../router';

/**
 * GET /api/tours?client=funtrip-tours
 * Get all tours for a client (compatible with current Google Sheets format)
 */
export async function getToursHandler(request, env) {
  const url = new URL(request.url);
  const client = url.searchParams.get('client');
  
  if (!client) {
    return jsonResponse({ error: 'Missing client parameter' }, 400);
  }
  
  try {
    // Get client by slug
    const clientRecord = await env.DB.prepare(
      'SELECT id FROM clients WHERE slug = ? AND status = ?'
    ).bind(client, 'active').first();
    
    if (!clientRecord) {
      return jsonResponse({ 
        error: 'Client not found',
        client: client 
      }, 404);
    }
    
    // Get all active tours for this client
    const tours = await env.DB.prepare(
      'SELECT * FROM tours WHERE client_id = ? AND status = ? ORDER BY name ASC'
    ).bind(clientRecord.id, 'active').all();
    
    // Parse JSON fields
    const parsedTours = tours.results.map(tour => ({
      ...tour,
      gallery: safeParseJSON(tour.gallery, []),
      highlights: safeParseJSON(tour.highlights, []),
      itinerary: safeParseJSON(tour.itinerary, []),
      inclusions: safeParseJSON(tour.inclusions, []),
      exclusions: safeParseJSON(tour.exclusions, []),
      faqs: safeParseJSON(tour.faqs, []),
      tags: safeParseJSON(tour.tags, [])
    }));
    
    // Return in Google Sheets-compatible format
    const response = {
      version: new Date().toISOString(),
      client: client,
      tours: parsedTours
    };
    
    return jsonResponse(response, 200, 'public, s-maxage=300, stale-while-revalidate=86400');
    
  } catch (error) {
    console.error('Error fetching tours:', error);
    return jsonResponse({ 
      error: 'Failed to fetch tours',
      message: error.message 
    }, 500);
  }
}

/**
 * GET /api/tours/:slug?client=funtrip-tours
 * Get a specific tour by slug
 */
export async function getTourBySlugHandler(request, env, slug) {
  const url = new URL(request.url);
  const client = url.searchParams.get('client');
  
  if (!client) {
    return jsonResponse({ error: 'Missing client parameter' }, 400);
  }
  
  try {
    // Get client by slug
    const clientRecord = await env.DB.prepare(
      'SELECT id FROM clients WHERE slug = ? AND status = ?'
    ).bind(client, 'active').first();
    
    if (!clientRecord) {
      return jsonResponse({ 
        error: 'Client not found',
        client: client 
      }, 404);
    }
    
    // Get tour
    const tour = await env.DB.prepare(
      'SELECT * FROM tours WHERE client_id = ? AND slug = ? AND status = ?'
    ).bind(clientRecord.id, slug, 'active').first();
    
    if (!tour) {
      return jsonResponse({ 
        error: 'Tour not found',
        slug: slug 
      }, 404);
    }
    
    // Parse JSON fields
    const parsedTour = {
      ...tour,
      gallery: safeParseJSON(tour.gallery, []),
      highlights: safeParseJSON(tour.highlights, []),
      itinerary: safeParseJSON(tour.itinerary, []),
      inclusions: safeParseJSON(tour.inclusions, []),
      exclusions: safeParseJSON(tour.exclusions, []),
      faqs: safeParseJSON(tour.faqs, []),
      tags: safeParseJSON(tour.tags, [])
    };
    
    // Return in Google Sheets-compatible format
    const response = {
      version: new Date().toISOString(),
      client: client,
      tours: [parsedTour]
    };
    
    return jsonResponse(response, 200, 'public, s-maxage=300, stale-while-revalidate=86400');
    
  } catch (error) {
    console.error('Error fetching tour:', error);
    return jsonResponse({ 
      error: 'Failed to fetch tour',
      message: error.message 
    }, 500);
  }
}

/**
 * Safely parse JSON, return default value if invalid
 */
function safeParseJSON(value, defaultValue = null) {
  if (!value) return defaultValue;
  if (typeof value !== 'string') return value;
  
  try {
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
}

