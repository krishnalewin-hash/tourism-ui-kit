/* ===== Maps Initialization Module =====
   Purpose: Section 10 from original - Maps initialization, airport data, bounds, and prediction prioritizer
   Dependencies: maps-loader.js, autocomplete.js
   Usage: Called after Google Maps API is loaded
============================================= */

// Module-level variables (matches original Section 10)
let jmBounds = null;
let AIRPORT_CODES = {};
let airportBounds = undefined;

/* ===== Initialize Maps Data & Bounds =====
   Purpose: Set up geographic bounds and airport metadata based on CONFIG
   Called by: loadGoogleMaps callback
============================================= */
function initializeMapsData() {
  const CONFIG = window.CFG || window.CONFIG || {};
  
  const wantsJM = 
    (Array.isArray(CONFIG.countries) && CONFIG.countries.includes('jm')) ||
    (CONFIG.region?.toLowerCase?.() === 'jm');
    
  if (wantsJM) {
    // Jamaica bounds (broad) + airport specifics
    jmBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(17.5, -78.8),
      new google.maps.LatLng(18.8, -76.0)
    );
    
    const AIRPORTS = [
      { name: 'Sangster International Airport', lat: 18.5037, lng: -77.9130 },
      { name: 'Norman Manley International Airport', lat: 17.9371, lng: -76.7775 },
      { name: 'Ian Fleming International Airport', lat: 18.4042, lng: -76.9697 },
      { name: 'Negril Aerodrome', lat: 18.3416, lng: -78.3390 },
      { name: 'Tinson Pen Aerodrome', lat: 17.9910, lng: -76.8180 }
    ];
    
    AIRPORT_CODES = {
      'Sangster International Airport': 'MBJ',
      'Norman Manley International Airport': 'KIN',
      'Ian Fleming International Airport': 'OCJ',
      'Negril Aerodrome': 'NEG',
      'Tinson Pen Aerodrome': 'KTP'
    };
    
    airportBounds = function () {
      const b = new google.maps.LatLngBounds();
      AIRPORTS.forEach(a => b.extend(new google.maps.LatLng(a.lat, a.lng)));
      return b;
    };
  } else {
    jmBounds = null;
    AIRPORT_CODES = {};
    airportBounds = undefined;
  }
  
  // Expose globally for other modules (matches original)
  window.jmBounds = jmBounds;
  window.AIRPORT_CODES = AIRPORT_CODES;
  window.airportBounds = airportBounds;
  
  console.log('[MapsInit] Geographic bounds and airport data initialized:', { wantsJM, airportCount: Object.keys(AIRPORT_CODES).length });
}

/* ===== Prediction Prioritizer =====
   Purpose: Filter and prioritize Google Places autocomplete results
   Behavior: airports > hotels > addresses with numbers, filter out vague areas
=========================================== */
function installPredictionFilterAndPriority() {
  if (window.__pacFilterObserver) return;

  const airportKeywords = ['airport','international airport','mbj','kin','ocj','neg','ktp','terminal','sangster','norman manley','ian fleming','negril aerodrome','tinson pen'];
  const hotelKeywords   = ['hotel','resort','inn','villa','guest house','guesthouse','lodgings','spa','apartments','suite','suites','bnb','bed & breakfast','bed and breakfast','all-inclusive','marriott','hilton','hyatt','riu','sandals','iberostar','half moon','secrets','royalton'];

  function score(text) {
    const t = text.toLowerCase();
    if (airportKeywords.some(k => t.includes(k))) return 3;
    if (hotelKeywords.some(k => t.includes(k)))   return 2;
    return 1; // addresses (with numbers) fall here; still allowed
  }

  // allow only: addresses (has a number) OR airport/hotel keywords
  function isSpecificEnough(text) {
    const t = text.toLowerCase();
    const hasNumber = /\d/.test(t);
    const isAirport = airportKeywords.some(k => t.includes(k));
    const isHotel   = hotelKeywords.some(k => t.includes(k));
    return hasNumber || isAirport || isHotel;
  }

  function process(container) {
    const items = [...container.querySelectorAll('.pac-item')];
    if (!items.length) return;

    items.forEach(el => {
      const txt = (el.textContent || '').trim();
      if (!isSpecificEnough(txt)) el.remove(); // drop "Montego Bay"-type areas
    });

    const left = [...container.querySelectorAll('.pac-item')];
    if (left.length < 2) return;

    const scored = left.map((el, i) => ({ el, i, s: score(el.textContent || '') }));
    const sorted = scored.sort((a, b) => (b.s - a.s) || (a.i - b.i));

    let changed = false;
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].el !== left[i]) { changed = true; break; }
    }
    if (!changed) return;

    const frag = document.createDocumentFragment();
    sorted.forEach(s => frag.appendChild(s.el));
    container.appendChild(frag);
  }

  function attach() {
    const hook = () => {
      const containers = document.querySelectorAll('.pac-container');
      if (!containers.length) { setTimeout(hook, 250); return; }

      containers.forEach(c => {
        if (c.dataset.pacWatched === '1') return;   // avoid duplicate observers
        const obs = new MutationObserver(() => process(c));
        obs.observe(c, { childList: true, subtree: true });
        c.dataset.pacWatched = '1';
      });

      window.__pacFilterObserver = true;
    };
    hook();
  }

  attach();
  console.log('[MapsInit] Prediction filter and prioritizer installed');
}

/* ===== Autocomplete Retry Logic =====
   Purpose: Retry wiring autocomplete in case inputs mount after maps load (GHL async rendering)
   Matches: Original retryWireAutocomplete function exactly
========================================= */
function setupAutocompleteRetry() {
  const wireAutocomplete = window.wireAutocomplete;
  if (typeof wireAutocomplete !== 'function') {
    console.warn('[MapsInit] wireAutocomplete function not found globally');
    return;
  }

  // Initial wiring
  wireAutocomplete(document);
  
  // Retry wiring (EXACT logic from original)
  (function retryWireAutocomplete() {
    const start = Date.now();
    const interval = setInterval(() => {
      try { wireAutocomplete(document); } catch(_) {}
      const allWired = ['pickup_location','drop-off_location'].every(q => 
        document.querySelector(`input[data-q="${q}"]`)?.dataset.placesWired === '1'
      );
      if (allWired || Date.now() - start > 12000) { 
        clearInterval(interval);
        console.log('[MapsInit] Autocomplete retry completed:', { allWired, elapsed: Date.now() - start });
      }
    }, 450);
  })();
}

/* ===== Debug Helper =====
   Purpose: Manual time popover repositioning helper (matches original)
========================= */
function installDebugHelper() {
  window.__tpFix = function() {
    const p = document.getElementById('pickup-time-popover');
    const i = document.querySelector('input[data-q="pickup_time"]');
    if (!p || !i) return 'missing element';
    const r = i.getBoundingClientRect();
    Object.assign(p.style, {
      top: (window.scrollY + r.bottom + 4) + 'px',
      left: (window.scrollX + r.left) + 'px'
    });
    return 'repositioned';
  };
  console.log('[MapsInit] Debug helper __tpFix() installed');
}

/* ===== Main Maps Initialization =====
   Purpose: Complete Section 10 initialization when Google Maps loads
   Called by: loadGoogleMaps callback in main.js
============================================= */
function initializeMapsFeatures() {
  if (!window.google?.maps) {
    console.warn('[MapsInit] Google Maps not available');
    return;
  }

  console.log('[MapsInit] Starting maps features initialization...');
  
  try {
    // 1. Initialize geographic bounds and airport data
    initializeMapsData();
    
    // 2. Set up autocomplete with retry logic
    setupAutocompleteRetry();
    
    // 3. Install prediction filter and prioritizer
    installPredictionFilterAndPriority();
    
    // 4. Install debug helper
    installDebugHelper();
    
    console.log('[MapsInit] All maps features initialized successfully');
    
  } catch (error) {
    console.error('[MapsInit] Maps initialization error:', error);
  }
}

// Export functions
export { 
  initializeMapsFeatures,
  initializeMapsData,
  installPredictionFilterAndPriority,
  setupAutocompleteRetry,
  installDebugHelper
};

// Export data getters
export function getJMBounds() { return jmBounds; }
export function getAirportCodes() { return AIRPORT_CODES; }
export function getAirportBounds() { return airportBounds; }