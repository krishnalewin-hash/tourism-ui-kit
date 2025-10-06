// Enhanced maps.js with dynamic config loading support
window.BookingForm = window.BookingForm || {};

// Enhanced Google Maps loader with async config support
function loadGoogleMapsWithConfig(callback) {
  // If maps already loaded, just callback
  if (window.google?.maps?.places) return callback();

  // If config not ready, wait for it
  if (!window.BookingForm.configReady && window.CFG?.DEFER_MAPS) {
    console.log('[Maps] Waiting for config to be ready...');
    window.BookingForm.onConfigReady = window.BookingForm.onConfigReady || [];
    window.BookingForm.onConfigReady.push(() => loadGoogleMapsWithConfig(callback));
    return;
  }

  // Check if script already loading
  if (document.querySelector('script[data-gmaps-loader]')) {
    const poll = setInterval(() => { 
      if (window.google?.maps?.places) { 
        clearInterval(poll); 
        callback(); 
      } 
    }, 150);
    setTimeout(() => clearInterval(poll), 10000);
    return;
  }

  // Get API key from config (with fallback)
  const apiKey = window.CFG?.GMAPS_KEY || 
                 (window.BookingForm.CONFIG && window.BookingForm.CONFIG.googleApiKey) ||
                 'AIzaSyBdVl-cGl0fhXhhD_x5RCJxWQQyzVF0z8g';

  console.log('[Maps] Loading Google Maps with API key:', apiKey.substring(0, 10) + '...');

  // Create and load script
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
  script.async = true;
  script.defer = true;
  script.setAttribute('data-gmaps-loader', '1');
  script.onload = () => console.log('[Maps] Google Maps loaded successfully');
  script.onerror = () => console.error('[Maps] Failed to load Google Maps JS');
  document.head.appendChild(script);

  // Poll for readiness
  const poll = setInterval(() => { 
    if (window.google?.maps?.places) { 
      clearInterval(poll); 
      callback(); 
    } 
  }, 150);
  setTimeout(() => clearInterval(poll), 10000);
}

// Export enhanced loader
window.BookingForm.loadGoogleMapsWithConfig = loadGoogleMapsWithConfig;