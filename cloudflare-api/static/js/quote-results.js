/*!
 * Quote Calc Enhanced (Distance → Price) — results page widget with client-specific pricing
 * - Always shows total price (defaults to 1 passenger if none specified)
 * - Reads lead params (URL first, then sessionStorage fallback)
 * - Loads Google Maps JS (if not already present)
 * - Uses Distance Matrix API for reliable distance calculation
 * - Shows interactive route map when Directions API is available (fallback gracefully)
 * - Calculates price from client-specific distance bands + remote surcharge + minimum
 * - Supports client-specific pricing configuration from /clients/{client}.json
 *
 * Mount:   <div id="quote-calc"></div>
 * Depends: window.CFG.GMAPS_KEY (or a <script> with Maps already loaded)
 */

const MOUNT_ID = "quote-calc";

function capturePageDefaults() {
  try {
    const selectors = 'script[data-default-pickup], script[data-default-dropoff], script[data-default-pickup-place-id], script[data-default-dropoff-place-id]';
    const scripts = document.querySelectorAll(selectors);
    const current = document.currentScript || (scripts.length ? scripts[scripts.length - 1] : null);
    if (!current || !current.dataset) return;

    window.CFG = window.CFG || {};
    window.CFG.PAGE_DEFAULTS = window.CFG.PAGE_DEFAULTS || {};

    const store = window.CFG.PAGE_DEFAULTS;
    const ds = current.dataset;

    if (ds.defaultPickup && !store.defaultPickup) {
      store.defaultPickup = ds.defaultPickup;
    }
    if (ds.defaultDropoff && !store.defaultDropoff) {
      store.defaultDropoff = ds.defaultDropoff;
    }
    if (ds.defaultPickupPlaceId && !store.defaultPickupPlaceId) {
      store.defaultPickupPlaceId = ds.defaultPickupPlaceId;
    }
    if (ds.defaultDropoffPlaceId && !store.defaultDropoffPlaceId) {
      store.defaultDropoffPlaceId = ds.defaultDropoffPlaceId;
    }
  } catch (err) {
    console.warn('[quote-calc] Failed to capture page defaults', err);
  }
}

capturePageDefaults();

// Inline CSS styles for the component
const QUOTE_RESULTS_CSS = `:root{--card-bg:#fff;--card-border:#ececec;--muted:#6b7280;--accent:#D65130;--accent-600:#b54224;--shadow:0 8px 24px rgba(0,0,0,.06);--radius:12px;--font:"Poppins",system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}html,body{margin:0;padding:0}body{font-family:var(--font);color:#111827;background:#fff}.btn{display:inline-flex;align-items:center;justify-content:center;padding:12px 16px;border-radius:5px;font-weight:700;text-decoration:none}.btn-primary{background:var(--accent);color:#fff}.btn-primary:hover,.btn-primary:focus{background:var(--accent-600)}.btn:focus{outline:2px solid #000;outline-offset:2px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}#quote-calc{box-sizing:border-box;max-width:1100px;margin:24px auto;padding:24px;border:1px solid #ececec;border-radius:12px;background:#fff;box-shadow:0 8px 24px rgba(0,0,0,.06);font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}.qc-row{display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:stretch}.qc-row > div{display:flex;flex-direction:column}.qc-row > div:has(.qc-map){min-height:100%}@media (max-width:900px){.qc-row{grid-template-columns:1fr;gap:24px}#quote-calc{padding:16px}}.qc-map{width:100%;min-height:400px;height:100%;border-radius:12px;background:#f3f4f6;overflow:hidden;border:1px solid #e5e7eb}.qc-details{display:flex;flex-direction:column;gap:0px}.qc-detail-item{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f3f4f6}.qc-detail-item:last-of-type{border-bottom:none}.qc-detail-label{font-weight:800;color:#374151;font-size:18px}.qc-detail-value{font-weight:400;color:#111827;font-size:18px}.qc-detail-value.highlight{font-size:18px;font-weight:800;color:#059669}.qc-buttons{display:flex;gap:12px;margin-top:24px;flex-wrap:wrap}.qc-btn{flex:1;min-width:140px;padding:14px 20px;border-radius:8px;font-weight:600;font-size:18px;text-align:center;text-decoration:none;cursor:pointer;border:none;transition:all 0.2s ease}.qc-btn-primary{background:#059669;color:white;border:2px solid #059669}.qc-btn-primary:hover{background:#047857;border-color:#047857}.qc-btn-secondary{background:white;color:#374151;border:2px solid #d1d5db}.qc-btn-secondary:hover{background:#f9fafb;border-color:#9ca3af}.qc-btn-disabled{background:#9ca3af;color:#fff;border:2px solid #9ca3af;cursor:not-allowed;opacity:0.6}.qc-btn-disabled:hover{background:#9ca3af;border-color:#9ca3af}.qc-kingston-message{padding:16px;border:1px solid #fbbf24;background:#fffbeb;color:#92400e;border-radius:8px;font-size:16px;line-height:1.5;margin-bottom:12px}.qc-error{padding:16px;border:1px solid #f3d2d2;background:#fff6f6;color:#9b1c1c;border-radius:10px;text-align:center}.qc-shimmer{position:relative;border-radius:10px;background:#eef0f3;overflow:hidden}.qc-shimmer:after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,rgba(255,255,255,0) 0,rgba(255,255,255,.6) 50%,rgba(255,255,255,0) 100%);animation:qc-shimmer 1.4s infinite}@keyframes qc-shimmer{100%{transform:translateX(100%)}}`;

const DEFAULT_API_BASE = 'https://tourism-api-production.krishna-0a3.workers.dev';
const BLOCKED_SCRIPT_ORIGINS = new Set([
  'https://static.cloudflareinsights.com',
  'https://static.cloudflareanalytics.com',
  'https://static.cloudflareinsights.net'
]);
const BLOCKED_PAGE_ORIGINS = new Set([
  // Removed expired domain: 'https://tourismbizacademy.com'
]);

function cleanOrigin(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  let candidate = value.trim();
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(candidate)) {
    candidate = `https://${candidate.replace(/^\/*/, '')}`;
  }
  try {
    const url = new URL(candidate);
    return url.origin.replace(/\/$/, '');
  } catch (_) {
    return null;
  }
}

// Function to inject CSS styles into the document
function injectStyles() {
  // Check if styles are already injected
  if (document.getElementById('quote-results-styles')) {
    return;
  }
  
  const styleElement = document.createElement('style');
  styleElement.id = 'quote-results-styles';
  styleElement.textContent = QUOTE_RESULTS_CSS;
  document.head.appendChild(styleElement);
}

  /* ===== 0) DEFAULT CONFIG (fallback if no client config) =========== */
const DEFAULT_CONFIG = {
  // GMAPS key: use window.CFG.GMAPS_KEY if present; client must provide their own key
  googleApiKey: (window.CFG && (window.CFG.GMAPS_KEY || window.CFG.PLACES_API_KEY)) || "",

  // Payment URL for transfers
  transferPaymentUrl: "https://tourdriver.com/book",
  paymentApiUrl: null,
  paymentGateway: null, // 'square', 'wipay', 'tilopay', etc.
  paymentGatewayConfig: null,

  // Pricing bands (miles are inclusive of lower bound, exclusive of upper)
  bands: [
    { maxMi: 50,  pricePP: 30 },
    { maxMi: 60,  pricePP: 40 },
    { maxMi: 70,  pricePP: 50 },
    { maxMi: 999, pricePP: 80 }
  ],
  minPricePP: 30,
  minPassengers: 2,
  defaultPassengers: 1,
  remote: {
    keywords: [],
    surchargePP: 10
  },
  map: { zoom: 9 }
};

  // Global config that will be populated from client or defaults
  let CONFIG = { ...DEFAULT_CONFIG };

function resolveApiBase() {
  const cfg = window.CFG || {};
  const candidates = [
    cfg.API_BASE,
    cfg.apiBase,
    cfg.API_ORIGIN,
    cfg.apiOrigin,
    cfg.API_URL,
    cfg.apiUrl,
    cfg.BASE_URL,
    cfg.baseUrl,
    cfg.BASE,
    cfg.base,
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      const origin = cleanOrigin(value);
      if (origin) return origin;
    }
  }

  const urlLikeCandidates = [
    cfg.DATA_URL,
    cfg.dataUrl,
    cfg.CLOUDFLARE_API,
    cfg.cloudflareApi,
    cfg.API,
    cfg.api,
    cfg.API_ENDPOINT,
    cfg.apiEndpoint
  ];

  for (const value of urlLikeCandidates) {
    const origin = cleanOrigin(value);
    if (origin) return origin;
  }

  try {
    const currentScript = document.currentScript || Array.from(document.getElementsByTagName('script')).pop();
    if (currentScript?.src) {
      const url = new URL(currentScript.src, window.location.href);
      if (!BLOCKED_SCRIPT_ORIGINS.has(url.origin)) {
        return url.origin;
      }
    }
  } catch (err) {
    console.warn('[quote-calc] Failed to derive API base from script tag:', err);
  }

  if (!BLOCKED_PAGE_ORIGINS.has(window.location.origin)) {
    const origin = cleanOrigin(window.location.origin);
    if (origin) return origin;
  }

  return DEFAULT_API_BASE;
}

  // URL params to keep & forward
  const ALLOW = [
    "pickup_location","dropoff_location","pickup_date","pickup_time","passengers","number_of_passengers",
    "first_name","last_name","email","phone","round_trip","return_date","return_time"
  ];

  /* ===== 1) CLIENT CONFIG LOADER ===================================== */
  async function loadClientConfig() {
    try {
      // Determine client from various sources
      const client = window.CFG?.client || window.CFG?.CLIENT ||
        sessionStorage.getItem('client') ||
        'demo';

      const transfer = window.CFG?.transfer || window.CFG?.TRANSFER;
      const apiBase = resolveApiBase();
      
      // If transfer is specified, load transfer-specific config
      if (transfer) {
        console.log(`[quote-calc] Loading transfer config: ${client}/${transfer}`);
        try {
          const transferApiUrl = `${apiBase.replace(/\/$/, '')}/api/transfer-config/${encodeURIComponent(client)}/${encodeURIComponent(transfer)}`;
          console.log(`[quote-calc] Fetching transfer config: ${transferApiUrl}`);
          const transferResponse = await fetch(transferApiUrl, { cache: 'no-store' });
          if (transferResponse.ok) {
            const transferConfig = await transferResponse.json();
            if (transferConfig.QUOTE_RESULTS_CONFIG) {
              const deepMerge = (target, source) => {
                for (const key of Object.keys(source || {})) {
                  if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key] || typeof target[key] !== 'object') target[key] = {};
                    deepMerge(target[key], source[key]);
                  } else {
                    target[key] = source[key];
                  }
                }
                return target;
              };
              CONFIG = deepMerge(CONFIG, transferConfig.QUOTE_RESULTS_CONFIG);
              console.log('[quote-calc] Transfer-specific pricing bands loaded');
              // Do NOT return here; we still want to load client config below
              // so we can pick up shared settings like Google Maps API key,
              // payment URLs, contact config, etc.
            }
          } else {
            console.warn(`[quote-calc] Transfer config not found (${transferResponse.status}), falling back to client config`);
          }
        } catch (transferError) {
          console.warn('[quote-calc] Failed to load transfer config, falling back to client config:', transferError);
        }
      }

      const apiUrl = `${apiBase.replace(/\/$/, '')}/api/client-config/${encodeURIComponent(client)}`;
      console.log(`[quote-calc] Loading client config: ${client}`);
      console.log(`[quote-calc] API Base: ${apiBase}`);

      try {
        console.log(`[quote-calc] Fetching config via API: ${apiUrl}`);
        const apiResponse = await fetch(apiUrl, { cache: 'no-store' });
        if (apiResponse.ok) {
          const clientConfig = await apiResponse.json();

          const deepMerge = (target, source) => {
            for (const key of Object.keys(source || {})) {
              // When a transfer is active and we've already loaded transfer-specific
              // pricing bands into CONFIG, do NOT let the client-level QUOTE_RESULTS_CONFIG
              // overwrite them. Transfer bands should take precedence.
              if (transfer && key === 'bands' && Array.isArray(target.bands) && target.bands.length) {
                continue;
              }
              if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key] || typeof target[key] !== 'object') target[key] = {};
                deepMerge(target[key], source[key]);
              } else {
                target[key] = source[key];
              }
            }
            return target;
          };

          if (clientConfig.QUOTE_RESULTS_CONFIG) {
            CONFIG = deepMerge(CONFIG, clientConfig.QUOTE_RESULTS_CONFIG);
          }

          if (clientConfig.TRANSFER_PAYMENT_URL) {
            CONFIG.transferPaymentUrl = clientConfig.TRANSFER_PAYMENT_URL;
          }
          if (clientConfig.PAYMENT_API_URL) {
            CONFIG.paymentApiUrl = clientConfig.PAYMENT_API_URL;
          }
          if (clientConfig.PAYMENT_GATEWAY) {
            CONFIG.paymentGateway = clientConfig.PAYMENT_GATEWAY.toLowerCase();
          }
          if (clientConfig.PAYMENT_GATEWAY_CONFIG) {
            CONFIG.paymentGatewayConfig = clientConfig.PAYMENT_GATEWAY_CONFIG;
          }
          if (clientConfig.CONTACT_CONFIG) {
            CONFIG.contactConfig = clientConfig.CONTACT_CONFIG;
            console.log('[quote-calc] Loaded CONTACT_CONFIG from API:', CONFIG.contactConfig);
            console.log('[quote-calc] CONTACT_CONFIG type:', CONFIG.contactConfig.type);
          } else {
            console.warn('[quote-calc] No CONTACT_CONFIG found in API response');
          }

          const gmapsKey = clientConfig.FORM_CONFIG?.GMAPS_KEY || clientConfig.FORM_CONFIG?.PLACES_API_KEY;
          if (gmapsKey) {
            CONFIG.googleApiKey = gmapsKey;
          }

          window.CFG = {
            ...(window.CFG || {}),
            API_BASE: apiBase,
            client,
            GMAPS_KEY: gmapsKey || window.CFG?.GMAPS_KEY,
            PLACES_API_KEY: gmapsKey || window.CFG?.PLACES_API_KEY,
            configLoaded: true,
            loadedFrom: 'api',
            core_config: clientConfig,
          };

          console.log('[quote-calc] Client config loaded via API');
          if (CONFIG.routeSurcharges && CONFIG.routeSurcharges.length > 0) {
            console.log('[quote-calc] Route surcharges loaded:', CONFIG.routeSurcharges.length, CONFIG.routeSurcharges);
          } else {
            console.log('[quote-calc] No route surcharges in config (CONFIG.routeSurcharges:', CONFIG.routeSurcharges, ')');
          }
          return CONFIG;
        }

        console.warn(`[quote-calc] API config request returned ${apiResponse.status}`);
      } catch (apiError) {
        console.warn('[quote-calc] API config fetch failed:', apiError);
      }

      const base = window.CFG?.BASE || window.CFG?.base || apiBase;
      console.log(`[quote-calc] Falling back to legacy config loader. Base: ${base}`);

      // Helper: build URL from base and path
      const buildUrl = (path) => {
        if (base.startsWith('../') || base.startsWith('./') || base.startsWith('/')) {
          return `${base.replace(/\/$/, '')}${path}`;
        } else if (base.startsWith('http://') || base.startsWith('https://')) {
          return `${base.replace(/\/$/, '')}${path}`;
        } else if (base.includes('.')) {
          return `https://${base.replace(/\/$/, '')}${path}`;
        }
        return `${apiBase.replace(/\/$/, '')}${path}`;
      };

      // Deep merge utility (simple)
      const deepMerge = (target, source) => {
        for (const key of Object.keys(source || {})) {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key] || typeof target[key] !== 'object') target[key] = {};
            deepMerge(target[key], source[key]);
          } else {
            target[key] = source[key];
          }
        }
        return target;
      };

      // 1) Load defaults first
      try {
        const defaultsUrl = buildUrl(`/static/clients/_defaults/core/config.json`);
        console.log(`[quote-calc] Fetching defaults config: ${defaultsUrl}`);
        const dr = await fetch(defaultsUrl, { cache: 'no-store' });
        if (dr.ok) {
          const defaultsConfig = await dr.json();
          if (defaultsConfig.QUOTE_RESULTS_CONFIG) {
            CONFIG = deepMerge(CONFIG, defaultsConfig.QUOTE_RESULTS_CONFIG);
            console.log('[quote-calc] Defaults merged');
          }
        } else {
          console.warn(`[quote-calc] Defaults config not found (${dr.status})`);
        }
      } catch (e) {
        console.warn('[quote-calc] Failed to load defaults config:', e);
      }

      // 2) Load client config and merge over defaults
      try {
        let configUrl = buildUrl(`/static/clients/${client}/core/config.json`);

        console.log(`[quote-calc] Fetching core config: ${configUrl}`);
        
        const response = await fetch(configUrl, { cache: 'no-store' });
        if (response.ok) {
          const clientConfig = await response.json();
          
          // Update CONFIG with client-specific settings from core config
          if (clientConfig.QUOTE_RESULTS_CONFIG) {
            CONFIG = deepMerge(CONFIG, clientConfig.QUOTE_RESULTS_CONFIG);
          } else if (clientConfig.PRICING_RATES) {
            convertPricingRatesToConfig(clientConfig.PRICING_RATES);
          }
          
          // Set transfer payment URL if present
          if (clientConfig.TRANSFER_PAYMENT_URL) {
            CONFIG.transferPaymentUrl = clientConfig.TRANSFER_PAYMENT_URL;
          }
          if (clientConfig.PAYMENT_API_URL) {
            CONFIG.paymentApiUrl = clientConfig.PAYMENT_API_URL;
          }
          if (clientConfig.PAYMENT_GATEWAY) {
            CONFIG.paymentGateway = clientConfig.PAYMENT_GATEWAY.toLowerCase();
          }
          if (clientConfig.PAYMENT_GATEWAY_CONFIG) {
            CONFIG.paymentGatewayConfig = clientConfig.PAYMENT_GATEWAY_CONFIG;
          }

          // Set contact configuration if present
          if (clientConfig.CONTACT_CONFIG) {
            CONFIG.contactConfig = clientConfig.CONTACT_CONFIG;
            console.log('[quote-calc] Loaded CONTACT_CONFIG from CDN:', CONFIG.contactConfig);
            console.log('[quote-calc] CONTACT_CONFIG type:', CONFIG.contactConfig.type);
          } else {
            console.warn('[quote-calc] No CONTACT_CONFIG found in CDN config');
          }
          
          // Override Google Maps key if present in client config
          if (clientConfig.SHARED_CONFIG?.GMAPS_KEY) {
            CONFIG.googleApiKey = clientConfig.SHARED_CONFIG.GMAPS_KEY;
          } else if (clientConfig.FORM_CONFIG?.GMAPS_KEY) {
            CONFIG.googleApiKey = clientConfig.FORM_CONFIG.GMAPS_KEY;
          }
          
          console.log(`[quote-calc] Successfully loaded ${client} core configuration`);
          return CONFIG;
        } else {
          console.warn(`[quote-calc] Core config not found (${response.status})`);
        }
      } catch (error) {
        console.warn(`[quote-calc] Failed to load core config:`, error);
      }

      // Final fallback: Use whatever CONFIG has (defaults merged or initial)
      window.CFG = {
        ...(window.CFG || {}),
        API_BASE: apiBase,
        client,
      };
      console.warn(`[quote-calc] No configuration found for ${client}, using defaults if any`);
      return CONFIG;
      
    } catch (error) {
      console.error('[quote-calc] Error loading client config:', error);
      return CONFIG; // Return default config on error
    }
  }

  /* ===== 2) PRICING CONVERTER ======================================== */
  function convertPricingRatesToConfig(pricingRates) {
    // Convert legacy pricing rates to new format
    if (pricingRates.DISTANCE_BANDS && pricingRates.BASE_RATES) {
      // Convert tour-driver style config
      const basePrice = pricingRates.BASE_RATES.SEDAN || 120;
      CONFIG.bands = pricingRates.DISTANCE_BANDS.map(band => ({
        maxMi: Math.round(band.maxKm * 0.621371), // Convert km to miles
        pricePP: Math.round(basePrice * band.multiplier)
      }));
      
      if (pricingRates.REMOTE_AREAS) {
        CONFIG.remote.surchargePP = pricingRates.REMOTE_AREAS.SURCHARGE_USD || 5;
      }
    } else if (pricingRates.zones) {
      // Convert demo/kamar-tours style zone-based config to distance bands
      // For now, use default bands but could be enhanced to convert zones
      console.log('[quote-calc] Zone-based pricing detected, using default distance bands');
    }
  }

  /* ===== 3) Utilities ================================================= */
  const qs = new URLSearchParams(location.search);
  const getParam = (k) => {
    const v = qs.get(k);
    if (v && String(v).trim()) return v;
    try { return sessionStorage.getItem("lead:"+k) || ""; } catch { return ""; }
    if (window.LEAD_DATA && window.LEAD_DATA[k]) return window.LEAD_DATA[k];
    return "";
  };
  const PAGE_DEFAULTS = () => window.CFG?.PAGE_DEFAULTS || {};
  const DEFAULT_KEYS = {
    pickup_location: "defaultPickup",
    dropoff_location: "defaultDropoff"
  };
  const getParamWithDefaults = (name) => {
    const value = getParam(name);
    if (value) return value;
    const key = DEFAULT_KEYS[name];
    if (key && PAGE_DEFAULTS()[key]) {
      return PAGE_DEFAULTS()[key];
    }
    return value;
  };

  // Helper: prefer explicit *_label fields, fallback to legacy *_location + defaults
  function getDisplayLabel(kind) {
    if (kind === 'pickup') {
      return getParam('pickup_label') || getParamWithDefaults('pickup_location');
    }
    if (kind === 'dropoff') {
      return getParam('dropoff_label') || getParamWithDefaults('dropoff_location');
    }
    return '';
  }

  const esc = s => String(s||"").replace(/[<>&"']/g, m => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'})[m]);
  const KM_PER_MI = 1.609344;
  /** Format distance for display using config.distanceUnit (mi or km). Internal value is always miles. */
  function fmtDistance(miles) {
    const unit = CONFIG.distanceUnit || 'mi';
    const n = miles || 0;
    if (unit === 'km') return (n * KM_PER_MI).toFixed(1) + ' km';
    return n.toFixed(1) + ' miles';
  }
  const fmtMin = secs => Math.round((secs||0)/60) + " minutes";

  // Find matching band for distance (new format with minMi/maxMi)
  function findBand(bands, miles) {
    // Assumes bands are already validated & sorted by minMi asc
    if (!bands || bands.length === 0) return null;
    
    // Try new format first (minMi/maxMi)
    const newFormatBand = bands.find(b => {
      const minMi = b.minMi ?? 0;
      const maxMi = b.maxMi;
      return miles >= minMi && (maxMi === null || miles < maxMi);
    });
    
    if (newFormatBand) return newFormatBand;
    
    // Fallback to old format (maxMi only)
    const oldFormatBand = bands.find(b => {
      if (b.maxMi !== undefined) {
        return miles < b.maxMi;
      }
      return false;
    });
    
    if (oldFormatBand) return oldFormatBand;
    
    // Ultra-fallback: return last band
    return bands[bands.length - 1];
  }

  function findTierForPax(tiers, pax) {
    if (!tiers || tiers.length === 0) return null;
    const sorted = [...tiers].sort((a, b) => (a.minPax ?? 0) - (b.minPax ?? 0));
    for (const t of sorted) {
      const minPax = t.minPax ?? 1;
      const maxPax = t.maxPax ?? 999;
      if (pax >= minPax && pax <= maxPax) return t;
    }
    return null;
  }

  function pickBandPrice(miles){
    const band = findBand(CONFIG.bands, miles);
    if (!band) return CONFIG.minPricePP || 0;
    
    // New format: band.price.type and band.price.amount
    if (band.price && band.price.type) {
      return band.price.amount;
    }
    
    // Old format: band.pricePP
    if (band.pricePP !== undefined) {
      return band.pricePP;
    }
    
    // Fallback
    return CONFIG.minPricePP || 0;
  }

  function remoteSurchargePP(pickup, dropoff){
    // Support both new format (surcharges.remote) and old format (remote)
    const remoteConfig = CONFIG.surcharges?.remote || CONFIG.remote || {};
    const keywords = remoteConfig.keywords || [];
    const surchargePP = remoteConfig.surchargePP || 0;
    
    if (!keywords || keywords.length === 0 || !surchargePP) return 0;
    
    const text = (pickup + " " + dropoff).toLowerCase();
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) return surchargePP;
    }
    return 0;
  }

  function getComponentMatchText(components) {
    if (!components || !Array.isArray(components)) return '';
    return components
      .map(c => ((c.long_name || '') + ' ' + (c.short_name || '')).trim())
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  function routeSurchargeMatchesZone(surcharge, pickup, dropoff, pickupComponents, dropoffComponents) {
    if (!surcharge || !surcharge.zoneKeywords) return false;
    const keywords = String(surcharge.zoneKeywords).split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    if (keywords.length === 0) return false;
    const applyTo = surcharge.applyTo || 'dropoff';
    const checkPickup = applyTo === 'pickup' || applyTo === 'either';
    const checkDropoff = applyTo === 'dropoff' || applyTo === 'either';

    // 1) Text match on address string
    const pickupText = (pickup || '').toLowerCase();
    const dropoffText = (dropoff || '').toLowerCase();
    for (const kw of keywords) {
      if (checkPickup && pickupText.includes(kw)) return true;
      if (checkDropoff && dropoffText.includes(kw)) return true;
    }

    // 2) Address components match (Google's locality, admin areas, etc.)
    const pickupCompText = getComponentMatchText(pickupComponents);
    const dropoffCompText = getComponentMatchText(dropoffComponents);
    for (const kw of keywords) {
      if (checkPickup && pickupCompText.includes(kw)) return true;
      if (checkDropoff && dropoffCompText.includes(kw)) return true;
    }
    return false;
  }

  function routeSurchargeAmount(pickup, dropoff, isRoundTrip, extraPaxOverage, pickupComponents, dropoffComponents) {
    const surcharges = CONFIG.routeSurcharges || [];
    console.log('[RouteSurcharge] Config:', {
      hasSurcharges: surcharges.length > 0,
      count: surcharges.length,
      pickup: pickup || '(empty)',
      dropoff: dropoff || '(empty)',
      hasComponents: !!(pickupComponents?.length || dropoffComponents?.length),
      isRoundTrip,
      extraPaxOverage
    });
    if (!surcharges.length || (!pickup && !dropoff)) {
      if (!surcharges.length) console.log('[RouteSurcharge] No surcharges in CONFIG.routeSurcharges');
      return 0;
    }
    let total = 0;
    for (const s of surcharges) {
      const matched = routeSurchargeMatchesZone(s, pickup, dropoff, pickupComponents, dropoffComponents);
      const bandAmt = parseFloat(s.bandAmount) || 0;
      const perPersonAmt = parseFloat(s.perPersonAmount) || 0;
      let amount = bandAmt;
      if (perPersonAmt > 0 && extraPaxOverage > 0) amount += perPersonAmt * extraPaxOverage;
      const behavior = s.roundTripBehavior || 'once';
      if (isRoundTrip && behavior === 'twice') amount *= 2;
      console.log('[RouteSurcharge] Rule:', s.name, '| zoneKeywords:', s.zoneKeywords, '| applyTo:', s.applyTo, '| matched:', matched, '| amount:', amount);
      if (!matched) continue;
      total += amount;
    }
    console.log('[RouteSurcharge] Total surcharge applied:', total);
    return total;
  }

  /* ===== 3.5) Kingston Route Detection ================================= */
  /**
   * Checks if coordinates fall within Kingston bounding box
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {boolean} True if coordinates are within Kingston bounds
   */
  function isInKingston(lat, lng) {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      console.log('[Kingston] Invalid coordinates:', { lat, lng });
      return false;
    }
    const inBounds = lat >= 17.95 && lat <= 18.10 && lng >= -76.90 && lng <= -76.65;
    console.log('[Kingston] Coordinate check:', { lat, lng, inBounds, bounds: '17.95-18.10°N, -76.90 to -76.65°W' });
    return inBounds;
  }

  /**
   * Checks if either pickup or dropoff location contains "Kingston" (case-insensitive)
   * Optionally checks coordinates if geocoded data is available
   * @param {string} pickup - Pickup location string
   * @param {string} dropoff - Dropoff location string
   * @param {Object} [coordinates] - Optional object with pickup/dropoff coordinates
   * @param {Object} [coordinates.pickup] - {lat, lng} for pickup
   * @param {Object} [coordinates.dropoff] - {lat, lng} for dropoff
   * @returns {boolean} True if route includes Kingston
   */
  function isKingstonRoute(pickup, dropoff, coordinates = null) {
    if (!pickup || !dropoff) {
      console.log('[Kingston] Missing pickup or dropoff');
      return false;
    }

    // Check location strings for "kingston" (case-insensitive)
    const pickupLower = String(pickup).toLowerCase();
    const dropoffLower = String(dropoff).toLowerCase();
    
    console.log('[Kingston] Checking locations:', { pickup: pickupLower, dropoff: dropoffLower });
    
    if (pickupLower.includes('kingston') || dropoffLower.includes('kingston')) {
      console.log('[Kingston] ✓ Found "kingston" in location strings');
      return true;
    }

    // Check for common Kingston landmarks/neighborhoods (fallback for string detection)
    const kingstonKeywords = ['mona', 'papine', 'half way tree', 'new kingston', 'uptown', 'downtown kingston', 'cross roads'];
    const combinedText = pickupLower + ' ' + dropoffLower;
    for (const keyword of kingstonKeywords) {
      if (combinedText.includes(keyword)) {
        console.log('[Kingston] ✓ Found Kingston keyword:', keyword);
        // For certain keywords like "mona", we're more confident it's Kingston
        if (keyword === 'mona' || keyword === 'papine') {
          return true;
        }
      }
    }

    // Optionally check coordinates if available
    if (coordinates) {
      console.log('[Kingston] Checking coordinates:', coordinates);
      if (coordinates.pickup && isInKingston(coordinates.pickup.lat, coordinates.pickup.lng)) {
        console.log('[Kingston] ✓ Pickup coordinates are in Kingston:', coordinates.pickup);
        return true;
      }
      if (coordinates.dropoff && isInKingston(coordinates.dropoff.lat, coordinates.dropoff.lng)) {
        console.log('[Kingston] ✓ Dropoff coordinates are in Kingston:', coordinates.dropoff);
        return true;
      }
      console.log('[Kingston] ✗ Coordinates are not in Kingston bounds');
      if (coordinates.dropoff) {
        console.log('[Kingston] Dropoff coords:', coordinates.dropoff, 'Bounds:', '17.95-18.10°N, -76.90 to -76.65°W');
      }
    } else {
      console.log('[Kingston] No coordinates provided for checking');
    }

    return false;
  }

  /* ===== 4) UI builders ================================================== */
  function buildCardHTML(state){
    const { pickup, dropoff, miles, seconds, pp, total, pax, showMap = true, coordinates = null, isRoundTrip = false } = state;
    
    // Check if this is a Kingston route
    const isKingston = isKingstonRoute(pickup, dropoff, coordinates);
    console.log('[buildCardHTML] isKingston:', isKingston, 'coordinates:', coordinates);
    
    const tripType = isRoundTrip ? 'Round Trip' : 'One Way';

    return `
      <div class="qc-row">
        ${showMap ? `
        <div>
          <div id="qc-map" class="qc-map qc-shimmer" aria-label="Route map"></div>
        </div>
        ` : ''}

        <div class="qc-details">
          <div class="qc-detail-item">
            <span class="qc-detail-label">Trip Type:</span>
            <span class="qc-detail-value">${tripType}</span>
          </div>
          <div class="qc-detail-item">
            <span class="qc-detail-label">From:</span>
            <span class="qc-detail-value">${esc(pickup)}</span>
          </div>
          <div class="qc-detail-item">
            <span class="qc-detail-label">To:</span>
            <span class="qc-detail-value">${esc(dropoff)}</span>
          </div>
          <div class="qc-detail-item">
            <span class="qc-detail-label">Distance:</span>
            <span class="qc-detail-value">${fmtDistance(miles)}</span>
          </div>
          <div class="qc-detail-item">
            <span class="qc-detail-label">Est. Duration:</span>
            <span class="qc-detail-value">${fmtMin(seconds)}</span>
          </div>
          <div class="qc-detail-item">
            <span class="qc-detail-label">Number of Passengers:</span>
            <span class="qc-detail-value">${pax || CONFIG.defaultPassengers}</span>
          </div>
          ${isRoundTrip ? `
          <div class="qc-detail-item">
            <span class="qc-detail-label">One Way Price:</span>
            <span class="qc-detail-value">$${(pp / 2).toFixed(2)} USD</span>
          </div>
          <div class="qc-detail-item">
            <span class="qc-detail-label">Return Price:</span>
            <span class="qc-detail-value">$${(pp / 2).toFixed(2)} USD</span>
          </div>
          <div class="qc-detail-item">
            <span class="qc-detail-label">Total Per Person:</span>
            <span class="qc-detail-value">$${pp.toFixed(2)} USD</span>
          </div>
          ` : `
          <div class="qc-detail-item">
            <span class="qc-detail-label">${isRoundTrip ? 'Total Per Person' : 'Cost per person'}:</span>
            <span class="qc-detail-value">$${typeof pp === 'number' ? pp.toFixed(2) : pp} USD</span>
          </div>
          `}
          <div class="qc-detail-item">
            <span class="qc-detail-label">Total Cost:</span>
            <span class="qc-detail-value highlight">$${typeof total === 'number' ? total.toFixed(2) : total} USD</span>
          </div>
          
          ${isKingston ? `
          <div class="qc-kingston-message">
            💬 Online payment unavailable for Kingston routes. Contact us to confirm your booking.
          </div>
          ` : ''}
          <div class="qc-buttons">
            ${isKingston ? `
            <button class="qc-btn qc-btn-disabled" disabled>Pay Now</button>
            <button class="qc-btn qc-btn-primary" onclick="handleContactUs()">Contact Us</button>
            ` : `
            <button class="qc-btn qc-btn-primary" onclick="handlePayNow()">Pay Now</button>
            <button class="qc-btn qc-btn-secondary" onclick="handleContactUs()">Contact Us</button>
            `}
          </div>
        </div>
      </div>
    `;
  }

  function skeletonHTML(){
    return `
      <div class="qc-details">
        <div class="qc-shimmer" style="height:20px;margin-bottom:16px;border-radius:4px;"></div>
        <div class="qc-shimmer" style="height:20px;margin-bottom:16px;border-radius:4px;"></div>
        <div class="qc-shimmer" style="height:20px;margin-bottom:16px;border-radius:4px;"></div>
        <div class="qc-shimmer" style="height:20px;margin-bottom:16px;border-radius:4px;"></div>
        <div class="qc-shimmer" style="height:20px;margin-bottom:16px;border-radius:4px;"></div>
        <div class="qc-shimmer" style="height:20px;margin-bottom:16px;border-radius:4px;"></div>
        <div class="qc-shimmer" style="height:24px;margin-bottom:24px;border-radius:4px;"></div>
        <div style="display:flex;gap:12px;">
          <div class="qc-shimmer" style="height:48px;flex:1;border-radius:8px;"></div>
          <div class="qc-shimmer" style="height:48px;flex:1;border-radius:8px;"></div>
        </div>
      </div>
    `;
  }

  /* ===== 5) Google Maps Loader ======================================= */
  function loadMaps(cb){
    console.log(`[quote-calc] Loading Google Maps...`);
    if (window.google && google.maps && google.maps.DistanceMatrixService) {
      console.log(`[quote-calc] Google Maps already loaded`);
      return cb();
    }
    
    const key = CONFIG.googleApiKey;
    console.log(`[quote-calc] Using API key: ${key?.substring(0, 15)}...`);
    
    if (!key) { 
      console.error("[quote-calc] Missing Google Maps API key"); 
      cb("no-key"); 
      return; 
    }
    
    if (document.querySelector("script[data-qc-gmaps]")){
      console.log(`[quote-calc] Google Maps script already exists, waiting for load...`);
      const check = () => window.google?.maps?.DistanceMatrixService ? cb() : setTimeout(check, 100);
      check(); 
      return;
    }
    
    console.log(`[quote-calc] Creating Google Maps script tag`);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=geometry`;
    script.setAttribute("data-qc-gmaps", "1");
    script.onload = () => {
      console.log(`[quote-calc] Google Maps script loaded successfully`);
      cb();
    };
    script.onerror = () => { 
      console.error("[quote-calc] Failed to load Google Maps"); 
      cb("load-error"); 
    };
    document.head.appendChild(script);
  }

  // Shared key with tour-detail-form.js for persisting routing identifiers
  const ROUTE_STORAGE_KEY = 'tourism_route_fields_v1';

  function readRouteFieldsFromStorage() {
    if (typeof window === 'undefined' || !window.sessionStorage) return {};
    try {
      const raw = window.sessionStorage.getItem(ROUTE_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function clearRouteFieldsFromStorage() {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    try {
      window.sessionStorage.removeItem(ROUTE_STORAGE_KEY);
    } catch (_) {
      // Ignore
    }
  }

  /* ===== 6) Main Calculator Engine ==================================== */
  async function calculate(){
    // Inject CSS styles first
    injectStyles();
    
    const mount = document.getElementById(MOUNT_ID);
    if (!mount) { console.warn(`[quote-calc] No element #${MOUNT_ID} found`); return; }

    // Human‑readable labels for display (must not depend on routing success)
    const pickupLabel = getDisplayLabel('pickup');
    const dropoffLabel = getDisplayLabel('dropoff');

    // Routing identifiers (place IDs & coordinates) – used only for distance calculation
    let pickupPlaceId = getParam("pickup_place_id");
    let dropoffPlaceId = getParam("dropoff_place_id");
    let pickupLat = parseFloat(getParam("pickup_lat"));
    let pickupLng = parseFloat(getParam("pickup_lng"));
    let dropoffLat = parseFloat(getParam("dropoff_lat"));
    let dropoffLng = parseFloat(getParam("dropoff_lng"));

    // If URL params are empty (common with GHL surveys), fall back to sessionStorage
    // values previously written by tour-detail-form.js on the form page.
    try {
      const stored = readRouteFieldsFromStorage();
      if (!pickupPlaceId && stored.pickup_place_id) {
        pickupPlaceId = stored.pickup_place_id;
      }
      if (!dropoffPlaceId && stored.dropoff_place_id) {
        dropoffPlaceId = stored.dropoff_place_id;
      }
      if ((Number.isNaN(pickupLat) || Number.isNaN(pickupLng)) &&
          stored.pickup_lat && stored.pickup_lng) {
        pickupLat = parseFloat(stored.pickup_lat);
        pickupLng = parseFloat(stored.pickup_lng);
      }
      if ((Number.isNaN(dropoffLat) || Number.isNaN(dropoffLng)) &&
          stored.dropoff_lat && stored.dropoff_lng) {
        dropoffLat = parseFloat(stored.dropoff_lat);
        dropoffLng = parseFloat(stored.dropoff_lng);
      }
    } catch (_) {
      // If storage is unavailable or malformed, just continue with URL params
    }

    // Backwards‑compatible text fallbacks (legacy pickup_location / dropoff_location)
    const legacyPickupText = getParamWithDefaults("pickup_location");
    const legacyDropoffText = getParamWithDefaults("dropoff_location");

    // Final labels used throughout the UI and summaries
    const pickup = pickupLabel || legacyPickupText;
    const dropoff = dropoffLabel || legacyDropoffText;
    
    console.log('[quote-calc] Starting calculation with labels:', { pickup, dropoff });
    console.log('[quote-calc] Routing identifiers:', {
      pickupPlaceId,
      dropoffPlaceId,
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng
    });
    console.log(`[quote-calc] Initial CONFIG.googleApiKey: ${CONFIG.googleApiKey?.substring(0, 15)}...`);
    
    if (!pickup || !dropoff) {
      mount.innerHTML = `<div class="qc-error">Missing pickup or dropoff location</div>`;
      return;
    }

    mount.innerHTML = skeletonHTML();

    // Load client-specific config first
    try {
      await loadClientConfig();
      console.log(`[quote-calc] After config loading, CONFIG.googleApiKey: ${CONFIG.googleApiKey?.substring(0, 15)}...`);
    } catch (error) {
      console.warn('[quote-calc] Failed to load client config, using defaults:', error);
    }

    loadMaps((err) => {
      if (err) {
        mount.innerHTML = `<div class="qc-error">Could not load Google Maps: ${err}</div>`;
        return;
      }

      // Primary calculation using Distance Matrix API (more reliable)
      const service = new google.maps.DistanceMatrixService();

      // Determine routing strategy (IDs → coords → text)
      let origins;
      let destinations;
      let routingMode = 'text';

      const hasPlaceIds = !!(pickupPlaceId && dropoffPlaceId);
      const hasCoords =
        !Number.isNaN(pickupLat) && !Number.isNaN(pickupLng) &&
        !Number.isNaN(dropoffLat) && !Number.isNaN(dropoffLng);

      if (hasPlaceIds) {
        // Use JS-native placeId objects for Distance Matrix
        origins = [{ placeId: pickupPlaceId }];
        destinations = [{ placeId: dropoffPlaceId }];
        routingMode = 'place_id';
      } else if (hasCoords) {
        origins = [{ lat: pickupLat, lng: pickupLng }];
        destinations = [{ lat: dropoffLat, lng: dropoffLng }];
        routingMode = 'latlng';
      } else {
        origins = [pickup];
        destinations = [dropoff];
        routingMode = 'text';
      }

      console.log('[quote-calc] DistanceMatrix routing mode:', routingMode, {
        origins,
        destinations
      });

      const runDistanceMatrix = (originsArg, destinationsArg, modeLabel, isRetry) => {
        service.getDistanceMatrix({
          origins: originsArg,
          destinations: destinationsArg,
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false
        }, (response, status) => {
          if (status !== "OK") {
            // Retry logic: place_id → latlng → text
            if (!isRetry) {
              if (modeLabel === 'place_id' && hasCoords) {
                console.warn('[quote-calc] Distance Matrix failed in place_id mode, retrying with latlng:', status);
                const retryOrigins = [{ lat: pickupLat, lng: pickupLng }];
                const retryDestinations = [{ lat: dropoffLat, lng: dropoffLng }];
                console.log('[quote-calc] DistanceMatrix retry mode: latlng', {
                  origins: retryOrigins,
                  destinations: retryDestinations
                });
                runDistanceMatrix(retryOrigins, retryDestinations, 'latlng', true);
                return;
              } else if ((modeLabel === 'place_id' || modeLabel === 'latlng') && pickup && dropoff) {
                // Fallback to text addresses if place_id or latlng failed
                console.warn('[quote-calc] Distance Matrix failed in ' + modeLabel + ' mode, retrying with text addresses:', status);
                console.log('[quote-calc] DistanceMatrix retry mode: text', {
                  origins: [pickup],
                  destinations: [dropoff]
                });
                runDistanceMatrix([pickup], [dropoff], 'text', true);
                return;
              }
            }
            mount.innerHTML = `<div class="qc-error">Couldn't calculate the distance right now. Please try again.</div>`;
            console.error("[quote-calc] Distance Matrix failed:", status, "Origins:", originsArg, "Destinations:", destinationsArg);
            return;
          }

          const element = response.rows[0].elements[0];
          if (element.status !== "OK") {
            // Retry logic: place_id → latlng → text
            if (!isRetry) {
              if (modeLabel === 'place_id' && hasCoords) {
                console.warn('[quote-calc] Distance Matrix element failed in place_id mode, retrying with latlng:', element.status);
                const retryOrigins = [{ lat: pickupLat, lng: pickupLng }];
                const retryDestinations = [{ lat: dropoffLat, lng: dropoffLng }];
                console.log('[quote-calc] DistanceMatrix retry mode: latlng', {
                  origins: retryOrigins,
                  destinations: retryDestinations
                });
                runDistanceMatrix(retryOrigins, retryDestinations, 'latlng', true);
                return;
              } else if ((modeLabel === 'place_id' || modeLabel === 'latlng') && pickup && dropoff) {
                // Fallback to text addresses if place_id or latlng failed
                console.warn('[quote-calc] Distance Matrix failed in ' + modeLabel + ' mode, retrying with text addresses:', element.status);
                console.log('[quote-calc] DistanceMatrix retry mode: text', {
                  origins: [pickup],
                  destinations: [dropoff]
                });
                runDistanceMatrix([pickup], [dropoff], 'text', true);
                return;
              }
            }
            mount.innerHTML = `<div class="qc-error">Could not find a route between these locations. Please check the addresses.</div>`;
            console.error("[quote-calc] Distance Matrix element failed:", element.status, "Origins:", originsArg, "Destinations:", destinationsArg);
            return;
          }

          const meters = element.distance?.value || 0;
          const miles = meters / 1609.344;
          const seconds = element.duration?.value || 0;

          const rsPP = remoteSurchargePP(pickup, dropoff);
          const minPax = CONFIG.minPassengers || CONFIG.defaultPassengers || 1;
          const paxRaw = getParam("passengers") || getParam("number_of_passengers");
          const hasExplicitPax = paxRaw && parseInt(paxRaw, 10) > 0;
          const pax = hasExplicitPax ? parseInt(paxRaw, 10) : (CONFIG.defaultPassengers || 1);
          const effectivePax = hasExplicitPax ? pax : Math.max(pax, minPax);

          let pp = 0;
          let total = 0;
          const isTiered = CONFIG.pricingModel === 'tiered' && CONFIG.tiers && CONFIG.tiers.length > 0;

          if (isTiered) {
            const matchedBand = findBand(CONFIG.bands, miles);
            let tier = findTierForPax(CONFIG.tiers, effectivePax);
            const overage = CONFIG.overage;
            const lastTier = [...(CONFIG.tiers || [])].sort((a, b) => (b.maxPax ?? 0) - (a.maxPax ?? 0))[0];
            const firstTier = [...(CONFIG.tiers || [])].sort((a, b) => (a.minPax ?? 0) - (b.minPax ?? 0))[0];
            const afterPax = lastTier ? (lastTier.maxPax ?? 0) : 0;
            const overageEnabled = overage && (
              (overage.percentOfTierPrice != null && overage.percentOfTierPrice > 0) ||
              (overage.pricePerPax != null && overage.pricePerPax > 0)
            );
            if (!tier && lastTier && effectivePax > afterPax && overageEnabled) tier = lastTier;
            if (matchedBand && matchedBand.tierPrices && tier) {
              const tierPrice = Number(matchedBand.tierPrices[tier.id]) || 0;
              total = tierPrice + rsPP;
              if (overageEnabled && effectivePax > afterPax) {
                const extraPax = effectivePax - afterPax;
                const maxExtra = overage.maxPax != null ? Math.min(extraPax, overage.maxPax - afterPax) : extraPax;
                if (maxExtra > 0) {
                  let pricePerExtra;
                  if (overage.percentOfTierPrice != null && overage.percentOfTierPrice > 0 && firstTier) {
                    const baseTierPrice = Number(matchedBand.tierPrices[firstTier.id]) || 0;
                    pricePerExtra = baseTierPrice * (overage.percentOfTierPrice / 100);
                  } else {
                    pricePerExtra = overage.pricePerPax || 0;
                  }
                  total += maxExtra * pricePerExtra;
                }
              }
              pp = effectivePax > 0 ? total / effectivePax : 0;
            }
            total = Math.round(total);
          } else {
            const matchedBand = findBand(CONFIG.bands, miles);
            let basePP = 0;
            if (matchedBand) {
          // New format: price.type and price.amount
          if (matchedBand.price && matchedBand.price.type) {
            if (matchedBand.price.type === 'flat') {
              // For flat pricing, we'll divide by passengers later
              basePP = matchedBand.price.amount;
            } else {
              // per_person
              basePP = matchedBand.price.amount;
            }
          } else if (matchedBand.pricePP !== undefined) {
            // Old format
            basePP = matchedBand.pricePP;
          } else {
            basePP = CONFIG.minPricePP || 0;
          }
            } else {
              basePP = CONFIG.minPricePP || 0;
            }
            if (matchedBand && matchedBand.price && matchedBand.price.type === 'flat') {
          // Flat pricing: divide total by number of passengers
          pp = Math.max(CONFIG.minPricePP || 0, (basePP / Math.max(effectivePax, 1)) + rsPP);
        } else {
          // Per-person pricing (default)
          pp = Math.max(CONFIG.minPricePP || 0, basePP + rsPP);
        }
        
        total = Math.round(pp * effectivePax);
          }

        // Check if round trip to adjust pricing
        const roundTripParam = getParam("round_trip");
        const returnDate = getParam("return_date");
        const returnTime = getParam("return_time");
        const normalizedRoundTrip = roundTripParam ? 
          decodeURIComponent(roundTripParam).replace(/\?+$/, '').trim().toLowerCase() : '';
        const isRoundTrip = normalizedRoundTrip === 'true' || 
                            normalizedRoundTrip === '1' || 
                            normalizedRoundTrip === 'yes' || 
                            normalizedRoundTrip === 'round trip' ||
                            returnDate || 
                            returnTime;

        // Route surcharge (e.g. tolls for Kingston)
        let extraPaxOverage = 0;
        if (isTiered) {
          const overage = CONFIG.overage || {};
          const overageEnabled = (overage.percentOfTierPrice != null && overage.percentOfTierPrice > 0) ||
            (overage.pricePerPax != null && overage.pricePerPax > 0);
          const lastTier = [...(CONFIG.tiers || [])].sort((a, b) => (b.maxPax ?? 0) - (a.maxPax ?? 0))[0];
          const afterPax = lastTier ? (lastTier.maxPax ?? 0) : 0;
          if (overageEnabled && effectivePax > afterPax) extraPaxOverage = effectivePax - afterPax;
        }
        const routeSurchargeAmt = routeSurchargeAmount(pickup, dropoff, isRoundTrip, extraPaxOverage);
        const baseTotal = isRoundTrip ? total * 2 : total;
        const totalCost = Math.round(baseTotal + routeSurchargeAmt);
        const displayPP = effectivePax > 0 ? totalCost / effectivePax : pp;

        // Generate quote ID for server-side price recalculation (prevents tampering)
        const quoteId = `quote-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        
        // Expose last computed quote for Pay Now
        window.__qcQuote = {
          quoteId: quoteId, // Server uses this to recalculate price from trusted data
          pickup,
          dropoff,
          pickup_place_id: pickupPlaceId,
          dropoff_place_id: dropoffPlaceId,
          pickup_lat: pickupLat,
          pickup_lng: pickupLng,
          dropoff_lat: dropoffLat,
          dropoff_lng: dropoffLng,
          miles: Math.round(miles*10)/10,
          seconds,
          passengers: effectivePax,
          pricePerPerson: displayPP,
          totalCost: totalCost, // For display only - server recalculates
          isRoundTrip: isRoundTrip,
          quoteTimestamp: Date.now(),
          roundTrip: isRoundTrip
        };

        // Render UI immediately (don't wait for geocoding)
        const outer = document.createElement("div");
        outer.id = MOUNT_ID;
        outer.innerHTML = buildCardHTML({
          pickup, dropoff,
          miles: Math.round(miles*10)/10,
          seconds, pax: effectivePax,
          pp: displayPP,
          total: totalCost,
          showMap: true,
          coordinates: null, // Start with null, update after geocoding
          isRoundTrip: isRoundTrip
        });
        
        // Replace mount contents
        mount.replaceWith(outer);

        // Quote rendered successfully – clear stored routing fields so they
        // don't leak into future, unrelated quotes in this session.
        clearRouteFieldsFromStorage();

        // Geocode addresses to get coordinates and address_components (async, doesn't block UI)
        const geocoder = new google.maps.Geocoder();
        
        // Geocode both pickup and dropoff (capture address_components for zone matching)
        Promise.all([
          new Promise((resolve) => {
            geocoder.geocode({ address: pickup }, (results, status) => {
              if (status === 'OK' && results && results[0] && results[0].geometry && results[0].geometry.location) {
                resolve({
                  lat: results[0].geometry.location.lat(),
                  lng: results[0].geometry.location.lng(),
                  address_components: results[0].address_components || []
                });
              } else {
                console.warn('[quote-calc] Geocoding failed for pickup:', pickup, status);
                resolve(null);
              }
            });
          }),
          new Promise((resolve) => {
            geocoder.geocode({ address: dropoff }, (results, status) => {
              if (status === 'OK' && results && results[0] && results[0].geometry && results[0].geometry.location) {
                resolve({
                  lat: results[0].geometry.location.lat(),
                  lng: results[0].geometry.location.lng(),
                  address_components: results[0].address_components || []
                });
              } else {
                console.warn('[quote-calc] Geocoding failed for dropoff:', dropoff, status);
                resolve(null);
              }
            });
          })
        ]).then(([pickupGeo, dropoffGeo]) => {
          const pickupCoords = pickupGeo ? { lat: pickupGeo.lat, lng: pickupGeo.lng } : null;
          const dropoffCoords = dropoffGeo ? { lat: dropoffGeo.lat, lng: dropoffGeo.lng } : null;
          const pickupComponents = pickupGeo?.address_components || [];
          const dropoffComponents = dropoffGeo?.address_components || [];
          const coordinates = {
            pickup: pickupCoords,
            dropoff: dropoffCoords
          };
          
          console.log('[quote-calc] Geocoded coordinates:', coordinates);
          if (pickupComponents.length || dropoffComponents.length) {
            console.log('[quote-calc] Address components for route surcharge:', {
              pickup: getComponentMatchText(pickupComponents).substring(0, 80),
              dropoff: getComponentMatchText(dropoffComponents).substring(0, 80)
            });
          }

          // Recalculate route surcharge with address components (hybrid: text + components)
          const surchargeWithComponents = routeSurchargeAmount(pickup, dropoff, isRoundTrip, extraPaxOverage, pickupComponents, dropoffComponents);
          if (surchargeWithComponents > routeSurchargeAmt) {
            const newTotalCost = Math.round(baseTotal + surchargeWithComponents);
            const newDisplayPP = effectivePax > 0 ? newTotalCost / effectivePax : displayPP;
            console.log('[RouteSurcharge] Component match found additional surcharge. Updating:', { previous: totalCost, new: newTotalCost });
            if (window.__qcQuote) {
              window.__qcQuote.totalCost = newTotalCost;
              window.__qcQuote.pricePerPerson = newDisplayPP;
            }
            const totalEl = document.querySelector('.qc-detail-value.highlight');
            const ppEls = document.querySelectorAll('.qc-detail-item .qc-detail-value');
            if (totalEl) totalEl.textContent = '$' + newTotalCost.toFixed(2) + ' USD';
            ppEls.forEach(el => {
              const label = el.closest('.qc-detail-item')?.querySelector('.qc-detail-label');
              if (label && (label.textContent.includes('Cost per person') || label.textContent.includes('Total Per Person'))) {
                el.textContent = '$' + newDisplayPP.toFixed(2) + ' USD';
              }
              if (label && (label.textContent.includes('One Way Price') || label.textContent.includes('Return Price'))) {
                el.textContent = '$' + (newDisplayPP / 2).toFixed(2) + ' USD';
              }
            });
          }
          
          // Check Kingston route
          const isKingston = isKingstonRoute(pickup, dropoff, coordinates);
          console.log('[quote-calc] Is Kingston route?', isKingston);
          
          // Update UI with Kingston detection (re-render buttons section)
          const buttonContainer = document.querySelector('.qc-buttons');
          const detailsContainer = buttonContainer?.closest('.qc-details') || buttonContainer?.parentElement;
          if (buttonContainer && detailsContainer) {
            const isKingstonNow = isKingstonRoute(pickup, dropoff, coordinates);
            console.log('[quote-calc] Updating button container. isKingstonNow:', isKingstonNow, 'buttonContainer:', buttonContainer);
            if (isKingstonNow) {
              // Check if message already exists
              let kingstonMessage = detailsContainer.querySelector('.qc-kingston-message');
              if (!kingstonMessage) {
                // Create and insert message above buttons
                kingstonMessage = document.createElement('div');
                kingstonMessage.className = 'qc-kingston-message';
                kingstonMessage.innerHTML = '💬 Online payment unavailable for Kingston routes. Contact us to confirm your booking.';
                detailsContainer.insertBefore(kingstonMessage, buttonContainer);
                console.log('[quote-calc] Added Kingston message above buttons');
              }
              
              // Update Pay Now button to disabled style
              const payNowButton = buttonContainer.querySelector('.qc-btn-primary');
              if (payNowButton && payNowButton.textContent.trim() === 'Pay Now') {
                payNowButton.className = 'qc-btn qc-btn-disabled';
                payNowButton.disabled = true;
                payNowButton.onclick = null;
                console.log('[quote-calc] Disabled Pay Now button');
              }
              
              // Update Contact Us button to primary (green) style
              const contactButton = buttonContainer.querySelector('.qc-btn-secondary');
              if (contactButton && contactButton.textContent.trim() === 'Contact Us') {
                contactButton.className = 'qc-btn qc-btn-primary';
                console.log('[quote-calc] Changed Contact Us button to primary style');
              }
            }
          } else {
            console.warn('[quote-calc] Button container not found!');
          }
        }).catch((error) => {
          console.error('[quote-calc] Geocoding error:', error);
          // Continue with UI even if geocoding fails
        });

        // Try to enhance with interactive route map (optional)
        const mapNode = document.getElementById("qc-map");
        if (mapNode && google.maps.DirectionsService) {
          console.log(`[quote-calc] Attempting to add interactive route map`);
          console.log(`[quote-calc] Map container:`, mapNode);
          console.log(`[quote-calc] Pickup: "${pickup}", Dropoff: "${dropoff}"`);
          
          const ds = new google.maps.DirectionsService();

          // Helper: render a simple "map unavailable" card while keeping the quote
          const renderUnavailable = (directionsStatus) => {
            mapNode.innerHTML = `
              <div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f9fafb;color:#6b7280;text-align:center;padding:20px;">
                <div>
                  <p style="margin:0;font-size:16px;margin-bottom:8px;">📍 Route Map Unavailable</p>
                  <p style="margin:0;font-size:14px;">Distance calculated: ${fmtDistance(miles)}</p>
                  <p style="margin:0;font-size:12px;margin-top:8px;color:#9ca3af;">Directions API: ${directionsStatus}</p>
                </div>
              </div>
            `;
            mapNode.classList.remove("qc-shimmer");
          };

          const renderMapFromResult = (res) => {
            console.log(`[quote-calc] Directions API successful, rendering map`);
            const map = new google.maps.Map(mapNode, { 
              zoom: CONFIG.map.zoom || 9,
              center: res.routes[0].legs[0].start_location
            });
            const directionsRenderer = new google.maps.DirectionsRenderer({ 
              map: map,
              draggable: false
            });
            directionsRenderer.setDirections(res);
            mapNode.classList.remove("qc-shimmer");
            console.log(`[quote-calc] Interactive route map displayed successfully`);
          };

          // First attempt: use the most specific routing identifiers we have
          const primaryRequest = {
            travelMode: google.maps.TravelMode.DRIVING
          };
          if (pickupPlaceId && dropoffPlaceId) {
            primaryRequest.origin = { placeId: pickupPlaceId };
            primaryRequest.destination = { placeId: dropoffPlaceId };
          } else if (
            !Number.isNaN(pickupLat) && !Number.isNaN(pickupLng) &&
            !Number.isNaN(dropoffLat) && !Number.isNaN(dropoffLng)
          ) {
            primaryRequest.origin = { lat: pickupLat, lng: pickupLng };
            primaryRequest.destination = { lat: dropoffLat, lng: dropoffLng };
          } else {
            primaryRequest.origin = pickup;
            primaryRequest.destination = dropoff;
          }

          const fallbackRequest = {
            origin: pickup,
            destination: dropoff,
            travelMode: google.maps.TravelMode.DRIVING
          };

          ds.route(primaryRequest, (res, directionsStatus) => {
            console.log(`[quote-calc] Directions API response (primary):`, directionsStatus);
            
            if (directionsStatus === "OK") {
              renderMapFromResult(res);
              return;
            }

            // If ZERO_RESULTS (or any non-OK), retry once with plain-text labels
            console.warn(`[quote-calc] Directions primary failed (${directionsStatus}), retrying with labels...`);
            ds.route(fallbackRequest, (res2, status2) => {
              console.log(`[quote-calc] Directions API response (fallback):`, status2);
              if (status2 === "OK") {
                renderMapFromResult(res2);
              } else {
                console.warn(`[quote-calc] Directions fallback failed (${status2}), keeping quote without route line`);
                renderUnavailable(status2);
              }
            });
          });
        } else {
          // No Directions API available, show simple placeholder
          console.log(`[quote-calc] Directions API not available, showing distance only`);
          console.log(`[quote-calc] MapNode exists:`, !!mapNode);
          console.log(`[quote-calc] DirectionsService exists:`, !!google.maps.DirectionsService);
          
          if (mapNode) {
            mapNode.innerHTML = `
              <div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f9fafb;color:#6b7280;text-align:center;padding:20px;">
                <div>
                  <p style="margin:0;font-size:18px;margin-bottom:8px;">📏 ${fmtDistance(miles)}</p>
                  <p style="margin:0;font-size:14px;">Estimated ${fmtMin(seconds)}</p>
                  <p style="margin:0;font-size:12px;margin-top:8px;color:#9ca3af;">Maps API not fully loaded</p>
                </div>
              </div>
            `;
            mapNode.classList.remove("qc-shimmer");
          }
        }
        });
      };

      // Initial Distance Matrix run
      runDistanceMatrix(origins, destinations, routingMode, false);
    });
  }

  /* ===== 7) Auto-run on page load ===================================== */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", calculate);
  } else {
    calculate();
  }

  // Expose calculate function globally for debugging
  window.calculate = calculate;

  /* ===== 7.5) Square Payment Integration ============================== */
  
  // Load Square Web Payments SDK
  function loadSquareSDK(mode, callback) {
    if (window.Square && window.Square.payments) {
      return callback();
    }
    
    const script = document.createElement('script');
    // Use sandbox SDK for test mode, production SDK for live mode
    script.src = mode === 'test'
      ? 'https://sandbox.web.squarecdn.com/v1/square.js'
      : 'https://web.squarecdn.com/v1/square.js';
    script.onload = callback;
    script.onerror = () => {
      console.error('[quote-calc] Failed to load Square SDK');
      alert('Failed to load payment system. Please refresh the page.');
    };
    document.head.appendChild(script);
  }
  
  // Initialize Square payment form
  let squarePayments = null;
  let squareCard = null;
  
  async function initializeSquarePayment(applicationId, locationId, mode) {
    if (!window.Square || !window.Square.payments) {
      await new Promise((resolve) => {
        loadSquareSDK(mode, resolve);
      });
    }
    
    try {
      squarePayments = window.Square.payments(applicationId, locationId);
      squareCard = await squarePayments.card();
      await squareCard.attach('#square-card-container');
      
      // DEBUG: Expose Square objects to window for console debugging
      window.__square = { payments: squarePayments, card: squareCard };
      console.log("[square debug] window.__square ready");
      
      console.log('[quote-calc] Square payment form initialized');
      return true;
    } catch (error) {
      console.error('[quote-calc] Square initialization error:', error);
      return false;
    }
  }
  
  // Create Square payment token
  async function createSquarePaymentToken() {
    if (!squareCard) {
      throw new Error('Square payment form not initialized');
    }
    
    try {
      const result = await squareCard.tokenize();
      if (result.status === 'OK') {
        return result.token;
      } else {
        throw new Error(result.errors?.[0]?.message || 'Tokenization failed');
      }
    } catch (error) {
      console.error('[quote-calc] Square tokenization error:', error);
      throw error;
    }
  }
  
  // Show Square payment modal
  function showSquarePaymentModal() {
    const modal = document.createElement('div');
    modal.id = 'square-payment-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;
    
    modal.innerHTML = `
      <div style="background: white; border-radius: 12px; padding: 24px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto;">
        <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Complete Payment</h2>
        <div id="square-card-container" style="margin-bottom: 20px; min-height: 200px;"></div>
        <div style="display: flex; gap: 12px;">
          <button id="square-pay-cancel" style="flex: 1; padding: 12px; border: 1px solid #ccc; background: white; border-radius: 6px; cursor: pointer; font-weight: 600;">Cancel</button>
          <button id="square-pay-submit" style="flex: 1; padding: 12px; border: none; background: #059669; color: white; border-radius: 6px; cursor: pointer; font-weight: 600;">Pay Now</button>
        </div>
        <div id="square-payment-error" style="margin-top: 16px; color: #dc2626; display: none;"></div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Initialize Square form
    // SECURITY: Only use safe, non-sensitive fields from config
    // Access Token is NEVER exposed to browser - only Application ID and Location ID
    const gatewayConfig = CONFIG.paymentGatewayConfig || window.CFG?.core_config?.PAYMENT_GATEWAY_CONFIG || {};
    const applicationId = gatewayConfig.publicKey || gatewayConfig.applicationId;
    const locationId = gatewayConfig.accountId || gatewayConfig.locationId;
    const mode = gatewayConfig.mode || 'live';
    
    // Validate required fields
    if (!applicationId || !locationId) {
      alert('Square payment is not properly configured. Please contact support.');
      modal.remove();
      return;
    }
    
    // Use sandbox for test mode
    const squareAppId = mode === 'test' 
      ? (applicationId || 'sandbox-sq0idb-YourApplicationId')
      : applicationId;
    
    initializeSquarePayment(squareAppId, locationId, mode).then(success => {
      if (!success) {
        document.getElementById('square-payment-error').textContent = 'Failed to initialize payment form. Please refresh and try again.';
        document.getElementById('square-payment-error').style.display = 'block';
      }
    });
    
    // Cancel button
    document.getElementById('square-pay-cancel').addEventListener('click', () => {
      modal.remove();
      if (squareCard) {
        squareCard.destroy();
        squareCard = null;
      }
    });
    
    // Submit button
    document.getElementById('square-pay-submit').addEventListener('click', async () => {
      const submitBtn = document.getElementById('square-pay-submit');
      const errorDiv = document.getElementById('square-payment-error');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';
      errorDiv.style.display = 'none';
      
      try {
        const token = await createSquarePaymentToken();
        modal.remove();
        await processSquarePayment(token);
      } catch (error) {
        errorDiv.textContent = error.message || 'Payment failed. Please check your card details.';
        errorDiv.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Pay Now';
      }
    });
  }
  
  // Process Square payment with token
  // SECURITY: Uses quoteId for server-side price recalculation (prevents tampering)
  // SECURITY: Uses paymentAttemptId for stable idempotency key (prevents double charges)
  async function processSquarePayment(paymentToken) {
    const q = window.__qcQuote || {};
    const pickup = getDisplayLabel('pickup');
    const dropoff = getDisplayLabel('dropoff');
    const pickupDate = getParam("pickup_date");
    const pickupTime = getParam("pickup_time");
    const passengers = getParam("passengers") || getParam("number_of_passengers") || CONFIG.defaultPassengers;
    const firstName = getParam("first_name");
    const lastName = getParam("last_name");
    const email = getParam("email");
    const phone = getParam("phone");
    
    // SECURITY: Must use external payment server - never call Cloudflare Worker directly
    if (!CONFIG.paymentApiUrl) {
      alert('Payment server not configured. Please contact support.');
      return;
    }
    
    // SECURITY: Validate quoteId exists
    if (!q.quoteId) {
      alert('Quote calculation error. Please refresh the page.');
      return;
    }
    
    const base = CONFIG.paymentApiUrl.replace(/\/$/,'');
    
    // Step 1: Create payment attempt and get paymentAttemptId
    const createPayload = {
      client: (window.CFG && (window.CFG.client || window.CFG.CLIENT)) || 'kamar-tours',
      quoteId: q.quoteId, // Server uses this to recalculate price (prevents tampering)
      pickup,
      dropoff,
      pickup_place_id: q.pickup_place_id,
      dropoff_place_id: q.dropoff_place_id,
      pickup_lat: q.pickup_lat,
      pickup_lng: q.pickup_lng,
      dropoff_lat: q.dropoff_lat,
      dropoff_lng: q.dropoff_lng,
      passengers: q.passengers || passengers,
      roundTrip: q.isRoundTrip || q.roundTrip || false,
      customerInfo: { firstName: firstName, lastName: lastName, email, phone },
      quoteData: {
        distance: q.miles,
        duration: q.seconds,
        quoteTimestamp: q.quoteTimestamp
      },
      paymentProcessor: 'square'
    };
    
    console.log('[quote-calc] Creating payment attempt with quoteId:', q.quoteId);
    
    try {
      // Create payment attempt
      const createResponse = await fetch(`${base}/api/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createPayload)
      });
      
      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create payment attempt');
      }
      
      const createResult = await createResponse.json();
      
      // Server must return paymentAttemptId for stable idempotency
      if (!createResult.paymentAttemptId) {
        throw new Error('Server did not return paymentAttemptId');
      }
      
      const paymentAttemptId = createResult.paymentAttemptId;
      console.log('[quote-calc] Payment attempt ID:', paymentAttemptId, '- Using as stable idempotency key');
      
      // Step 2: Submit payment token with paymentAttemptId
      // Normalize: use sourceId (Square's field name), ignore paymentToken
      const submitPayload = {
        ...createPayload,
        paymentAttemptId: paymentAttemptId, // Stable idempotency key - same for retries
        sourceId: paymentToken // Normalized field name - Square uses sourceId
      };
      
      const submitEndpoint = `${base}/api/payment/square/create`;
      
      console.log('[quote-calc] Submitting payment token with paymentAttemptId:', paymentAttemptId);
      
      const submitResponse = await fetch(submitEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitPayload)
      });
      
      if (!submitResponse.ok) {
        const errorData = await submitResponse.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Payment failed');
      }
      
      const submitResult = await submitResponse.json();
      
      // Handle success - redirect to success page or show success message
      if (submitResult.redirectUrl) {
        window.location.href = submitResult.redirectUrl;
      } else if (submitResult.success) {
        alert('Payment successful! You will receive a confirmation email shortly.');
        if (submitResult.successUrl) {
          window.location.href = submitResult.successUrl;
        }
      } else {
        throw new Error('Unexpected response from payment server');
      }
    } catch (error) {
      console.error('[quote-calc] Square payment error:', error);
      alert('Payment failed: ' + (error.message || 'Unknown error'));
    }
  }

  /* ===== 8) Button Handlers =========================================== */
  window.handlePayNow = function() {
    // Get current trip details (labels only – no routing identifiers shown to user)
    const pickup = getDisplayLabel('pickup');
    const dropoff = getDisplayLabel('dropoff');
    const pickupDate = getParam("pickup_date");
    const pickupTime = getParam("pickup_time");
    const passengers = getParam("passengers") || getParam("number_of_passengers") || CONFIG.defaultPassengers;
    const firstName = getParam("first_name");
    const lastName = getParam("last_name");
    const email = getParam("email");
    const phone = getParam("phone");

    // Detect payment gateway
    const paymentGateway = CONFIG.paymentGateway 
      || window.CFG?.core_config?.PAYMENT_GATEWAY?.toLowerCase()
      || 'wipay'; // Default fallback
    
    console.log('[quote-calc] Payment Gateway:', paymentGateway);
    
    // Handle Square payment flow
    if (paymentGateway === 'square') {
      showSquarePaymentModal();
      return;
    }

    // If a payment API is configured, create attempt then processor-specific session
    if (CONFIG.paymentApiUrl) {
      // PAYMENT_API_BASE = domain only (no paths)
      let PAYMENT_API_BASE;
      try {
        const u = new URL(CONFIG.paymentApiUrl);
        PAYMENT_API_BASE = u.origin;
      } catch (e) {
        PAYMENT_API_BASE = String(CONFIG.paymentApiUrl).replace(/\/+$/, '').replace(/\/.*$/, '');
      }
      const endpoints = {
        createAttempt: `${PAYMENT_API_BASE}/api/payment/create`,
        stripeCreate: `${PAYMENT_API_BASE}/api/payment/stripe/create`,
        wipayCreate: `${PAYMENT_API_BASE}/api/payment/wipay/create`,
        squareCreate: `${PAYMENT_API_BASE}/api/payment/square/create`
      };

      const proc = String(paymentGateway || '').toLowerCase();
      const q = window.__qcQuote || {};
      const feeStructure = CONFIG.paymentGatewayConfig?.fee_structure ||
                          CONFIG.paymentGatewayConfig?.transactionFeePayer ||
                          window.CFG?.core_config?.PAYMENT_GATEWAY_CONFIG?.fee_structure ||
                          window.CFG?.core_config?.PAYMENT_GATEWAY_CONFIG?.transactionFeePayer ||
                          'merchant_absorb';
      const mappedFeeStructure = feeStructure === 'absorb' ? 'merchant_absorb' :
                                feeStructure === 'customer' ? 'customer_pay' :
                                feeStructure;

      if (!q.quoteId) {
        alert('Quote calculation error. Please refresh the page.');
        return;
      }

      const payload = {
        client: (window.CFG && (window.CFG.client || window.CFG.CLIENT)) || 'kamar-tours',
        quoteId: q.quoteId,
        pickup,
        dropoff,
        pickup_place_id: q.pickup_place_id,
        dropoff_place_id: q.dropoff_place_id,
        pickup_lat: q.pickup_lat,
        pickup_lng: q.pickup_lng,
        dropoff_lat: q.dropoff_lat,
        dropoff_lng: q.dropoff_lng,
        passengers: q.passengers || passengers,
        roundTrip: q.isRoundTrip || q.roundTrip || false,
        customerInfo: { firstName: firstName, lastName: lastName, email, phone },
        quoteData: {
          distance: q.miles,
          duration: q.seconds,
          quoteTimestamp: q.quoteTimestamp
        },
        paymentProcessor: proc,
        fee_structure: mappedFeeStructure
      };

      const post = (url, body) => fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      (async () => {
        try {
          // Stripe: ONLY createAttempt -> stripeCreate. NO wipay, NO /payments/*
          if (proc === 'stripe') {
            console.log('[PAY] calling createAttempt', endpoints.createAttempt);
            const createRes = await post(endpoints.createAttempt, payload);
            if (!createRes.ok) {
              const errData = await createRes.json().catch(() => ({}));
              throw new Error(errData.error || 'Failed to create payment attempt');
            }
            const createResult = await createRes.json();
            const paymentAttemptId = createResult.paymentAttemptId;
            if (!paymentAttemptId) throw new Error('Server did not return paymentAttemptId');

            const client = payload.client;
            const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
            const stripePayload = {
              client,
              paymentAttemptId,
              successUrl: origin ? `${origin}/payment-success` : undefined,
              cancelUrl: origin ? `${origin}/payment-cancelled` : undefined
            };

            console.log('[PAY] calling stripeCreate', endpoints.stripeCreate);
            const stripeRes = await post(endpoints.stripeCreate, stripePayload);
            if (!stripeRes.ok) {
              const errData = await stripeRes.json().catch(() => ({}));
              throw new Error(errData.error || 'Stripe payment failed');
            }
            const stripeResult = await stripeRes.json();
            const redirect = stripeResult.redirectUrl || stripeResult.url || stripeResult.paymentUrl;
            if (redirect) window.location.href = redirect;
            else throw new Error('Missing redirect URL');
            return;
          }

          // WiPay/Tilopay: createAttempt -> wipayCreate only
          if (proc === 'wipay' || proc === 'tilopay') {
            console.log('[PAY] calling createAttempt', endpoints.createAttempt);
            const createRes = await post(endpoints.createAttempt, payload);
            if (!createRes.ok) {
              const errData = await createRes.json().catch(() => ({}));
              throw new Error(errData.error || 'Failed to create payment attempt');
            }
            const createResult = await createRes.json();
            const paymentAttemptId = createResult.paymentAttemptId;
            if (!paymentAttemptId) throw new Error('Server did not return paymentAttemptId');

            const client = payload.client;
            const wipayPayload = { client, paymentAttemptId, fee_structure: mappedFeeStructure };

            console.log('[PAY] calling wipayCreate', endpoints.wipayCreate);
            const wipayRes = await post(endpoints.wipayCreate, wipayPayload);
            if (!wipayRes.ok) {
              const errData = await wipayRes.json().catch(() => ({}));
              throw new Error(errData.error || 'WiPay payment failed');
            }
            const wipayResult = await wipayRes.json();
            const redirect = wipayResult.redirectUrl || wipayResult.url || wipayResult.paymentUrl;
            if (redirect) window.location.href = redirect;
            else throw new Error('Missing redirect URL');
            return;
          }

          throw new Error('Unsupported payment processor: ' + proc);
        } catch (err) {
          console.error('[quote-calc] Payment error:', err);
          alert('Payment failed: ' + (err.message || 'Unknown error'));
        }
      })();
      return;
    }

    // Build booking URL with all parameters (fallback)
    const bookingParams = new URLSearchParams();
    if (pickup) bookingParams.set('pickup_location', pickup);
    if (dropoff) bookingParams.set('dropoff_location', dropoff);
    if (pickupDate) bookingParams.set('pickup_date', pickupDate);
    if (pickupTime) bookingParams.set('pickup_time', pickupTime);
    if (passengers) bookingParams.set('passengers', passengers);
    if (firstName) bookingParams.set('first_name', firstName);
    if (lastName) bookingParams.set('last_name', lastName);
    if (email) bookingParams.set('email', email);
    if (phone) bookingParams.set('phone', phone);

    const bookingUrl = `${CONFIG.transferPaymentUrl}?${bookingParams.toString()}`;
    window.location.href = bookingUrl;
  };

  // Contact Us handler using client CONTACT_CONFIG
  window.handleContactUs = function() {
    const pickup = getParamWithDefaults("pickup_location");
    const dropoff = getParamWithDefaults("dropoff_location");
    const pax = getParam("passengers") || getParam("number_of_passengers") || (window.__qcQuote?.passengers || CONFIG.defaultPassengers || 1);
    const total = window.__qcQuote?.totalCost;

    const template = (s) => String(s || '')
      .replaceAll('{pickup}', pickup || '')
      .replaceAll('{dropoff}', dropoff || '')
      .replaceAll('{passengers}', pax || '')
      .replaceAll('{total}', (typeof total === 'number' ? `$${total}` : ''));

    const cc = CONFIG.contactConfig || {};
    
    console.log('[Contact] Contact config:', cc);
    console.log('[Contact] Config type:', cc.type);
    console.log('[Contact] WhatsApp number:', cc.whatsapp?.number);
    console.log('[Contact] Email address:', cc.email?.address);

    // Prefer WhatsApp if configured
    if (cc.type === 'whatsapp' && cc.whatsapp?.number) {
      console.log('[Contact] Using WhatsApp');
      const msg = template(cc.whatsapp.message || `Hi! I'd like to book a transfer from {pickup} to {dropoff} for {passengers} passenger(s).`);
      // Format phone number: remove all non-digits, ensure it starts with country code (no + sign in URL)
      let phoneNumber = cc.whatsapp.number.replace(/[^\d]/g, '');
      // If number doesn't start with country code, assume it needs one (but don't auto-add)
      // WhatsApp requires full international format without + sign
      const wa = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(msg)}`;
      console.log('[Contact] WhatsApp URL:', wa, 'formatted phone:', phoneNumber);
      window.open(wa, '_blank');
      return;
    }

    // Fallback to email
    if (cc.email?.address) {
      console.log('[Contact] Using Email (WhatsApp not configured or type mismatch)');
      const subject = template(cc.email.subject || 'Transfer Booking Request');
      const body = template(cc.email.message || `Hi! I'd like to book a transfer from {pickup} to {dropoff} for {passengers} passenger(s).`);
      const mailto = `mailto:${encodeURIComponent(cc.email.address)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      console.log('[Contact] Email URL:', mailto);
      window.location.href = mailto;
      return;
    }

    // Fallback to phone if available
    if (cc.phone?.number) {
      console.log('[Contact] Using Phone');
      window.location.href = `tel:${cc.phone.number}`;
      return;
    }

    // As last resort, open generic mailto
    console.warn('[Contact] No contact method configured, using generic mailto');
    window.location.href = 'mailto:';
  };