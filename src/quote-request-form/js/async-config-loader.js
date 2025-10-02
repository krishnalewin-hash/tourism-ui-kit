// Async Client Configuration Loader
// This module handles loading client-specific configurations before initializing the form

window.BookingForm = window.BookingForm || {};

// Configuration loader with built-in fallbacks
async function loadClientConfiguration() {
  console.log('[ConfigLoader] Starting configuration loading...');
  
  // If config is already complete, skip loading
  if (window.CFG?.GMAPS_KEY && window.CFG?.configLoaded) {
    console.log('[ConfigLoader] Using pre-loaded configuration');
    return window.CFG;
  }

  // Determine client from various sources
  const client = window.CFG?.client || 
                new URLSearchParams(location.search).get('client') || 
                sessionStorage.getItem('client') || 
                'tour-driver';

  // Determine base URL for configs
  const base = window.CFG?.base || 'krishnalewin-hash/tourism-ui-kit@main';

  console.log(`[ConfigLoader] Loading configuration for client: ${client}`);
  console.log(`[ConfigLoader] Base URL: ${base}`);

  try {
    // Try to load core configuration first
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
    GMAPS_KEY: window.CFG?.GMAPS_KEY || 'AIzaSyD4gsEcGYTjqAILBU0z3ZNqEwyODGymXjA', // Demo fallback
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
        window.BookingForm.CONFIG.countries = window.CFG.COUNTRIES;
        
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
    
    // Trigger form enhancement
    if (window.BookingForm.enhance) {
      window.BookingForm.enhance();
    }
    
  } catch (error) {
    console.error('[BookingForm] Configuration loading failed:', error);
    
    // Even if config fails, try to initialize with defaults
    window.BookingForm.configReady = true;
    if (window.BookingForm.enhance) {
      window.BookingForm.enhance();
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