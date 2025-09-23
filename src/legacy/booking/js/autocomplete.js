// Google Places Autocomplete + Airport Code Normalization (Section 6)

// Global namespace for booking form
window.BookingForm = window.BookingForm || {};

// Section 6 implementation from temp.js
function normalizeSafely(el, obs){
  if (obs) obs.disconnect();
  el.classList.remove('pac-target-input','disabled','is-disabled');
  el.removeAttribute('readonly');
  if (el.getAttribute('aria-disabled') === 'true') el.removeAttribute('aria-disabled');
  if (el.getAttribute('autocomplete') !== 'on') el.setAttribute('autocomplete','on');
  if (el.style.opacity) el.style.opacity='';
  if (obs) obs.observe(el,{attributes:true,attributeFilter:['class','readonly','aria-disabled','autocomplete','style'],attributeOldValue:true});
}

let biasBoundsFn = null;

function wireAutocomplete(rootDoc){
  if (!window.google?.maps?.places) return;

  const sels = ['input[data-q="pickup_location"]','input[data-q="drop-off_location"]'];

  for (const sel of sels){
    const els = [...rootDoc.querySelectorAll(sel)];
    for (const el of els){
      if (!el || el.dataset.placesWired === '1') continue;

      const cs = getComputedStyle(el);
      if (el.type === 'hidden' || cs.display === 'none' || cs.visibility === 'hidden') continue;

      el.dataset.placesWired = '1';

      const acOpts = {
        fields: window.BookingForm.CONFIG.places.fields,
        types:  window.BookingForm.getAutocompleteTypesFromConfig()
      };

      const b = biasBoundsFn?.();
      if (b) { acOpts.bounds = b; acOpts.strictBounds = true; }

      if (window.BookingForm.CONFIG.countries?.length) {
        acOpts.componentRestrictions = { country: window.BookingForm.CONFIG.countries };
      }

      let ac;
      try {
        ac = new google.maps.places.Autocomplete(el, acOpts);
      } catch (err) {
        console.error('[Maps] Autocomplete init failed:', err);
        continue;
      }

      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (!place?.place_id || !place.geometry) return;

        const isAirport = (place.types || []).includes('airport');
        const AIRPORT_CODES = window.BookingForm.CONFIG.places.airportCodes;
        let display = '';
        if (isAirport && place.name){
          const code = AIRPORT_CODES[place.name];
          display = code ? `${place.name} (${code})` : place.name;
        } else if (place.name){
          display = place.name;
        } else if (place.formatted_address){
          display = place.formatted_address;
        }

        setTimeout(() => {
          el.value = display;
          el.setAttribute('value', display);
          el.dispatchEvent(new Event('input', { bubbles:true }));
          el.dispatchEvent(new Event('change', { bubbles:true }));
          document.documentElement.classList.add('pac-hide');
          setTimeout(() => document.documentElement.classList.remove('pac-hide'), 700);
          try { el.blur(); } catch(_) {}
          try { el.dispatchEvent(new KeyboardEvent('keydown', { key:'Escape', bubbles:true })); } catch(_) {}
          (document.querySelector('input[data-q="drop-off_location"]')
            || document.querySelector('input[data-q="pickup_date"]')
            || document.querySelector('input[data-q="pickup_time"]'))?.focus();
          const hide = () => document.querySelectorAll('.pac-container').forEach(pc => pc.style.display='none');
          [0,30,80,160,300].forEach(d => setTimeout(hide, d));
        }, 0);
      });

      el.addEventListener('focus', () => {
        try { const nb = biasBoundsFn?.(); if (nb) ac.setBounds(nb); } catch(_) {}
      }, { once:true });

      let obs;
      obs = new MutationObserver(() => normalizeSafely(el, obs));
      normalizeSafely(el, obs);
    }
  }
}

// Expose wireAutocomplete function and biasBoundsFn for external setup
window.BookingForm.wireAutocomplete = wireAutocomplete;
window.BookingForm.setBiasBoundsFn = function(fn) { biasBoundsFn = fn; };