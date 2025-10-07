/* ===== Configuration Module for Quote Form Styling =====
   Purpose: Centralized configuration management and auto-loading
   Handles: API keys, countries, timeouts, auto-config loading
================================================= */

// Global configuration object
const CONFIG = {
  googleApiKey:
    (window.CFG && (window.CFG.GMAPS_KEY || window.CFG.PLACES_API_KEY)) || '',
  region: (window.CFG && (window.CFG.REGION || window.CFG.region)) || '',
  countries: (() => {
    const c =
      (window.CFG && (window.CFG.COUNTRIES ?? window.CFG.COUNTRY)) ?? null;
    if (!c) return null;
    if (Array.isArray(c)) return c.map(x => String(x).toLowerCase());
    return [String(c).toLowerCase()];
  })(),
  geolocationTimeoutMs: 8000,
  mapsLoadTimeoutMs: 10000,
  time: { start: '00:00', end: '23:59', stepMinutes: 15, format12: true }
};

// Debug logging
console.log('[QuoteForm] window.CFG:', window.CFG);
console.log('[QuoteForm] CONFIG.googleApiKey:', CONFIG.googleApiKey ? CONFIG.googleApiKey.substring(0, 20) + '...' : 'EMPTY');
console.log('[QuoteForm] CONFIG.countries:', CONFIG.countries);

// Auto-load client config if CLIENT is specified but GMAPS_KEY is missing
(function autoLoadClientConfig() {
  if (window.CFG?.CLIENT && !window.CFG.GMAPS_KEY) {
    const client = window.CFG.CLIENT;
    const base = window.CFG.BASE || 'krishnalewin-hash/tourism-ui-kit@main';
    const configUrl = `https://cdn.jsdelivr.net/gh/${base}/clients/_build/${client}.json`;
    
    fetch(configUrl)
      .then(response => response.json())
      .then(config => {
        if (config.SHARED_CONFIG) {
          // Merge shared config into window.CFG
          window.CFG.GMAPS_KEY = config.SHARED_CONFIG.GMAPS_KEY;
          window.CFG.COUNTRIES = config.SHARED_CONFIG.COUNTRIES;
          window.CFG.REGION = config.SHARED_CONFIG.REGION || 'jm';
          console.log('[QuoteForm] Auto-loaded client config for:', client);
          
          // Reinitialize Google Maps with the loaded config
          if (window.google?.maps?.places) {
            try { 
              // Call wireAutocomplete directly (matches original)
              if (window.wireAutocomplete) {
                window.wireAutocomplete(document);
              }
            } catch(_) {}
          }
        }
      })
      .catch(error => {
        console.warn('[QuoteForm] Could not auto-load client config:', error);
      });
  }
})();

// Export configuration
window.QuoteFormConfig = window.QuoteFormConfig || {};
window.QuoteFormConfig.CONFIG = CONFIG;

export { CONFIG };