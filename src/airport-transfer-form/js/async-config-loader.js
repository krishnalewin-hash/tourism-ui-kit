// Async Client Configuration Loader
// This module handles loading client-specific configurations before initializing the form

window.BookingForm = window.BookingForm || {};

function capturePageDefaults() {
  try {
    const scripts = document.querySelectorAll('script[data-default-pickup], script[data-default-pickup-place-id], script[data-default-dropoff], script[data-default-dropoff-place-id]');
    const current = document.currentScript || (scripts.length ? scripts[scripts.length - 1] : null);
    if (!current || !current.dataset) return;

    window.CFG = window.CFG || {};
    window.CFG.PAGE_DEFAULTS = window.CFG.PAGE_DEFAULTS || {};

    const store = window.CFG.PAGE_DEFAULTS;
    const ds = current.dataset;

    if (ds.defaultPickup && !store.defaultPickup) {
      store.defaultPickup = ds.defaultPickup;
    }
    if (ds.defaultPickupPlaceId && !store.defaultPickupPlaceId) {
      store.defaultPickupPlaceId = ds.defaultPickupPlaceId;
    }
    if (ds.defaultDropoff && !store.defaultDropoff) {
      store.defaultDropoff = ds.defaultDropoff;
    }
    if (ds.defaultDropoffPlaceId && !store.defaultDropoffPlaceId) {
      store.defaultDropoffPlaceId = ds.defaultDropoffPlaceId;
    }
  } catch (err) {
    console.warn('[ConfigLoader] Failed to capture page defaults', err);
  }
}

capturePageDefaults();

// Configuration loader with built-in fallbacks
async function loadClientConfiguration() {
  console.log('[ConfigLoader] Starting configuration loading...');
  
  // If config is already complete, skip loading
  if (window.CFG?.GMAPS_KEY && window.CFG?.configLoaded) {
    console.log('[ConfigLoader] Using pre-loaded configuration');
    return window.CFG;
  }

  // Determine client from various sources (support both CLIENT and client)
  const client = window.CFG?.CLIENT || 
    window.CFG?.client ||
    new URLSearchParams(location.search).get('client') || 
    sessionStorage.getItem('client') || 
    'demo';

  // Determine API base URL
  const DEFAULT_API_BASE = 'https://tourism-api-production.krishna-0a3.workers.dev';
  
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
      if (value && typeof value === 'string' && value.trim()) {
        try {
          const url = new URL(value.trim());
          return url.origin;
        } catch (_) {
          // Invalid URL, try next
        }
      }
    }

    try {
      const currentScript = document.currentScript || Array.from(document.getElementsByTagName('script')).pop();
      if (currentScript?.src) {
        const url = new URL(currentScript.src, window.location.href);
        return url.origin;
      }
    } catch (_) {
      // Ignore
    }

    return DEFAULT_API_BASE;
  }

  const apiBase = resolveApiBase();
  console.log(`[ConfigLoader] Loading configuration for client: ${client}`);
  console.log(`[ConfigLoader] API Base: ${apiBase}`);

  // Try API endpoint first (gets live config from database)
  try {
    const apiUrl = `${apiBase.replace(/\/$/, '')}/api/client-config/${encodeURIComponent(client)}`;
    console.log(`[ConfigLoader] Fetching via API: ${apiUrl}`);
    
    const apiResponse = await fetch(apiUrl, { cache: 'no-store' });
    if (apiResponse.ok) {
      const clientConfig = await apiResponse.json();
      const formConfig = clientConfig.FORM_CONFIG || {};
      
      window.CFG = {
        ...window.CFG,
        ...formConfig,
        GMAPS_KEY: formConfig.GMAPS_KEY || formConfig.PLACES_API_KEY,
        COUNTRIES: formConfig.COUNTRIES || formConfig.COUNTRY ? [formConfig.COUNTRY] : null,
        CURRENCY: formConfig.CURRENCY,
        PLACES: formConfig.PLACES,
        FIELD_MAPPING: formConfig.FIELD_MAPPING,
        configLoaded: true,
        loadedFrom: 'api'
      };

      console.log(`[ConfigLoader] Successfully loaded ${client} configuration from API`);
      return window.CFG;
    } else {
      console.log(`[ConfigLoader] API returned ${apiResponse.status}: ${apiResponse.statusText}`);
    }
  } catch (error) {
    console.log(`[ConfigLoader] API fetch failed: ${error.message}`);
  }

  // Fallback: Try CDN core config
  const base = window.CFG?.BASE || 'krishnalewin-hash/tourism-ui-kit@main';
  console.log(`[ConfigLoader] Base URL: ${base}`);

  try {
    let configUrl;
    if (base.startsWith('../') || base.startsWith('./') || base.startsWith('/')) {
      configUrl = `${base}/clients/${client}/core/config.json`;
    } else {
      configUrl = `https://cdn.jsdelivr.net/gh/${base}/clients/${client}/core/config.json`;
    }

    console.log(`[ConfigLoader] Fetching: ${configUrl}`);
    
    const response = await fetch(configUrl, { cache: 'no-store' });
    if (response.ok) {
      const clientConfig = await response.json();
      
      // Merge client configuration
      window.CFG = {
        ...window.CFG,
        ...clientConfig.FORM_CONFIG,
        // Flatten commonly used properties
        GMAPS_KEY: clientConfig.FORM_CONFIG?.GMAPS_KEY,
        COUNTRIES: clientConfig.FORM_CONFIG?.COUNTRIES,
        CURRENCY: clientConfig.FORM_CONFIG?.CURRENCY,
        PLACES: clientConfig.FORM_CONFIG?.PLACES,
        FIELD_MAPPING: clientConfig.FORM_CONFIG?.FIELD_MAPPING,
        configLoaded: true,
        loadedFrom: 'core-config'
      };

      console.log(`[ConfigLoader] Successfully loaded ${client} configuration from core config`);
      return window.CFG;
    } else {
      console.log(`[ConfigLoader] Core config returned ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.log(`[ConfigLoader] Core config fetch failed: ${error.message}`);
  }

  // Fallback: Try legacy single file
  try {
    let legacyUrl;
    if (base.startsWith('../') || base.startsWith('./') || base.startsWith('/')) {
      legacyUrl = `${base}/clients/${client}.json`;
    } else {
      legacyUrl = `https://cdn.jsdelivr.net/gh/${base}/clients/${client}.json`;
    }

    console.log(`[ConfigLoader] Trying legacy config: ${legacyUrl}`);
    
    const response = await fetch(legacyUrl, { cache: 'no-store' });
    if (response.ok) {
      const clientConfig = await response.json();
      
      window.CFG = {
        ...window.CFG,
        ...clientConfig.FORM_CONFIG,
        GMAPS_KEY: clientConfig.FORM_CONFIG?.GMAPS_KEY,
        COUNTRIES: clientConfig.FORM_CONFIG?.COUNTRIES,
        CURRENCY: clientConfig.FORM_CONFIG?.CURRENCY,
        PLACES: clientConfig.FORM_CONFIG?.PLACES,
        FIELD_MAPPING: clientConfig.FORM_CONFIG?.FIELD_MAPPING,
        configLoaded: true,
        loadedFrom: 'legacy-config'
      };

      console.log(`[ConfigLoader] Successfully loaded ${client} configuration from legacy config`);
      return window.CFG;
    } else {
      console.log(`[ConfigLoader] Legacy config returned ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.log(`[ConfigLoader] Legacy config fetch failed: ${error.message}`);
  }

  // Final fallback: Use defaults with demo API key
  console.warn(`[ConfigLoader] No configuration found for ${client}, using defaults`);
  
  window.CFG = {
    ...window.CFG,
    GMAPS_KEY: window.CFG?.GMAPS_KEY || 'AIzaSyBdVl-cGl0fhXhhD_x5RCJxWQQyzVF0z8g', // Demo fallback
    COUNTRIES: window.CFG?.COUNTRIES || ['jm'],
    CURRENCY: window.CFG?.CURRENCY || 'USD',
    PLACES: {
      FIELDS: ['place_id', 'formatted_address', 'geometry', 'name', 'types'],
      TYPES: ['establishment'],
      ...(window.CFG?.PLACES || {})
    },
    configLoaded: true,
    loadedFrom: 'defaults'
  };

  return window.CFG;
}

// Initialize configuration and then start form enhancement
async function initializeBookingFormWithConfig() {
  try {
    // Load configuration first
    await loadClientConfiguration();
    
    console.log(`[BookingForm] Configuration loaded from: ${window.CFG.loadedFrom}`);
    console.log(`[BookingForm] GMAPS_KEY: ${window.CFG.GMAPS_KEY?.substring(0, 10)}...`);
    
    // Re-initialize BookingForm.CONFIG with the loaded configuration
    if (window.BookingForm.initializeConfig) {
      window.BookingForm.initializeConfig();
      console.log(`[BookingForm] BookingForm.CONFIG.googleApiKey: ${window.BookingForm.CONFIG.googleApiKey?.substring(0, 10)}...`);
    } else {
      // Fallback: directly update CONFIG if initializeConfig not available yet
      if (window.BookingForm.CONFIG) {
        window.BookingForm.CONFIG.googleApiKey = window.CFG.GMAPS_KEY;
        // Normalize countries to array format
        const countries = window.CFG.COUNTRIES || window.CFG.COUNTRY;
        if (countries) {
          const arr = Array.isArray(countries) ? countries : [countries];
          window.BookingForm.CONFIG.countries = arr.map(x => String(x).toUpperCase());
        } else {
          window.BookingForm.CONFIG.countries = null;
        }
        
        if (window.CFG.PLACES) {
          window.BookingForm.CONFIG.places = {
            ...window.BookingForm.CONFIG.places,
            fields: window.CFG.PLACES.FIELDS || window.BookingForm.CONFIG.places.fields,
            types: window.CFG.PLACES.TYPES || window.BookingForm.CONFIG.places.types,
            priorityKeywords: window.CFG.PLACES.PRIORITY_KEYWORDS || window.BookingForm.CONFIG.places.priorityKeywords
          };
        }
        console.log(`[BookingForm] Directly updated CONFIG.googleApiKey: ${window.BookingForm.CONFIG.googleApiKey?.substring(0, 10)}...`);
      }
    }
    
    // Signal that configuration is ready
    window.BookingForm.configReady = true;
    
    // Re-initialize BookingForm.CONFIG with the loaded configuration
    if (window.BookingForm.initializeConfig) {
      window.BookingForm.initializeConfig();
      console.log(`[BookingForm] Re-initialized CONFIG with API key: ${window.BookingForm.CONFIG.googleApiKey?.substring(0, 10)}...`);
    }
    
    // Execute any pending initialization callbacks
    if (window.BookingForm.onConfigReady) {
      window.BookingForm.onConfigReady.forEach(callback => callback());
      window.BookingForm.onConfigReady = [];
    }
    
    // Inject baseline styles first (critical for form appearance)
    if (window.BookingForm.initNow) {
      window.BookingForm.initNow();
    } else if (window.BookingForm.injectBaselineStyles) {
      window.BookingForm.injectBaselineStyles();
    }
    
    // Trigger form enhancement
    if (window.BookingForm.enhance) {
      window.BookingForm.enhance();
    } else {
      // Fallback: manually trigger enhancement if enhance function not available
      console.warn('[BookingForm] enhance() not available, trying manual initialization');
      if (window.BookingForm.attachPickupDateGuard) window.BookingForm.attachPickupDateGuard(document);
      if (window.BookingForm.attachPickupTimePicker) window.BookingForm.attachPickupTimePicker(document);
      if (window.BookingForm.enhanceVisual) window.BookingForm.enhanceVisual(document);
      if (window.BookingForm.initMapsAndFilters) window.BookingForm.initMapsAndFilters();
      if (window.BookingForm.wireAutocomplete) window.BookingForm.wireAutocomplete(document);
      if (window.BookingForm.observeLateFields) window.BookingForm.observeLateFields();
    }
    
  } catch (error) {
    console.error('[BookingForm] Configuration loading failed:', error);
    
    // Even if config fails, try to initialize with defaults
    window.BookingForm.configReady = true;
    
    // Inject baseline styles even on failure
    if (window.BookingForm.initNow) {
      window.BookingForm.initNow();
    } else if (window.BookingForm.injectBaselineStyles) {
      window.BookingForm.injectBaselineStyles();
    }
    
    if (window.BookingForm.enhance) {
      window.BookingForm.enhance();
    } else {
      // Fallback: manually trigger enhancement if enhance function not available
      console.warn('[BookingForm] enhance() not available, trying manual initialization');
      if (window.BookingForm.attachPickupDateGuard) window.BookingForm.attachPickupDateGuard(document);
      if (window.BookingForm.attachPickupTimePicker) window.BookingForm.attachPickupTimePicker(document);
      if (window.BookingForm.enhanceVisual) window.BookingForm.enhanceVisual(document);
      if (window.BookingForm.initMapsAndFilters) window.BookingForm.initMapsAndFilters();
      if (window.BookingForm.wireAutocomplete) window.BookingForm.wireAutocomplete(document);
      if (window.BookingForm.observeLateFields) window.BookingForm.observeLateFields();
    }
  }
}

// Export the initializer
window.BookingForm.initializeWithConfig = initializeBookingFormWithConfig;
window.BookingForm.loadClientConfiguration = loadClientConfiguration;

// Auto-initialize when DOM is ready (but wait for config)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeBookingFormWithConfig);
} else {
  // DOM already loaded, initialize immediately
  initializeBookingFormWithConfig();
}