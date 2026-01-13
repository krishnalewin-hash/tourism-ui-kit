/**
 * Admin API handlers for client management
 */

function serializeJsonField(fieldName, value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch (err) {
      throw new Error(`Invalid JSON for ${fieldName}`);
    }
  }

  try {
    return JSON.stringify(value);
  } catch (err) {
    throw new Error(`Invalid JSON for ${fieldName}`);
  }
}

function parseJsonField(value) {
  if (!value || typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch (err) {
    console.warn('Failed to parse JSON field:', err);
    return null;
  }
}

/**
 * GET /admin/clients - List all clients
 */
export async function listClients(request, env) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, name, display_name, status, google_maps_api_key, country, allowed_origin, created_at, updated_at FROM clients ORDER BY name ASC'
    ).all();

    return new Response(
      JSON.stringify({
        success: true,
        clients: results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error listing clients:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to list clients', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /admin/clients/:id - Get a single client
 */
export async function getClient(request, env, params) {
  const { id } = params;

  try {
    const client = await env.DB.prepare(
      'SELECT * FROM clients WHERE id = ?'
    ).bind(id).first();

    if (!client) {
      return new Response(
        JSON.stringify({ error: 'Client not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get tour count for this client
    const tourCount = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM tours WHERE client_id = ?'
    ).bind(id).first();

    const quoteResultsConfig = parseJsonField(client.quote_results_config);
    const coreConfig = parseJsonField(client.core_config);
    const contactConfig = parseJsonField(client.contact_config);

    const responseClient = {
      ...client,
      quote_results_config: quoteResultsConfig,
      core_config: coreConfig,
      contact_config: contactConfig,
      FORM_CONFIG: coreConfig?.FORM_CONFIG,
      QUOTE_RESULTS_CONFIG: quoteResultsConfig || coreConfig?.QUOTE_RESULTS_CONFIG,
      CONTACT_CONFIG: contactConfig || coreConfig?.CONTACT_CONFIG,
      tour_count: tourCount?.count || 0,
    };

    return new Response(
      JSON.stringify({
        success: true,
        client: responseClient,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error getting client:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get client', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /admin/clients - Create a new client
 */
export async function createClient(request, env) {
  try {
    const body = await request.json();
    const {
      name,
      display_name,
      status = 'active',
      google_maps_api_key,
      country,
      allowed_origin,
      quote_results_config,
      core_config,
      contact_config,
      client_email,
      client_phone,
      preferred_contact_method,
    } = body;

    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Client name is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let quoteResultsValue = null;
    let coreConfigValue = null;
    let contactConfigValue = null;

    try {
      quoteResultsValue = serializeJsonField('quote_results_config', quote_results_config);
      coreConfigValue = serializeJsonField('core_config', core_config);
      contactConfigValue = serializeJsonField('contact_config', contact_config);
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message || 'Invalid client configuration' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if client already exists
    const existing = await env.DB.prepare(
      'SELECT id FROM clients WHERE name = ?'
    ).bind(name).first();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Client already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create client
    const result = await env.DB.prepare(
      'INSERT INTO clients (name, display_name, status, google_maps_api_key, country, allowed_origin, quote_results_config, core_config, contact_config, client_email, client_phone, preferred_contact_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      name,
      display_name || name,
      status,
      google_maps_api_key || null,
      country ? String(country).trim() || null : null,
      allowed_origin ? String(allowed_origin).trim() || null : null,
      quoteResultsValue,
      coreConfigValue,
      contactConfigValue,
      client_email || null,
      client_phone || null,
      preferred_contact_method || null
    ).run();

    // Get the created client
    const client = await env.DB.prepare(
      'SELECT * FROM clients WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    const responseClient = {
      ...client,
      quote_results_config: parseJsonField(client.quote_results_config),
      core_config: parseJsonField(client.core_config),
      contact_config: parseJsonField(client.contact_config),
    };

    return new Response(
      JSON.stringify({
        success: true,
        client: responseClient,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating client:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create client', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * PUT /admin/clients/:id - Update a client
 */
export async function updateClient(request, env, params) {
  const { id } = params;

  try {
    const body = await request.json();
    const {
      name,
      display_name,
      status,
      google_maps_api_key,
      country,
      allowed_origin,
      quote_results_config,
      core_config,
      contact_config,
      client_email,
      client_phone,
      preferred_contact_method,
    } = body;

    // Check if client exists
    const existing = await env.DB.prepare(
      'SELECT id FROM clients WHERE id = ?'
    ).bind(id).first();

    if (!existing) {
      return new Response(
        JSON.stringify({ error: 'Client not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (display_name !== undefined) {
      updates.push('display_name = ?');
      values.push(display_name);
    }
    if (status) {
      updates.push('status = ?');
      values.push(status);
    }
    if (google_maps_api_key !== undefined) {
      updates.push('google_maps_api_key = ?');
      values.push(google_maps_api_key || null);
    }

    if (body.hasOwnProperty('country')) {
      updates.push('country = ?');
      const normalizedCountry = country ? String(country).trim() : '';
      values.push(normalizedCountry || null);
    }

    if (body.hasOwnProperty('allowed_origin')) {
      updates.push('allowed_origin = ?');
      const normalizedOrigin = allowed_origin ? String(allowed_origin).trim() : '';
      values.push(normalizedOrigin || null);
      console.log('[updateClient] Updating allowed_origin:', normalizedOrigin || null, 'from body:', allowed_origin);
    } else {
      console.log('[updateClient] allowed_origin not in body, skipping update');
    }

    if (body.hasOwnProperty('quote_results_config')) {
      try {
        updates.push('quote_results_config = ?');
        values.push(serializeJsonField('quote_results_config', quote_results_config));
      } catch (err) {
        return new Response(
          JSON.stringify({ error: err.message || 'Invalid quote_results_config' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    if (body.hasOwnProperty('core_config')) {
      try {
        updates.push('core_config = ?');
        values.push(serializeJsonField('core_config', core_config));
      } catch (err) {
        return new Response(
          JSON.stringify({ error: err.message || 'Invalid core_config' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    if (body.hasOwnProperty('contact_config')) {
      try {
        updates.push('contact_config = ?');
        values.push(serializeJsonField('contact_config', contact_config));
      } catch (err) {
        return new Response(
          JSON.stringify({ error: err.message || 'Invalid contact_config' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle contact preference fields
    if (body.hasOwnProperty('client_email')) {
      updates.push('client_email = ?');
      values.push(client_email || null);
    }

    if (body.hasOwnProperty('client_phone')) {
      updates.push('client_phone = ?');
      values.push(client_phone || null);
    }

    if (body.hasOwnProperty('preferred_contact_method')) {
      updates.push('preferred_contact_method = ?');
      values.push(preferred_contact_method || null);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id); // For WHERE clause

    if (updates.length === 1) {
      return new Response(
        JSON.stringify({ error: 'No fields to update' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await env.DB.prepare(
      `UPDATE clients SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    // Get updated client
    const client = await env.DB.prepare(
      'SELECT * FROM clients WHERE id = ?'
    ).bind(id).first();

    const responseClient = {
      ...client,
      quote_results_config: parseJsonField(client.quote_results_config),
      core_config: parseJsonField(client.core_config),
      contact_config: parseJsonField(client.contact_config),
    };

    return new Response(
      JSON.stringify({
        success: true,
        client: responseClient,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating client:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update client', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * DELETE /admin/clients/:id - Delete a client
 */
export async function deleteClient(request, env, params) {
  const { id } = params;

  try {
    // Check if client exists
    const existing = await env.DB.prepare(
      'SELECT id, name FROM clients WHERE id = ?'
    ).bind(id).first();

    if (!existing) {
      return new Response(
        JSON.stringify({ error: 'Client not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete all tours for this client first
    await env.DB.prepare(
      'DELETE FROM tours WHERE client_id = ?'
    ).bind(id).run();

    // Delete client
    await env.DB.prepare(
      'DELETE FROM clients WHERE id = ?'
    ).bind(id).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Client "${existing.name}" and all associated tours deleted`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting client:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete client', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

