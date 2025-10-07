/* ===== Google Maps Loader Module =====
   Purpose: Dynamic loading of Google Maps JavaScript API with Places library
   Handles: Script injection, polling for readiness, timeout management
================================================= */

import { CONFIG } from './config.js';

function loadGoogleMaps(callback) {
  console.log('[QuoteForm] loadGoogleMaps called, API key:', CONFIG.googleApiKey ? CONFIG.googleApiKey.substring(0, 20) + '...' : 'EMPTY');
  
  if (window.google?.maps?.places) return callback();
  
  if (document.querySelector('script[data-gmaps-loader]')) {
    const poll = setInterval(() => {
      if (window.google?.maps?.places) {
        clearInterval(poll);
        callback();
      }
    }, 150);
    setTimeout(() => clearInterval(poll), CONFIG.mapsLoadTimeoutMs);
    return;
  }
  
  const s = document.createElement('script');
  const mapsUrl = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(CONFIG.googleApiKey)}&libraries=places`;
  console.log('[QuoteForm] Loading Google Maps from:', mapsUrl);
  
  s.src = mapsUrl;
  s.async = true;
  s.defer = true;
  s.setAttribute('data-gmaps-loader', '1');
  s.onerror = () => console.error('[Maps] Failed to load Google Maps JS');
  s.onload = () => console.log('[Maps] Google Maps script loaded successfully');
  
  document.head.appendChild(s);
  
  const poll = setInterval(() => {
    if (window.google?.maps?.places) {
      clearInterval(poll);
      callback();
    }
  }, 150);
  setTimeout(() => clearInterval(poll), CONFIG.mapsLoadTimeoutMs);
}

// Export the loader
window.QuoteFormConfig = window.QuoteFormConfig || {};
window.QuoteFormConfig.loadGoogleMaps = loadGoogleMaps;

export { loadGoogleMaps };