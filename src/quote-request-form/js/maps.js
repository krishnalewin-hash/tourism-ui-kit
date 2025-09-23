// Section 10: Maps Initialization + Airport Data + Retry + Prediction Prioritizer from temp.js

// Global namespace for booking form
window.BookingForm = window.BookingForm || {};

// Section 3: Google Maps Loader (dynamic include + readiness poll)
function loadGoogleMaps(callback){
  if (window.google?.maps?.places) return callback();
  if (document.querySelector('script[data-gmaps-loader]')){
    const poll = setInterval(()=>{ if (window.google?.maps?.places){ clearInterval(poll); callback(); } },150);
    setTimeout(()=>clearInterval(poll), window.BookingForm.CONFIG.mapsLoadTimeoutMs);
    return;
  }
  const s = document.createElement('script');
  s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(window.BookingForm.CONFIG.googleApiKey)}&libraries=places`;
  s.async = true; s.defer = true; s.setAttribute('data-gmaps-loader','1');
  s.onerror = () => console.error('[Maps] Failed to load Google Maps JS');
  document.head.appendChild(s);
  const poll = setInterval(()=>{ if (window.google?.maps?.places){ clearInterval(poll); callback(); } },150);
  setTimeout(()=>clearInterval(poll), window.BookingForm.CONFIG.mapsLoadTimeoutMs);
}

// Section 10: Maps Initialization + PAC Filter + Prediction Prioritizer
window.BookingForm.initMapsAndFilters = function() {
  loadGoogleMaps(() => {
    // Build a bias function from config (rectangle OR circle). No geolocation used.
    const biasBoundsFn = (() => {
      const g = google.maps;

      if (window.BookingForm.CONFIG.places.boundsRect) {
        const { sw, ne } = window.BookingForm.CONFIG.places.boundsRect;
        const rect = new g.LatLngBounds(new g.LatLng(sw.lat, sw.lng), new g.LatLng(ne.lat, ne.lng));
        return () => rect;
      }
      if (window.BookingForm.CONFIG.places.biasCircle && Number(window.BookingForm.CONFIG.places.biasCircle.radiusMeters) > 0) {
        const { lat, lng, radiusMeters } = window.BookingForm.CONFIG.places.biasCircle;
        return () => {
          const circle = new g.Circle({
            center: new g.LatLng(lat, lng),
            radius: Number(radiusMeters)
          });
          return circle.getBounds();
        };
      }
      return () => null; // no bias
    })();

    // Set the bias bounds function in autocomplete module (if available)
    if (window.BookingForm.setBiasBoundsFn) {
      window.BookingForm.setBiasBoundsFn(biasBoundsFn);
    }

    // Wire autocomplete (if available)
    if (window.BookingForm.wireAutocomplete) {
      window.BookingForm.wireAutocomplete(document);
    }

    // Retry wiring in case inputs mount after maps load
    (function retryWireAutocomplete(){
      const start = Date.now();
      const intv = setInterval(() => {
        try { 
          if (window.BookingForm.wireAutocomplete) {
            window.BookingForm.wireAutocomplete(document); 
          }
        } catch(_) {}
        const allWired = ['pickup_location','drop-off_location']
          .every(q => document.querySelector(`input[data-q="${q}"]`)?.dataset.placesWired === '1');
        if (allWired || Date.now() - start > 12000) clearInterval(intv);
      }, 450);
    })();
    
    // PAC Filter (hide vague localities/cities)
    (function installPacFilter(){
      if (window.__pacFilterObserver) return;

      const F = window.BookingForm.CONFIG.places.filter || {};
      const airports = (window.BookingForm.CONFIG.places.priorityKeywords?.airport || []).map(s => s.toLowerCase());
      const hotels   = (window.BookingForm.CONFIG.places.priorityKeywords?.hotel   || []).map(s => s.toLowerCase());
      const allowKw  = new Set([...airports, ...hotels, ...(F.allowKeywords || [])]);

      const hasStreetNumber = txt => /\d/.test(txt); // simple and effective
      const hasAllowKeyword = txt => {
        const t = txt.toLowerCase();
        for (const k of allowKw) if (k && t.includes(k)) return true;
        return false;
      };

      function shouldKeep(text){
        // Allow specific addresses or keyword-matching POIs (airports/hotels/etc.)
        if (F.addressMustHaveNumber && hasStreetNumber(text)) return true;
        if (hasAllowKeyword(text)) return true;
        return false;
      }

      function process(container){
        const items = Array.from(container.querySelectorAll('.pac-item'));
        if (!items.length) return;

        // Decide which items to keep by text
        const keep = items.filter(el => shouldKeep(el.textContent || ''));

        // Fail-open: if filtering would wipe out or reduce below minKeep, do nothing.
        const minKeep = Number.isFinite(F.minKeep) ? F.minKeep : 2;
        if (keep.length === 0 || keep.length < minKeep) return;

        // Remove the rest
        const setKeep = new Set(keep);
        items.forEach(el => { if (!setKeep.has(el)) el.remove(); });
      }

      function attach(){
        // Attach to any current and future PAC containers
        document.querySelectorAll('.pac-container').forEach(c => {
          if (c.dataset.pacFilterWired === '1') return;
          const obs = new MutationObserver(() => process(c));
          obs.observe(c, { childList: true, subtree: true });
          c.dataset.pacFilterWired = '1';
        });
      }

      // Initial + focus-driven attach (helps with SPAs / late mounts)
      const hook = () => {
        attach();
        document.addEventListener('focusin', e => {
          if (e.target?.matches?.('input[data-q="pickup_location"], input[data-q="drop-off_location"]')) {
            setTimeout(attach, 0);
          }
        });
      };

      hook();
      window.__pacFilterObserver = true;
    })();

    // Optional re-ranking if you provided PRIORITY_KEYWORDS
    (function installPredictionPriority(){
      if (!window.BookingForm.CONFIG.places.priorityKeywords || window.__predPriorityObserver) return;

      const airports = (window.BookingForm.CONFIG.places.priorityKeywords.airport || []).map(s=>s.toLowerCase());
      const hotels   = (window.BookingForm.CONFIG.places.priorityKeywords.hotel   || []).map(s=>s.toLowerCase());
      const score = (text) => {
        const t = (text || '').toLowerCase();
        if (airports.some(k => t.includes(k))) return 3;
        if (hotels.some(k   => t.includes(k))) return 2;
        return 1;
      };

      function promote(c){
        const items = [...c.querySelectorAll('.pac-item')];
        if (items.length < 2) return;
        const ranked = items.map((el,i)=>({el,i,s:score(el.textContent)}))
                            .sort((a,b)=> (b.s-a.s) || (a.i-b.i));
        let changed = ranked.some((r, i) => r.el !== items[i]);
        if (!changed) return;
        const frag = document.createDocumentFragment();
        ranked.forEach(r => frag.appendChild(r.el));
        c.appendChild(frag);
      }

      const attach = () => {
        const c = document.querySelector('.pac-container');
        if (!c){ setTimeout(attach, 250); return; }
        const obs = new MutationObserver(() => promote(c));
        obs.observe(c, { childList:true, subtree:false });
        window.__predPriorityObserver = obs;
      };
      attach();
    })();
  });
};

// Debug helper: window.__tpFix() to reposition time popover manually
window.__tpFix = function(){
  const p=document.getElementById('pickup-time-popover');
  const i=document.querySelector('input[data-q="pickup_time"]');
  if(!p||!i) return 'missing element';
  const r=i.getBoundingClientRect();
  Object.assign(p.style,{top:(window.scrollY+r.bottom+4)+'px', left:(window.scrollX+r.left)+'px'});
  return 'repositioned';
};

// Expose loadGoogleMaps function for backwards compatibility
window.BookingForm.loadGoogleMaps = loadGoogleMaps;