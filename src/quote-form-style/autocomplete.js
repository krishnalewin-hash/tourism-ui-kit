/* ===== Autocomplete Module =====
   Purpose: Google Places autocomplete with airport code enhancement and prediction prioritization
   Handles: Places API integration, airport metadata, prediction filtering and sorting
================================================= */

import { CONFIG } from './config.js';

// Maps-dependent variables
let jmBounds, AIRPORT_CODES, airportBounds;

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

function initializeMapsData() {
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
}

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
      if (sorted[i].el !== left[i]) { 
        changed = true; 
        break; 
      }
    }
    if (!changed) return;

    const frag = document.createDocumentFragment();
    sorted.forEach(s => frag.appendChild(s.el));
    container.appendChild(frag);
  }

  function attach() {
    const hook = () => {
      const containers = document.querySelectorAll('.pac-container');
      if (!containers.length) { 
        setTimeout(hook, 250); 
        return; 
      }

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
}

function initAutocomplete(callback) {
  if (!window.google?.maps?.places) {
    console.warn('[Autocomplete] Google Maps not loaded');
    return;
  }
  
  console.log('[Autocomplete] Initializing autocomplete system...');
  
  // Initialize maps data
  initializeMapsData();
  
  // Wire autocomplete for existing fields
  wireAutocomplete(document);
  
  // Retry wiring in case inputs mount after maps load (GHL async rendering)
  const start = Date.now();
  const interval = setInterval(() => {
    try { wireAutocomplete(document); } catch(_) {}
    const allWired = ['pickup_location','drop-off_location'].every(q => 
      document.querySelector(`input[data-q="${q}"]`)?.dataset.placesWired === '1'
    );
    if(allWired || Date.now() - start > 12000) { 
      clearInterval(interval); 
    }
  }, 450);
  
  // Install prediction prioritizer
  installPredictionFilterAndPriority();
  
  console.log('[Autocomplete] Autocomplete system initialized');
  
  if (callback) callback();
}

// Export autocomplete functionality
window.QuoteFormConfig = window.QuoteFormConfig || {};
window.QuoteFormConfig.initAutocomplete = initAutocomplete;
window.QuoteFormConfig.wireAutocomplete = wireAutocomplete;

export { initAutocomplete, wireAutocomplete };