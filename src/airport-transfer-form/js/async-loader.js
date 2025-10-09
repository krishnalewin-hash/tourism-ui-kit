// Enhanced quote-request-form with async config loading
(function() {
  'use strict';

  // Check if already loaded
  if (window.BookingFormAsync) return;

  // Create async booking form namespace
  window.BookingFormAsync = {
    initialized: false,
    configLoaded: false,
    pendingInit: []
  };

  // Config loader function
  async function loadClientConfig() {
    if (window.CFG?.GMAPS_KEY) {
      console.log('[BookingForm] Using pre-loaded config');
      return window.CFG;
    }

    const client = window.CFG?.CLIENT || 'tour-driver';
    const base = window.CFG?.BASE || 'krishnalewin-hash/tourism-ui-kit@main';
    
    try {
      console.log(`[BookingForm] Loading config for client: ${client}`);
      
      // Try core config first
      let configUrl;
      if (base.startsWith('../') || base.startsWith('./') || base.startsWith('/')) {
        configUrl = `${base}/clients/${client}/core/config.json`;
      } else {
        configUrl = `https://cdn.jsdelivr.net/gh/${base}/clients/${client}/core/config.json`;
      }

      const response = await fetch(configUrl);
      if (response.ok) {
        const config = await response.json();
        
        // Merge into window.CFG
        window.CFG = { 
          ...window.CFG, 
          ...config.FORM_CONFIG,
          // Flatten for easier access
          GMAPS_KEY: config.FORM_CONFIG?.GMAPS_KEY,
          COUNTRIES: config.FORM_CONFIG?.COUNTRIES,
          PLACES: config.FORM_CONFIG?.PLACES,
          FIELD_MAPPING: config.FORM_CONFIG?.FIELD_MAPPING
        };
        
        console.log('[BookingForm] Config loaded successfully:', window.CFG);
        return window.CFG;
      }
    } catch (error) {
      console.warn('[BookingForm] Failed to load client config:', error);
    }
    
    // Fallback to defaults
    window.CFG = window.CFG || {};
    if (!window.CFG.GMAPS_KEY) {
      window.CFG.GMAPS_KEY = 'AIzaSyBdVl-cGl0fhXhhD_x5RCJxWQQyzVF0z8g'; // Demo fallback
      console.warn('[BookingForm] Using fallback API key');
    }
    
    return window.CFG;
  }

  // Initialize function
  async function initializeBookingForm() {
    if (window.BookingFormAsync.initialized) return;
    
    try {
      // Load config first
      await loadClientConfig();
      window.BookingFormAsync.configLoaded = true;
      
      // Now load the original booking form logic
      // This would import/execute the existing quote-request-form code
      console.log('[BookingForm] Initializing with config:', window.CFG);
      
      // Import existing modules (this would be the actual form code)
      // For now, just mark as initialized
      window.BookingFormAsync.initialized = true;
      
      // Execute any pending initialization callbacks
      window.BookingFormAsync.pendingInit.forEach(callback => callback());
      window.BookingFormAsync.pendingInit = [];
      
    } catch (error) {
      console.error('[BookingForm] Initialization failed:', error);
    }
  }

  // Public API for waiting for initialization
  window.BookingFormAsync.ready = function(callback) {
    if (window.BookingFormAsync.initialized) {
      callback();
    } else {
      window.BookingFormAsync.pendingInit.push(callback);
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBookingForm);
  } else {
    initializeBookingForm();
  }

})();