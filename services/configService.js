/**
 * Config Service
 * Loads payment gateway configurations from Cloudflare Worker API
 */

const WORKER_API_BASE = process.env.WORKER_API_BASE || 'https://tourism-api-production.krishna-0a3.workers.dev';

// Ensure fetch is available (Node.js 18+ has native fetch, older versions need polyfill)
const fetch = globalThis.fetch || require('node-fetch');

/**
 * Load Square configuration for a client
 * @param {string} client - Client identifier (e.g., 'jacko-expert-travels')
 * @returns {Promise<Object|null>} Square config with accessToken and mode, or null if not configured
 */
async function loadSquareConfig(client) {
  try {
    const url = `${WORKER_API_BASE}/api/client-config/${encodeURIComponent(client)}/payment-processors/square`;
    console.log(`[Config] Loading Square config for client: ${client} from ${url}`);
    
    // Use AbortController for timeout (fetch doesn't support timeout option directly)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Payment-Server/1.0'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`[Config] Square config not found for client: ${client}`);
        return null;
      }
      console.error(`[Config] Failed to load Square config: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    // The API returns normalized config with credentials object
    // Extract accessToken (apiKey) and mode
    const credentials = data?.credentials || {};
    const accessToken = credentials.apiKey || credentials.accessToken || credentials.secretKey;
    const mode = data?.mode || credentials.mode || (data?.baseUrl?.includes('sandbox') ? 'test' : 'live');
    
    if (!accessToken) {
      console.warn(`[Config] Square accessToken missing for client: ${client}`);
      return null;
    }

    console.log(`[Config] ✓ Loaded Square config for client: ${client} (mode: ${mode})`);
    return {
      accessToken,
      mode: mode || 'live'
    };
  } catch (error) {
    console.error(`[Config] Error loading Square config for client ${client}:`, error.message);
    return null;
  }
}

/**
 * Load WiPay configuration for a client
 * @param {string} client - Client identifier (e.g., 'kamar-tours')
 * @returns {Promise<Object|null>} WiPay config, or null if not configured
 */
async function loadWiPayConfig(client) {
  try {
    const url = `${WORKER_API_BASE}/api/client-config/${encodeURIComponent(client)}/payment-processors/wipay`;
    console.log(`[Config] Loading WiPay config for client: ${client} from ${url}`);
    
    // Use AbortController for timeout (fetch doesn't support timeout option directly)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Payment-Server/1.0'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`[Config] WiPay config not found for client: ${client}`);
        return null;
      }
      console.error(`[Config] Failed to load WiPay config: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    // The API returns normalized config with credentials object
    const credentials = data?.credentials || {};
    const merchantKey = credentials.publicKey || credentials.merchantKey;
    const secretKey = credentials.apiKey || credentials.secretKey;
    const accountId = credentials.merchantId || credentials.accountId;
    const mode = data?.mode || credentials.mode || 'live';
    
    if (!secretKey) {
      console.warn(`[Config] WiPay secretKey missing for client: ${client}`);
      return null;
    }

    console.log(`[Config] ✓ Loaded WiPay config for client: ${client} (mode: ${mode})`);
    return {
      merchantKey,
      secretKey,
      accountId,
      mode: mode || 'live'
    };
  } catch (error) {
    console.error(`[Config] Error loading WiPay config for client ${client}:`, error.message);
    return null;
  }
}

/**
 * Load Stripe configuration for a client
 * @param {string} client - Client identifier (e.g., 'kamar-tours')
 * @returns {Promise<Object|null>} Stripe config with secretKey and allowedOrigins
 */
async function loadStripeConfig(client) {
  try {
    const url = `${WORKER_API_BASE}/api/client-config/${encodeURIComponent(client)}/payment-processors/stripe`;
    console.log(`[Config] Loading Stripe config for client: ${client} from ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Payment-Server/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`[Config] Stripe config not found for client: ${client}`);
        return null;
      }
      console.error(`[Config] Failed to load Stripe config: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const credentials = data?.credentials || {};
    const urls = data?.urls || {};

    const secretKey = credentials.apiKey || credentials.secretKey;
    if (!secretKey) {
      console.warn(`[Config] Stripe secretKey missing for client: ${client}`);
      return null;
    }

    // Prefer explicit allowedOrigins from client config; fallback to deriving from returnUrl
    let allowedOrigins = Array.isArray(data.allowedOrigins) ? data.allowedOrigins.filter(Boolean) : [];
    if (allowedOrigins.length === 0 && urls.returnUrl) {
      try {
        const u = new URL(urls.returnUrl);
        allowedOrigins.push(u.origin);
      } catch (e) {
        console.warn('[Config] Failed to parse Stripe returnUrl for client', client, e.message);
      }
    }

    console.log(`[Config] ✓ Loaded Stripe config for client: ${client}`);
    return {
      secretKey,
      allowedOrigins
    };
  } catch (error) {
    console.error(`[Config] Error loading Stripe config for client ${client}:`, error.message);
    return null;
  }
}

module.exports = {
  loadSquareConfig,
  loadWiPayConfig,
  loadStripeConfig
};
