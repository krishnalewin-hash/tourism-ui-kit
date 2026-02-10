/**
 * Payment Routes
 * Handles payment creation and processing
 * 
 * SECURITY FIXES:
 * - Server recalculates price from quoteId (prevents tampering)
 * - CORS enforcement (403 if origin not allowed) - ENFORCED AT START OF EACH ROUTE
 * - Cached origin lookups (prevents DDOS)
 * - Stable idempotency keys (paymentAttemptId)
 * - NO totalCost accepted from browser - only quoteId
 * 
 * QUOTE STORAGE:
 * - Quotes are stored in paymentAttempts Map (in-memory)
 * - TODO: Replace with database/Redis for persistence
 */

const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const { v4: uuidv4 } = require('uuid');
const { isOriginAllowed, getAllAllowedOrigins } = require('../middleware/cors');
const { recalculatePrice } = require('../services/pricingService');
const { loadSquareConfig, loadWiPayConfig, loadStripeConfig } = require('../services/configService');

// NOTE: Trust proxy should be set in main app.js/server.js:
// app.set('trust proxy', 1);
// This ensures req.ip is correct when behind Nginx, Cloudflare, or load balancers

// In-memory store for payment attempts (includes quote data)
// TODO: Replace with Redis or database for persistence
const paymentAttempts = new Map();
const PAYMENT_ATTEMPT_TTL = 30 * 60 * 1000; // 30 minutes

// In-memory store for quotes (for lookup by quoteId)
// TODO: Replace with database table for persistence
const quotes = new Map();
const QUOTE_TTL = 60 * 60 * 1000; // 60 minutes

// Cleanup old entries periodically
// Use .unref() to prevent intervals from keeping process alive
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  
  // Cleanup payment attempts older than TTL
  // Use numeric timestamp for faster comparison
  for (const [key, attempt] of paymentAttempts.entries()) {
    if (attempt.timestamp && now - attempt.timestamp > PAYMENT_ATTEMPT_TTL) {
      paymentAttempts.delete(key);
    }
  }
  
  // Cleanup quotes older than TTL
  // Use numeric timestamp for faster comparison
  for (const [key, quote] of quotes.entries()) {
    if (quote.timestamp && now - quote.timestamp > QUOTE_TTL) {
      quotes.delete(key);
    }
  }
}, 5 * 60 * 1000); // Run cleanup every 5 minutes
cleanupInterval.unref(); // Don't keep process alive

// Rate limiting (simple in-memory, use Redis in production)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 15; // Increased slightly to account for OPTIONS + retries

function checkRateLimit(ip, isOptions = false) {
  // Don't count OPTIONS requests - browsers send multiple automatically
  if (isOptions) {
    return true;
  }
  
  const now = Date.now();
  const key = `rate_limit_${ip}`;
  const record = rateLimitMap.get(key);
  
  if (!record || now - record.firstRequest > RATE_LIMIT_WINDOW) {
    // Clean up old entries when window rolls over
    if (record && now - record.firstRequest > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(key);
    }
    rateLimitMap.set(key, { firstRequest: now, count: 1, lastAccess: now });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  record.count++;
  record.lastAccess = now;
  return true;
}

// Cleanup old rate limit entries periodically
// Use .unref() to prevent intervals from keeping process alive
const rateLimitCleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now - record.lastAccess > RATE_LIMIT_WINDOW * 2) {
      rateLimitMap.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW); // Run cleanup every window period
rateLimitCleanupInterval.unref(); // Don't keep process alive

/**
 * CORS enforcement middleware - MUST be called before processing any request
 * SECURITY: Returns 403 if origin not allowed - this prevents unauthorized access
 * Also sets CORS headers for allowed origins
 */
async function enforceCORS(req, res, client) {
  const origin = req.headers.origin;
  
  // SECURITY: Require Origin header
  if (!origin) {
    return res.status(403).json({ error: 'Origin header required' });
  }
  
  // SECURITY: Check if origin is allowed for this client
  const corsAllowed = await isOriginAllowed(origin, client);
  if (!corsAllowed) {
    console.warn(`[CORS] Rejected origin ${origin} for client ${client}`);
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  
  // Set CORS headers for allowed origin
  // Tightened: Only methods and headers actually used
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Vary', 'Origin'); // Required when setting Access-Control-Allow-Origin
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Only methods actually used
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Client-Name'); // Only required headers
  
  return null; // CORS check passed
}

/**
 * Handle OPTIONS preflight requests
 * Sets CORS headers for preflight checks
 * 
 * NOTE: This handler checks global allow list if client not present.
 * This may allow preflight even if client-specific CORS will later fail.
 * Preferred: Always send X-Client-Name header from frontend, or move client to URL path.
 * 
 * SECURITY: Does not require client - checks global allow list if client not present
 */
router.options('*', async (req, res) => {
  // OPTIONS requests are not rate limited (browsers send multiple automatically)
  
  const origin = req.headers.origin;
  
  if (!origin) {
    return res.status(403).json({ error: 'Origin header required' });
  }
  
  // Try to get client from header or query (may not be present in preflight)
  // BEST PRACTICE: Frontend should always send X-Client-Name header on preflighted requests
  // ALTERNATIVE: Move client to URL path (e.g., /api/payment/:client/create)
  const client = req.headers['x-client-name'] || req.query.client;
  
  let corsAllowed = false;
  
  if (client) {
    // Check specific client origin
    corsAllowed = await isOriginAllowed(origin, client);
  }
  
  // If client not present or not allowed for client, check global allow list
  // NOTE: This may allow preflight even if actual request will fail client-specific check
  // This is not a security issue (preflight doesn't execute the request), but can cause confusing browser behavior
  if (!corsAllowed) {
    const allOriginsData = await getAllAllowedOrigins();
    // Handle return shape: may be { origins: {...} } or flat object
    const allOrigins = allOriginsData?.origins || allOriginsData;
    if (allOrigins && typeof allOrigins === 'object') {
      corsAllowed = Object.values(allOrigins).includes(origin);
    }
  }
  
  if (corsAllowed) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin'); // Required when setting Access-Control-Allow-Origin
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Only methods actually used
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Client-Name'); // Only required headers
    res.header('Access-Control-Max-Age', '86400');
    return res.status(204).send();
  }
  
  // Origin not allowed
  return res.status(403).json({ error: 'Origin not allowed' });
});

/**
 * POST /api/payment/create
 * Creates a payment attempt and returns paymentAttemptId
 * SECURITY: Server recalculates price from quoteId to prevent tampering
 * SECURITY: CORS enforced - rejects unauthorized origins
 * SECURITY: NO totalCost accepted from browser - only quoteId
 */
router.post('/create', async (req, res) => {
  // Rate limiting (OPTIONS requests are not rate limited)
  const clientIp = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(clientIp, false)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // Extract client first (needed for CORS check)
  const { client, totalCost } = req.body; // Extract totalCost to explicitly reject it
  
  // SECURITY: Explicitly reject totalCost if sent (prevents tampering)
  if (totalCost !== undefined) {
    console.warn(`[Security] Rejected request with totalCost from browser. Client: ${client}`);
    return res.status(400).json({ 
      error: 'totalCost cannot be sent from browser. Server recalculates price from quoteId.' 
    });
  }

  if (!client) {
    return res.status(400).json({ error: 'Client identifier is required' });
  }

  // SECURITY: Enforce CORS - returns 403 if not allowed
  const corsError = await enforceCORS(req, res, client);
  if (corsError) return corsError;

  try {
    const {
      quoteId,
      pickup,
      dropoff,
      pickup_place_id,
      dropoff_place_id,
      pickup_lat,
      pickup_lng,
      dropoff_lat,
      dropoff_lng,
      passengers,
      roundTrip,
      customerInfo,
      quoteData,
      paymentProcessor
    } = req.body;

    // SECURITY: Require quoteId - server will recalculate price from this
    if (!quoteId) {
      return res.status(400).json({ error: 'quoteId is required for price recalculation' });
    }

    // Store quote data for future reference (by quoteId)
    // SECURITY: Don't store raw customerInfo (PII) - only store what's needed for payment/receipts
    // TODO: Persist to database instead of in-memory Map
    quotes.set(quoteId, {
      client,
      quoteId,
      pickup,
      dropoff,
      pickup_place_id,
      dropoff_place_id,
      pickup_lat,
      pickup_lng,
      dropoff_lat,
      dropoff_lng,
      passengers,
      roundTrip,
      // customerInfo removed - only store email/phone if needed for receipts
      customerEmail: customerInfo?.email || null, // Only if needed for receipts
      customerPhone: customerInfo?.phone || null, // Only if needed for receipts
      quoteData,
      createdAt: new Date().toISOString(),
      timestamp: Date.now() // For TTL cleanup
    });

    // SECURITY: Recalculate price from trusted data (prevents tampering)
    // Server recalculates from pricing bands, distance, passengers, etc.
    const recalculatedPrice = await recalculatePrice({
      client,
      quoteId,
      pickup,
      dropoff,
      pickup_place_id,
      dropoff_place_id,
      pickup_lat,
      pickup_lng,
      dropoff_lat,
      dropoff_lng,
      passengers: passengers || 1,
      roundTrip: roundTrip || false
    });

    if (!recalculatedPrice || recalculatedPrice.amountCents <= 0) {
      return res.status(400).json({ error: 'Invalid quote or pricing not available' });
    }

    // Generate stable paymentAttemptId for idempotency
    const paymentAttemptId = `pay-${Date.now()}-${uuidv4()}`;
    
    // Store payment attempt data with server-calculated price
    // Include timestamp for TTL cleanup
    paymentAttempts.set(paymentAttemptId, {
      client,
      quoteId, // Reference to stored quote
      pickup,
      dropoff,
      pickup_place_id,
      dropoff_place_id,
      pickup_lat,
      pickup_lng,
      dropoff_lat,
      dropoff_lng,
      passengers,
      roundTrip,
      // customerInfo removed - only store email/phone if needed for receipts
      customerEmail: customerInfo?.email || null, // Only if needed for receipts
      customerPhone: customerInfo?.phone || null, // Only if needed for receipts
      quoteData,
      paymentProcessor,
      amountCents: recalculatedPrice.amountCents, // Server-calculated, trusted - NEVER from browser
      createdAt: new Date().toISOString(),
      timestamp: Date.now() // For TTL cleanup - use this for faster comparison
    });

    // Return paymentAttemptId - browser will include this in payment token submission
    res.json({
      success: true,
      paymentAttemptId: paymentAttemptId,
      amountCents: recalculatedPrice.amountCents, // Return for display/confirmation
      message: 'Payment attempt created. Submit payment token with paymentAttemptId.'
    });

  } catch (error) {
    console.error('[Payment] Error creating payment attempt:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/payment/quote/:quoteId
 * Retrieve stored quote by quoteId
 * SECURITY: Protected with CORS, sanitizes customerInfo
 * TODO: Load from database instead of in-memory Map
 */
router.get('/quote/:quoteId', async (req, res) => {
  // Rate limiting (OPTIONS requests are not rate limited)
  const clientIp = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(clientIp, false)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const { quoteId } = req.params;
  
  const quote = quotes.get(quoteId);
  if (!quote) {
    return res.status(404).json({ error: 'Quote not found' });
  }
  
  // SECURITY: Enforce CORS - protect quote access
  const corsError = await enforceCORS(req, res, quote.client);
  if (corsError) return corsError;
  
  // SECURITY: Sanitize response - remove sensitive customerInfo
  // Return sanitized version without personal information
  const sanitizedQuote = {
    quoteId: quote.quoteId,
    client: quote.client,
    pickup: quote.pickup,
    dropoff: quote.dropoff,
    pickup_place_id: quote.pickup_place_id,
    dropoff_place_id: quote.dropoff_place_id,
    pickup_lat: quote.pickup_lat,
    pickup_lng: quote.pickup_lng,
    dropoff_lat: quote.dropoff_lat,
    dropoff_lng: quote.dropoff_lng,
    passengers: quote.passengers,
    roundTrip: quote.roundTrip,
    quoteData: quote.quoteData,
    createdAt: quote.createdAt
    // customerInfo removed for security
  };
  
  res.json({ success: true, quote: sanitizedQuote });
});

/**
 * POST /api/payment/square/create
 * Processes Square payment with token
 * SECURITY: Uses paymentAttemptId as stable idempotency key
 * SECURITY: Uses server-calculated price (prevents tampering)
 * SECURITY: CORS enforced - rejects unauthorized origins
 */
router.post('/square/create', async (req, res) => {
  // Rate limiting (OPTIONS requests are not rate limited)
  const clientIp = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(clientIp, false)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const { client, paymentAttemptId, sourceId, paymentToken, totalCost } = req.body;

  // SECURITY: Explicitly reject totalCost if sent (prevents tampering)
  if (totalCost !== undefined) {
    console.warn(`[Security] Rejected Square payment with totalCost from browser. Client: ${client}`);
    return res.status(400).json({ 
      error: 'totalCost cannot be sent from browser. Server uses stored amountCents from payment attempt.' 
    });
  }

  if (!client) {
    return res.status(400).json({ error: 'Client identifier is required' });
  }

  // SECURITY: Enforce CORS - returns 403 if not allowed
  const corsError = await enforceCORS(req, res, client);
  if (corsError) return corsError;

  if (!paymentAttemptId) {
    return res.status(400).json({ 
      error: 'paymentAttemptId is required for idempotency' 
    });
  }

  // Normalize token field - use sourceId (Square's field name)
  const token = sourceId || paymentToken;
  if (!token) {
    return res.status(400).json({ 
      error: 'Square payment token (sourceId) is required' 
    });
  }

  // Retrieve payment attempt data
  const attemptData = paymentAttempts.get(paymentAttemptId);
  if (!attemptData) {
    return res.status(404).json({ 
      error: 'Payment attempt not found. Create payment attempt first.' 
    });
  }

  // SECURITY: Verify payment attempt belongs to this client (prevents cross-client attacks)
  if (attemptData.client !== client) {
    console.warn(`[Security] Payment attempt ${paymentAttemptId} does not belong to client ${client}`);
    return res.status(403).json({ 
      error: 'Payment attempt does not belong to this client' 
    });
  }

  // SECURITY: Use server-calculated price from payment attempt (prevents tampering)
  const amountCents = attemptData.amountCents;
  if (!amountCents || amountCents <= 0) {
    return res.status(400).json({ error: 'Invalid payment amount' });
  }

  // Load Square credentials from database/config
  const squareConfig = await loadSquareConfig(client);
  if (!squareConfig || !squareConfig.accessToken) {
    console.error(`[Square] Configuration missing for client: ${client}`);
    return res.status(500).json({ 
      error: 'Square payment is not configured for this client. Please contact support.' 
    });
  }

  const { accessToken, mode } = squareConfig;

  // Process payment using Square service
  const paymentResult = await paymentService.processPayment({
    paymentProcessor: 'square',
    processorParams: {
      sourceId: token, // Normalized field name
      paymentAttemptId: paymentAttemptId, // Stable idempotency key
      amountCents: amountCents, // Server-calculated, trusted value - NEVER from browser
      accessToken, // Only access token needed for server-side API calls
      mode: mode || 'live',
      customerInfo: {
        email: attemptData.customerEmail || null,
        phone: attemptData.customerPhone || null
      },
      quoteData: attemptData.quoteData
    }
  });

  // Determine success URL
  const origin = req.headers.origin;
  const successUrl = origin ? `${origin}/payment-success` : null;

  // Clean up payment attempt (optional - you may want to keep for audit)
  paymentAttempts.delete(paymentAttemptId);

  res.json({
    success: true,
    paymentId: paymentResult.paymentId,
    status: paymentResult.status,
    receiptUrl: paymentResult.receiptUrl,
    redirectUrl: successUrl,
    successUrl: successUrl
  });

});

/**
 * POST /api/payment/stripe/create
 * Creates a Stripe Checkout Session and returns a redirect URL
 * SECURITY: Uses paymentAttemptId as stable idempotency key
 * SECURITY: Uses server-calculated price (prevents tampering)
 * SECURITY: CORS enforced - rejects unauthorized origins
 */
router.post('/stripe/create', async (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(clientIp, false)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const { client, paymentAttemptId, successUrl, cancelUrl, totalCost } = req.body;

  if (totalCost !== undefined) {
    console.warn(`[Security] Rejected Stripe payment with totalCost from browser. Client: ${client}`);
    return res.status(400).json({
      error: 'totalCost cannot be sent from browser. Server uses stored amountCents from payment attempt.'
    });
  }

  if (!client) {
    return res.status(400).json({ error: 'Client identifier is required' });
  }

  const corsError = await enforceCORS(req, res, client);
  if (corsError) return corsError;

  if (!paymentAttemptId) {
    return res.status(400).json({
      error: 'paymentAttemptId is required for idempotency'
    });
  }

  const attemptData = paymentAttempts.get(paymentAttemptId);
  if (!attemptData) {
    return res.status(404).json({
      error: 'Payment attempt not found. Create payment attempt first.'
    });
  }

  if (attemptData.client !== client) {
    console.warn(`[Security] Payment attempt ${paymentAttemptId} does not belong to client ${client}`);
    return res.status(403).json({
      error: 'Payment attempt does not belong to this client'
    });
  }

  const amountCents = attemptData.amountCents;
  if (!amountCents || amountCents <= 0) {
    return res.status(400).json({ error: 'Invalid payment amount' });
  }

  // Load Stripe credentials for this client
  const stripeConfig = await loadStripeConfig(client);
  if (!stripeConfig || !stripeConfig.secretKey) {
    console.error(`[Stripe] Configuration missing for client: ${client}`);
    return res.status(500).json({
      error: 'Stripe payment is not configured for this client. Please contact support.'
    });
  }

  const { secretKey, allowedOrigins = [] } = stripeConfig;

  const rawSuccessUrl = successUrl;
  const rawCancelUrl = cancelUrl;

  const isAllowedUrl = (url) => {
    if (!url) return false;
    try {
      const u = new URL(url);
      return allowedOrigins.length === 0 || allowedOrigins.includes(u.origin);
    } catch (e) {
      return false;
    }
  };

  if (rawSuccessUrl && !isAllowedUrl(rawSuccessUrl)) {
    return res.status(400).json({ error: 'Invalid successUrl for this client' });
  }
  if (rawCancelUrl && !isAllowedUrl(rawCancelUrl)) {
    return res.status(400).json({ error: 'Invalid cancelUrl for this client' });
  }

  const defaultOrigin = allowedOrigins[0] || req.headers.origin || '';
  const finalSuccessUrl = rawSuccessUrl || (defaultOrigin ? `${defaultOrigin}/payment-success` : null);
  const finalCancelUrl = rawCancelUrl || (defaultOrigin ? `${defaultOrigin}/payment-cancelled` : null);

  const session = await paymentService.createPaymentSession({
    paymentProcessor: 'stripe',
    amountCents,
    successUrl: finalSuccessUrl,
    cancelUrl: finalCancelUrl,
    customerInfo: {
      email: attemptData.customerEmail || null,
      phone: attemptData.customerPhone || null
    },
    quoteData: {
      ...(attemptData.quoteData || {}),
      client: attemptData.client,
      paymentAttemptId
    },
    paymentAttemptId,
    secretKey
  });

  // Optional: keep attempt until webhook confirms; for now we leave it in memory.

  res.json({
    success: true,
    redirectUrl: session.url || session.redirectUrl,
    sessionId: session.id
  });
});

/**
 * POST /api/payment/wipay/create (WiPay flow - redirects to WiPay)
 * SECURITY: Uses server-calculated price (prevents tampering)
 * SECURITY: CORS enforced - rejects unauthorized origins
 */
router.post('/wipay/create', async (req, res) => {
  // Rate limiting (OPTIONS requests are not rate limited)
  const clientIp = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(clientIp, false)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const { client, paymentAttemptId, fee_structure, totalCost } = req.body;

  // SECURITY: Explicitly reject totalCost if sent (prevents tampering)
  if (totalCost !== undefined) {
    console.warn(`[Security] Rejected WiPay payment with totalCost from browser. Client: ${client}`);
    return res.status(400).json({ 
      error: 'totalCost cannot be sent from browser. Server uses stored amountCents from payment attempt.' 
    });
  }

  if (!client) {
    return res.status(400).json({ error: 'Client identifier is required' });
  }

  // SECURITY: Enforce CORS - returns 403 if not allowed
  const corsError = await enforceCORS(req, res, client);
  if (corsError) return corsError;

  if (!paymentAttemptId) {
    return res.status(400).json({ error: 'paymentAttemptId is required' });
  }

  // Retrieve payment attempt data
  const attemptData = paymentAttempts.get(paymentAttemptId);
  if (!attemptData) {
    return res.status(404).json({ error: 'Payment attempt not found' });
  }

  // SECURITY: Verify payment attempt belongs to this client (prevents cross-client attacks)
  if (attemptData.client !== client) {
    console.warn(`[Security] Payment attempt ${paymentAttemptId} does not belong to client ${client}`);
    return res.status(403).json({ 
      error: 'Payment attempt does not belong to this client' 
    });
  }

  // SECURITY: Use server-calculated price (prevents tampering)
  const amountCents = attemptData.amountCents;

  // Load WiPay credentials
  const wipayConfig = await loadWiPayConfig(client);
  if (!wipayConfig) {
    return res.status(400).json({ error: 'WiPay is not configured for this client' });
  }

  // Create WiPay payment session
  const wipayResult = await paymentService.processPayment({
    paymentProcessor: 'wipay',
    processorParams: {
      amountCents: amountCents, // Server-calculated, trusted
      fee_structure: fee_structure || 'merchant_absorb',
      customerInfo: {
        email: attemptData.customerEmail || null,
        phone: attemptData.customerPhone || null
      },
      quoteData: attemptData.quoteData,
      ...wipayConfig
    }
  });

  res.json({
    success: true,
    redirectUrl: wipayResult.redirectUrl,
    paymentUrl: wipayResult.redirectUrl
  });
});

/**
 * GET /api/payment/status/:sessionId
 * Get payment status
 * SECURITY: Protected with CORS to prevent cross-origin leakage
 */
router.get('/status/:sessionId', async (req, res) => {
  // Rate limiting (OPTIONS requests are not rate limited)
  const clientIp = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(clientIp, false)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const { sessionId } = req.params;
  
  // SECURITY: When implementing, lookup sessionId in DB to get client, then enforce CORS
  // Current implementation uses global allow list - NOT SECURE ENOUGH for production
  // TODO: Implement proper security:
  // 1. Lookup sessionId in database to get client
  // 2. Enforce CORS using that client: await enforceCORS(req, res, payment.client)
  // 3. Verify request client matches payment client: if (req.client !== payment.client) return 403
  
  const origin = req.headers.origin;
  if (origin) {
    const allOriginsData = await getAllAllowedOrigins();
    // Handle return shape: may be { origins: {...} } or flat object
    const allOrigins = allOriginsData?.origins || allOriginsData;
    if (allOrigins && typeof allOrigins === 'object') {
      const corsAllowed = Object.values(allOrigins).includes(origin);
      if (corsAllowed) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Vary', 'Origin');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, X-Client-Name');
      } else {
        return res.status(403).json({ error: 'Origin not allowed' });
      }
    }
  }
  
  // TODO: Implement database lookup with proper security
  // const payment = await db.query('SELECT client FROM payments WHERE session_id = ?', [sessionId]);
  // if (!payment) {
  //   return res.status(404).json({ error: 'Payment status not found' });
  // }
  // 
  // // SECURITY: Enforce CORS using payment's client
  // const corsError = await enforceCORS(req, res, payment.client);
  // if (corsError) return corsError;
  // 
  // // SECURITY: Verify request client matches payment client
  // const requestClient = req.headers['x-client-name'] || req.query.client;
  // if (requestClient && requestClient !== payment.client) {
  //   return res.status(403).json({ error: 'Payment does not belong to this client' });
  // }
  
  // For now, return not found
  res.status(404).json({ error: 'Payment status not found' });
});

module.exports = router;
