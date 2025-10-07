/* ===== Autocomplete Module =====
   Purpose: Google Places autocomplete with airport code enhancement and prediction prioritization
   Handles: Places API integration, airport metadata, prediction filtering and sorting
================================================= */

import { CONFIG } from './config.js';

function normalizeSafely(el, obs) {
  if (obs) obs.disconnect();
  el.classList.remove('pac-target-input','disabled','is-disabled');
  el.removeAttribute('readonly');
  if (el.getAttribute('aria-disabled') === 'true') el.removeAttribute('aria-disabled');
  if (el.getAttribute('autocomplete') !== 'on') el.setAttribute('autocomplete','on');
  if (el.style.opacity) el.style.opacity='';
  if (obs) obs.observe(el,{attributes:true,attributeFilter:['class','readonly','aria-disabled','autocomplete','style'],attributeOldValue:true});
}

function wireAutocomplete(rootDoc) {
  if(!window.google?.maps?.places) return;
  
  // Use globally set maps data from maps-initialization module
  const jmBounds = window.jmBounds;
  const AIRPORT_CODES = window.AIRPORT_CODES || {};
  const airportBounds = window.airportBounds;
  
  const sels=['input[data-q="pickup_location"]','input[data-q="drop-off_location"]'];
  for(const sel of sels) {
    const el=rootDoc.querySelector(sel);
    if(!el || el.dataset.placesWired==='1') continue;
    
    // Skip if hidden/invisible (drop-off is hidden on this page)
    const cs = el.ownerDocument.defaultView.getComputedStyle(el);
    if (el.type === 'hidden' || cs.display === 'none' || cs.visibility === 'hidden') continue;
  
    el.dataset.placesWired='1';
    let ac;
    try {
      const acOpts = {
        fields:["place_id","formatted_address","geometry","name","types"], 
        strictBounds:false, 
        types: ["establishment"]
      };
      if (jmBounds) acOpts.bounds = jmBounds;
      if (Array.isArray(CONFIG.countries) && CONFIG.countries.length > 0) {
        acOpts.componentRestrictions = { country: CONFIG.countries };
      }
      
      ac = new google.maps.places.Autocomplete(el, acOpts);
    } catch(err) { 
      console.error('[Maps] Autocomplete init failed:', err); 
      continue; 
    }

    ac.addListener('place_changed', () => {
      const place=ac.getPlace(); 
      if(!place?.place_id || !place.geometry) return;
      const isAirport=(place.types||[]).includes('airport');
      let display='';
      if(isAirport && place.name) { 
        const code = AIRPORT_CODES[place.name]; 
        display = code? `${place.name} (${code})` : place.name; 
      } else if(place.name) {
        display=place.name; 
      } else if(place.formatted_address) {
        display=place.formatted_address;
      }
      // Defer value mutation to next tick so Google can close the dropdown first.
      setTimeout(() => {
        el.value = display;
        el.setAttribute('value', display);
        el.dispatchEvent(new Event('input', { bubbles:true }));
        el.dispatchEvent(new Event('change', { bubbles:true }));
        // Force close: blur + synthetic Escape + multi-pass hide + temporary CSS rule
        try { el.blur(); } catch(_) {}
        try { el.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); } catch(_) {}
        if(!document.getElementById('pac-temp-hide')) {
          const st=document.createElement('style');
          st.id='pac-temp-hide';
          st.textContent='.pac-container{display:none !important;}';
          document.head.appendChild(st);
          setTimeout(()=>{ st.remove(); },400);
        }
        function hideAll() { 
          document.querySelectorAll('.pac-container').forEach(pc=>{ pc.style.display='none'; }); 
        }
        [0,30,80,160,300].forEach(d=> setTimeout(hideAll,d));
      },0);
    });

    el.addEventListener('focus', () => {
      if(!el.value && typeof airportBounds === 'function') {
        ac.setBounds(airportBounds());
      }
    }, { once:true });

    const obs=new MutationObserver(()=>{ normalizeSafely(el, obs); });
    normalizeSafely(el, obs);
  }  
}

function initAutocomplete(callback) {
  if (!window.google?.maps?.places) {
    console.warn('[Autocomplete] Google Maps not loaded');
    return;
  }
  
  console.log('[Autocomplete] Initializing autocomplete system...');
  
  // Maps data is initialized by maps-initialization module
  // Wire autocomplete for existing fields
  wireAutocomplete(document);
  
  console.log('[Autocomplete] Autocomplete system initialized');
  
  if (callback) callback();
}

// Export autocomplete functionality
window.QuoteFormConfig = window.QuoteFormConfig || {};
window.QuoteFormConfig.initAutocomplete = initAutocomplete;
window.QuoteFormConfig.wireAutocomplete = wireAutocomplete;

// CRITICAL: Expose wireAutocomplete globally for maps initialization module
window.wireAutocomplete = wireAutocomplete;

export { initAutocomplete, wireAutocomplete };