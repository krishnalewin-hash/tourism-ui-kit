// Wire Places Autocomplete + PAC filter + keyword prioritization

// Global namespace for booking form
window.BookingForm = window.BookingForm || {};

window.BookingForm.wireAutocomplete = function(root=document){
  const CONFIG = window.BookingForm.getConfig();
  const biasBoundsFn = window.BookingForm.makeBiasBoundsSupplier(CONFIG);
  
  if (!window.google?.maps?.places) return;

  const sels = ['input[data-q="pickup_location"]','input[data-q="drop-off_location"]'];
  const types = (() => {
    const ALLOWED = ['geocode','address','establishment','(regions)','(cities)'];
    const raw = CONFIG.places.types;
    if (raw === null) return undefined;
    if (raw === undefined) return ['establishment'];
    const arr = Array.isArray(raw) ? raw : [raw];
    const filtered = arr.filter(t => ALLOWED.includes(t));
    return filtered.length ? [filtered.includes('establishment') ? 'establishment' : filtered[0]] : ['establishment'];
  })();

  for (const sel of sels){
    root.querySelectorAll(sel).forEach(el=>{
      if (el.dataset.placesWired==='1') return;
      const cs=getComputedStyle(el);
      if (el.type==='hidden' || cs.display==='none' || cs.visibility==='hidden') return;

      el.dataset.placesWired='1';
      const opts = { fields: CONFIG.places.fields, types };
      const b = biasBoundsFn?.(); if (b){ opts.bounds=b; opts.strictBounds=true; }
      if (CONFIG.countries?.length) opts.componentRestrictions = { country: CONFIG.countries };
      let ac;
      try{ ac = new google.maps.places.Autocomplete(el, opts); }catch(err){ console.error('Autocomplete init failed',err); return; }

      ac.addListener('place_changed', ()=>{
        const place = ac.getPlace(); if (!place?.place_id || !place.geometry) return;
        const isAirport = (place.types||[]).includes('airport');
        const code = CONFIG.places.airportCodes[place.name];
        const display = isAirport && place.name ? (code ? `${place.name} (${code})` : place.name)
                     : place.name || place.formatted_address || el.value;
        setTimeout(()=>{
          el.value = display; el.setAttribute('value', display);
          el.dispatchEvent(new Event('input',{bubbles:true}));
          el.dispatchEvent(new Event('change',{bubbles:true}));
          try { el.blur(); } catch {}
        },0);
      });
    });
  }

  // PAC filter / prioritizer (optional)
  window.BookingForm.installPacEnhancers(CONFIG);
};

window.BookingForm.setupPredictionFilters = function(){
  const CONFIG = window.BookingForm.getConfig();
  window.BookingForm.installPacEnhancers(CONFIG);
};

window.BookingForm.installPacEnhancers = function(CONFIG){
  if (window.__pacFilterObserver) return;

  const F = CONFIG.places.filter || {};
  const airports = (CONFIG.places.priorityKeywords?.airport || []).map(s=>s.toLowerCase());
  const hotels   = (CONFIG.places.priorityKeywords?.hotel   || []).map(s=>s.toLowerCase());
  const allowKw  = new Set([...airports, ...hotels, ...(F.allowKeywords || [])]);

  const hasNum = txt => /\d/.test(txt);
  const hasKw  = txt => { const t=(txt||'').toLowerCase(); for (const k of allowKw) if (k && t.includes(k)) return true; return false; };

  function shouldKeep(text){
    if (F.addressMustHaveNumber && hasNum(text)) return true;
    if (hasKw(text)) return true;
    return false;
  }

  function process(c){
    const items = Array.from(c.querySelectorAll('.pac-item'));
    if (!items.length) return;
    const keep = items.filter(el => shouldKeep(el.textContent||''));
    const minKeep = Number.isFinite(F.minKeep) ? F.minKeep : 2;
    if (keep.length === 0 || keep.length < minKeep) return;
    const setKeep = new Set(keep);
    items.forEach(el=>{ if(!setKeep.has(el)) el.remove(); });
  }

  function attach(){
    document.querySelectorAll('.pac-container').forEach(c=>{
      if (c.dataset.pacFilterWired==='1') return;
      const obs = new MutationObserver(()=>process(c));
      obs.observe(c,{childList:true, subtree:true});
      c.dataset.pacFilterWired='1';
    });
  }

  attach();
  document.addEventListener('focusin', e=>{
    if (e.target?.matches?.('input[data-q="pickup_location"], input[data-q="drop-off_location"]')) {
      setTimeout(attach, 0);
    }
  });

  window.__pacFilterObserver = true;
};