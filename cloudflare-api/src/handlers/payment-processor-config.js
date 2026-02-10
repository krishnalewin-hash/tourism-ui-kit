const JSON_HEADERS = { 'Content-Type': 'application/json' };

function parseJsonField(value) {
  if (!value || typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch (err) {
    console.warn('payment-processor-config: failed to parse JSON field', err);
    return null;
  }
}

/**
 * Get default return URL for WiPay based on client's allowed_origin
 */
function getDefaultReturnUrl(clientRecord, coreConfig) {
  // Try to get from TRANSFER_PAYMENT_URL first
  if (coreConfig && coreConfig.TRANSFER_PAYMENT_URL) {
    return coreConfig.TRANSFER_PAYMENT_URL;
  }
  
  // Otherwise construct from allowed_origin
  if (clientRecord && clientRecord.allowed_origin) {
    const origin = clientRecord.allowed_origin.replace(/\/$/, '');
    return `${origin}/payment-success`;
  }
  
  return null;
}

/**
 * Normalize payment config from database format to payment service format
 * Maps Admin UI fields to what paymentService.js expects
 */
function normalizePaymentConfig(gatewayConfig = {}, paymentApiUrl = null, processor, clientRecord = null, coreConfig = null) {
  // Map Admin UI field names to payment service expected format
  // Admin UI stores: accountId, secretKey, publicKey, mode, etc.
  // Payment service expects: credentials.merchantId, credentials.apiKey, credentials.baseUrl
  
  const normalized = {
    credentials: {
      // Map accountId (Admin UI) → merchantId (payment service)
      // For Square, accountId is the Location ID
      merchantId: gatewayConfig.accountId 
               || gatewayConfig.account_number 
               || gatewayConfig.accountNumber
               || gatewayConfig.merchantId
               || gatewayConfig.merchant_id
               || gatewayConfig.locationId
               || gatewayConfig.location_id
               || null,
      
      // Map secretKey (Admin UI) → apiKey (payment service)
      // For Square, secretKey is the Access Token
      apiKey: gatewayConfig.secretKey 
           || gatewayConfig.secret_key
           || gatewayConfig.apiKey
           || gatewayConfig.api_key
           || gatewayConfig.accessToken
           || gatewayConfig.access_token
           || null,
      
      // Map publicKey (Admin UI) → publicKey (payment service)
      // For Square, publicKey is the Application ID
      publicKey: gatewayConfig.publicKey
              || gatewayConfig.public_key
              || gatewayConfig.applicationId
              || gatewayConfig.application_id
              || gatewayConfig.clientId
              || gatewayConfig.client_id
              || null,
      
      // For WiPay, baseUrl should be the WiPay API endpoint, not the payment server URL
      // PAYMENT_API_URL is the payment server bridge, not the WiPay API endpoint
      // WiPay needs its own API endpoint (default: https://jm.wipaycaribbean.com/api/v1)
      // For Square, baseUrl defaults to Square API endpoints
      baseUrl: (processor === 'wipay' ? null : paymentApiUrl)
            || gatewayConfig.baseUrl 
            || gatewayConfig.base_url
            || gatewayConfig.server_url
            || gatewayConfig.serverUrl
            || null,
    },
    settings: {
      currency: gatewayConfig.currency || 'USD',
      mode: gatewayConfig.mode || 'live',
    },
    urls: {
      returnUrl: gatewayConfig.returnUrl 
              || gatewayConfig.return_url 
              || (processor === 'wipay' ? getDefaultReturnUrl(clientRecord, coreConfig) : null),
      cancelUrl: gatewayConfig.cancelUrl || gatewayConfig.cancel_url || null,
    },
  };

  // Processor-specific defaults
  if (processor === 'square') {
    // Square uses Application ID (publicKey), Access Token (apiKey), and Location ID (merchantId)
    // baseUrl is typically https://connect.squareup.com for Square API
    if (!normalized.credentials.baseUrl) {
      normalized.credentials.baseUrl = gatewayConfig.mode === 'test' 
        ? 'https://connect.squareupsandbox.com'
        : 'https://connect.squareup.com';
    }
  } else if (processor === 'wipay' && !normalized.credentials.baseUrl) {
    // For WiPay, always use the WiPay API endpoint
    // The PAYMENT_API_URL field is for the payment server bridge, not WiPay's API
    // Jamaica (JM): https://jm.wipayfinancial.com/plugins/payments/request
    normalized.credentials.baseUrl = 'https://jm.wipayfinancial.com/plugins/payments/request';
  }

  return normalized;
}

/**
 * GET /api/client-config/:slug/payment-processors/:processor
 * Returns payment processor configuration for a client
 */
export async function getPaymentProcessorConfig(request, env, params) {
  const clientSlug = decodeURIComponent(params.slug || '').trim().toLowerCase();
  const processor = decodeURIComponent(params.processor || '').trim().toLowerCase();

  if (!clientSlug) {
    return new Response(
      JSON.stringify({ error: 'Client slug is required' }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  if (!processor) {
    return new Response(
      JSON.stringify({ error: 'Payment processor name is required' }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  try {
    // Fetch client record from database
    let clientRecord = await env.DB.prepare(
      'SELECT * FROM clients WHERE LOWER(name) = ?'
    ).bind(clientSlug).first();

    if (!clientRecord && /^\d+$/.test(clientSlug)) {
      clientRecord = await env.DB.prepare(
        'SELECT * FROM clients WHERE id = ?'
      ).bind(parseInt(clientSlug, 10)).first();
    }

    if (!clientRecord) {
      return new Response(
        JSON.stringify({ error: 'Client not found' }),
        { status: 404, headers: JSON_HEADERS }
      );
    }

    // Parse core_config from database
    const coreConfig = parseJsonField(clientRecord.core_config);
    
    if (!coreConfig) {
      return new Response(
        JSON.stringify({ error: 'Client configuration not found' }),
        { status: 404, headers: JSON_HEADERS }
      );
    }

    // Check if requested processor matches configured gateway
    const configuredGateway = coreConfig.PAYMENT_GATEWAY?.toLowerCase();
    if (configuredGateway && configuredGateway !== processor) {
      // Still return the config, but log a warning
      console.warn(`[PaymentConfig] Requested processor ${processor} but client is configured for ${configuredGateway}`);
    }

    // Extract payment configuration
    const gatewayConfig = coreConfig.PAYMENT_GATEWAY_CONFIG || {};
    const paymentApiUrl = coreConfig.PAYMENT_API_URL || null;

    // Normalize the config for the payment service
    // Pass clientRecord and coreConfig for default returnUrl generation
    const normalizedConfig = normalizePaymentConfig(gatewayConfig, paymentApiUrl, processor, clientRecord, coreConfig);

    // Stripe: add allowedOrigins (explicit array or derived from returnUrl)
    if (processor === 'stripe') {
      const explicit = gatewayConfig.allowedOrigins || gatewayConfig.allowed_origins;
      if (Array.isArray(explicit) && explicit.length > 0) {
        normalizedConfig.allowedOrigins = explicit.filter(Boolean);
      } else {
        const returnUrl = normalizedConfig.urls?.returnUrl;
        normalizedConfig.allowedOrigins = [];
        if (returnUrl) {
          try {
            const u = new URL(returnUrl);
            normalizedConfig.allowedOrigins.push(u.origin);
          } catch (_) {}
        }
      }
    }

    // Validate that we have the minimum required fields
    const { merchantId, apiKey, baseUrl, publicKey } = normalizedConfig.credentials;
    
    // Square requires Application ID (publicKey), Access Token (apiKey), and Location ID (merchantId)
    if (processor === 'square') {
      if (!publicKey || !apiKey || !merchantId) {
        return new Response(
          JSON.stringify({
            error: `Square payment processor not fully configured for client ${clientSlug}`,
            missing: {
              applicationId: !publicKey,
              accessToken: !apiKey,
              locationId: !merchantId,
            },
            // Include partial config in development
            ...(process.env.NODE_ENV !== 'production' && { config: normalizedConfig })
          }),
          { status: 400, headers: JSON_HEADERS }
        );
      }
    } else if (processor === 'stripe') {
      if (!apiKey) {
        return new Response(
          JSON.stringify({
            error: `Stripe payment processor not fully configured for client ${clientSlug}`,
            missing: { secretKey: !apiKey },
          }),
          { status: 400, headers: JSON_HEADERS }
        );
      }
    } else if (!merchantId || !apiKey || !baseUrl) {
      return new Response(
        JSON.stringify({
          error: `Payment processor ${processor} not fully configured for client ${clientSlug}`,
          missing: {
            merchantId: !merchantId,
            apiKey: !apiKey,
            baseUrl: !baseUrl,
          },
          // Include partial config in development
          ...(process.env.NODE_ENV !== 'production' && { config: normalizedConfig })
        }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    return new Response(
      JSON.stringify(normalizedConfig),
      { status: 200, headers: JSON_HEADERS }
    );

  } catch (error) {
    console.error('Error fetching payment processor config:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
}

