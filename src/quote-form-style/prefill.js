/* ===== Prefill Module =====
   Purpose: Auto-populate form fields from configuration, URL parameters, or page context
   Handles: Basic text prefill, Maps-based Place ID/lat-lng resolution, hidden field auto-fill
================================================= */

// Utility function to set input values and trigger events
function setInputValue(el, val) {
  el.value = val;
  el.setAttribute('value', val);
  el.dispatchEvent(new Event('input', { bubbles:true }));
  el.dispatchEvent(new Event('change', { bubbles:true }));
}

// Plain-text prefill: runs even before Maps is loaded
function applyPrefillBasic(rootDoc) {
  const cfg = window.CFG?.PREFILL;
  if(!cfg) return;
  
  const pairs = [
    ['pickup_location', 'input[data-q="pickup_location"]'],
    // ['drop_off_location','input[data-q="drop-off_location"]'], // optional: enable if you want
  ];
  
  for(const [key, sel] of pairs) {
    const pre = cfg[key];
    if(!pre || typeof pre === 'object') continue;         // only handle strings here
    const el = rootDoc.querySelector(sel);
    if(!el || el.dataset.prefilled === '1') continue;
    el.dataset.prefilled = '1';
    setInputValue(el, String(pre));
  }
}

// Maps-based prefill: Place ID or lat/lng (requires Google Maps JS loaded)
function applyPrefillMaps(rootDoc) {
  if(!window.google?.maps) return;
  const cfg = window.CFG?.PREFILL;
  if(!cfg) return;

  const doOne = (key, sel) => {
    const pre = cfg[key];
    if(!pre || typeof pre !== 'object') return;
    const el = rootDoc.querySelector(sel);
    if(!el || el.dataset.prefilled === '1') return;

    const finish = (text) => {
      if(!text) return;
      el.dataset.prefilled = '1';
      setInputValue(el, text);
    };

    // Case A: Place ID
    if(pre.placeId) {
      const svc = new google.maps.places.PlacesService(document.createElement('div'));
      svc.getDetails({ placeId: pre.placeId, fields: ['name','formatted_address','types'] }, (place, status) => {
        if(status === google.maps.places.PlacesServiceStatus.OK && place) {
          // Prefer name; fall back to formatted address
          finish(place.name || place.formatted_address || '');
        }
      });
      return;
    }

    // Case B: lat/lng
    if(typeof pre.lat === 'number' && typeof pre.lng === 'number') {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat: pre.lat, lng: pre.lng } }, (results, status) => {
        if(status === 'OK' && results?.[0]) {
          finish(results[0].formatted_address);
        }
      });
    }
  };

  doOne('pickup_location', 'input[data-q="pickup_location"]');
  // doOne('drop_off_location', 'input[data-q="drop-off_location"]'); // optional
}

// Get best title from page metadata
function getBestTitle() {
  const raw =
    document.querySelector('meta[property="og:title"]')?.content ||
    document.title ||
    '';
  // Trim off common site-title delimiters: "Hotel Foo | Brand", "Hotel Foo – Brand"
  const parts = raw.split(/ [|\-–•>]+ /); // simple heuristic; keeps the left-most
  let t = (parts[0] || raw || '').trim();
  if (!t) {
    const h1 = document.querySelector('h1');
    t = h1 ? h1.textContent.trim() : '';
  }
  // Collapse whitespace & remove trailing punctuation
  t = t.replace(/\s+/g, ' ').replace(/[|–\-•]+$/,'').trim();
  return t;
}

// Auto-fill hidden drop-off field with page title
function autofillHiddenDropOff(rootDoc) {
  const el = (rootDoc || document).querySelector('input[data-q="drop-off_location"]');
  if (!el) return;
  if (el.dataset.dropAutoFilled === '1') return;

  // Only set if empty (don't overwrite anything user/system already put in)
  const current = (el.value || '').trim();
  if (current) { 
    el.dataset.dropAutoFilled = '1'; 
    return; 
  }

  const title = getBestTitle();
  if (!title) return;

  // Ensure it's hidden if that's your intent (won't hurt if already hidden)
  try { 
    if (el.type !== 'hidden') el.type = 'hidden'; 
  } catch(_) {}

  setInputValue(el, title);
  el.dataset.dropAutoFilled = '1';
}

// Watch for title changes and re-apply auto-fill
function watchTitleChanges() {
  let last = document.title;
  setInterval(() => {
    if (document.title !== last) {
      last = document.title;
      // Allow re-fill if it was never filled (don't override if already set)
      const el = document.querySelector('input[data-q="drop-off_location"]');
      if (el && !(el.value || '').trim()) {
        el.dataset.dropAutoFilled = ''; // allow another try
        autofillHiddenDropOff(document);
      }
    }
  }, 1000);
}

// Initialize prefill system
function initPrefill(rootDoc) {
  if(!rootDoc) rootDoc = document;
  
  console.log('[Prefill] Initializing prefill system...');
  
  // Apply basic prefill immediately
  applyPrefillBasic(rootDoc);
  
  // Apply hidden drop-off auto-fill
  autofillHiddenDropOff(rootDoc);
  
  // Watch for title changes
  watchTitleChanges();
  
  // Apply Maps-based prefill if Maps is available
  if(window.google?.maps) {
    applyPrefillMaps(rootDoc);
  }
  
  console.log('[Prefill] Prefill system initialized');
}

// Export prefill functionality
window.QuoteFormConfig = window.QuoteFormConfig || {};
window.QuoteFormConfig.initPrefill = initPrefill;
window.QuoteFormConfig.applyPrefillBasic = applyPrefillBasic;
window.QuoteFormConfig.applyPrefillMaps = applyPrefillMaps;
window.QuoteFormConfig.autofillHiddenDropOff = autofillHiddenDropOff;

export { initPrefill, applyPrefillBasic, applyPrefillMaps, autofillHiddenDropOff };