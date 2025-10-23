/**
 * Admin API handlers for client management
 */

/**
 * GET /admin/clients - List all clients
 */
export async function listClients(request, env) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, name, display_name, status, created_at, updated_at FROM clients ORDER BY name ASC'
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

    return new Response(
      JSON.stringify({
        success: true,
        client: {
          ...client,
          tour_count: tourCount?.count || 0,
        },
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
    const { name, display_name, status = 'active' } = body;

    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Client name is required' }),
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
      'INSERT INTO clients (name, display_name, status) VALUES (?, ?, ?)'
    ).bind(name, display_name || name, status).run();

    // Get the created client
    const client = await env.DB.prepare(
      'SELECT * FROM clients WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    return new Response(
      JSON.stringify({
        success: true,
        client: client,
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
    const { name, display_name, status } = body;

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

    return new Response(
      JSON.stringify({
        success: true,
        client: client,
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

