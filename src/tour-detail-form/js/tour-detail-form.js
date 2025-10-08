document.addEventListener('DOMContentLoaded', () => {

  /* ===== Section 1: Minimal Inline Styles (baseline field & icon styling)
    Purpose: Ensure consistent padding, icon positioning, and field box metrics.
    Safe to remove if your global stylesheet already applies equivalent styles.
  ===================================================== */
  // Minimal baseline styles (keep date stable; no layout experiments)
  (function injectMinimalStyles(){
    if(document.getElementById('booking-form-minimal-styles')) return;
  const css = `/* Core icon wrapper + input padding */\n.icon-field-wrapper{position:relative;display:block;width:100%;}\n.icon-field-wrapper .field-icon{position:absolute;left:0.55rem;top:50%;transform:translateY(-50%);display:inline-flex;align-items:center;justify-content:center;pointer-events:none;color:#777;}\n.icon-field-wrapper .field-icon svg{width:20px;height:20px;stroke:#777;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;fill:none;}\n.icon-field-wrapper > input[data-iconized='1'][data-q],.icon-field-wrapper > select[data-iconized='1'][data-q]{padding-left:2.1rem !important;}\n/* Baseline field styling (added for pickup/drop-off/time) */\ninput[data-q],input[data-q='pickup_location'],input[data-q='drop-off_location'],input[data-q='pickup_time']{display:inline-block !important;width:100% !important;min-width:200px !important;padding:10px 18px 10px 2.25rem !important;border:1px solid #ccc !important;background:#fff !important;line-height:1.4 !important;box-sizing:border-box !important;min-height:40px !important;color:#222 !important;}\ninput[data-q='pickup_date']{display:inline-block !important;width:100% !important;min-width:200px !important;padding:10px 18px 10px 2.25rem !important;border:1px solid #ccc !important;background:#fff !important;line-height:1.4 !important;box-sizing:border-box !important;min-height:40px !important;color:#222 !important;}\n/* Unified text color across all data-q inputs/selects */\ninput[data-q], select[data-q], .icon-field-wrapper input, .icon-field-wrapper select{color:#222 !important;}\n/* Larger Google Places Autocomplete dropdown (single-line) */\n.pac-container{font-size:16px !important; line-height:1.35 !important;}\n.pac-item{padding:10px 14px !important; font-size:15px !important;}\n.pac-item:hover, .pac-item.pac-item-selected{background:#266BBC !important; color:#fff !important;}\n.pac-item:hover .pac-item-query, .pac-item.pac-item-selected .pac-item-query{color:#fff !important;}\n/* Date picker popover */\n#pickup-date-popover{position:absolute;z-index:2147483646;background:#fff;border:1px solid #444;border-radius:8px;box-shadow:0 6px 22px rgba(0,0,0,.18);padding:10px 12px;width:320px !important;display:none;font:20px/1.3 system-ui,Arial,sans-serif !important;}\n#pickup-date-popover .dp-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px !important;font-weight:600;}\n#pickup-date-popover button.dp-nav{all:unset;cursor:pointer;font-size:20px !important;line-height:1;padding:4px 8px;border-radius:6px;color:#222;}\n#pickup-date-popover button.dp-nav:hover{background:#f2f2f2;}\n#pickup-date-popover .dp-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}\n#pickup-date-popover .dp-weekdays{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;font-size:12px !important;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;color:#666;text-align:center;}\n#pickup-date-popover .dp-day{width:100%;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;font-size:18px !important;cursor:pointer;border-radius:6px;user-select:none;}\n#pickup-date-popover .dp-day:hover{background:#eee;}\n#pickup-date-popover .dp-day.dp-disabled{opacity:.35;cursor:not-allowed;}\n#pickup-date-popover .dp-day.dp-today{outline:2px solid #188BF6;outline-offset:2px;}\n#pickup-date-popover .dp-day.dp-selected{background:#188BF6;color:#FFF;font-weight:600;}\n`;
    const s=document.createElement('style'); s.id='booking-form-minimal-styles'; s.textContent=css; document.head.appendChild(s);
  })();

  // Inject validation styles (error state + shake + inline message)
  (function injectValidationStyles(){
    if(document.getElementById('booking-form-validation-styles')) return;
  const css = `/* Validation visuals */\n.input-error{border-color:#e53935 !important;box-shadow:0 0 0 2px rgba(229,57,53,0.15) !important;}\n/* Wrapper may shake but shouldn't show red border */\n.icon-field-wrapper.input-error{border-radius:6px;}\n.field-error{display:block;margin-top:6px;color:#e53935;font-size:12px;line-height:1.2;border:0 !important;box-shadow:none !important;}\n@keyframes bf-shake{10%,90%{transform:translateX(-1px);}20%,80%{transform:translateX(2px);}30%,50%,70%{transform:translateX(-4px);}40%,60%{transform:translateX(4px);}}\n.shake{animation:bf-shake 400ms ease-in-out;}\n\n/* Equalize border radius for step-1 inputs (normal + error states) */\n.icon-field-wrapper .icon-input-row > input[data-q='pickup_location'],\n.icon-field-wrapper .icon-input-row > input[data-q='drop-off_location'],\n.icon-field-wrapper .icon-input-row > input[data-q='pickup_date'],\n.icon-field-wrapper .icon-input-row > input[data-q='pickup_time'],\n.icon-field-wrapper .icon-input-row > input[data-q='number_of_passengers'],\ninput[data-q='pickup_location'],\ninput[data-q='drop-off_location'],\ninput[data-q='pickup_date'],\ninput[data-q='pickup_time'],\ninput[data-q='number_of_passengers'],\ninput[data-q='pickup_location'][aria-invalid='true'],\ninput[data-q='drop-off_location'][aria-invalid='true'],\ninput[data-q='pickup_date'][aria-invalid='true'],\ninput[data-q='pickup_time'][aria-invalid='true'],\ninput[data-q='number_of_passengers'][aria-invalid='true'],\ninput[data-q='pickup_location'].input-error,\ninput[data-q='drop-off_location'].input-error,\ninput[data-q='pickup_date'].input-error,\ninput[data-q='pickup_time'].input-error,\ninput[data-q='number_of_passengers'].input-error {\n  border-radius: 4px !important;\n}\n`;
    const s=document.createElement('style'); s.id='booking-form-validation-styles'; s.textContent=css; document.head.appendChild(s);
  })();

  // Inject fade styles for step transition (out/in)
  (function injectFadeStyles(){
    if(document.getElementById('booking-form-fade-styles')) return;
    const css = `.bf-fade-anim{transition:opacity 220ms ease, transform 220ms ease; will-change: opacity, transform;}\n.bf-fade-out{opacity:0 !important; transform: translateY(-4px);}\n.bf-fade-in-init{opacity:0; transform: translateY(6px);}\n`;
    const s=document.createElement('style'); s.id='booking-form-fade-styles'; s.textContent=css; document.head.appendChild(s);
  })();

  // Ensure icon is positioned relative to the input row, not the wrapper (so messages below don't shift it)
  (function injectIconRowStyles(){
    if(document.getElementById('booking-form-iconrow-styles')) return;
  const css = `.icon-field-wrapper .icon-input-row{position:relative;}\n.icon-field-wrapper .icon-input-row > input[data-iconized='1'][data-q], .icon-field-wrapper .icon-input-row > select[data-iconized='1'][data-q]{padding-left:2.1rem !important;}`;
    const s=document.createElement('style'); s.id='booking-form-iconrow-styles'; s.textContent=css; document.head.appendChild(s);
  })();

  // Mobile NEXT button label styles (adds text next to arrow on small screens only)
  (function injectNextMobileStyles(){
    if(document.getElementById('booking-form-next-mobile-styles')) return;
  const css = `.ghl-btn.ghl-footer-next.bf-next{display:inline-flex;align-items:center;gap:8px;font-size:20px;white-space:nowrap;overflow:visible;}\n.ghl-btn.ghl-footer-next .bf-next-label{display:none !important;font-weight:500;font-size:20px;letter-spacing:.5px;}\n@media (max-width: 768px){\n  .ghl-btn.ghl-footer-next.bf-next{width:auto !important;min-width:unset !important;padding-left:14px !important;padding-right:14px !important;}\n  .ghl-btn.ghl-footer-next .bf-next-label{display:inline-block !important;}\n}\n`;
    const s=document.createElement('style'); s.id='booking-form-next-mobile-styles'; s.textContent=css; document.head.appendChild(s);
  })();

  // Submit CTA styles: text + animated white arrow
  (function injectSubmitCtaStyles(){
    if(document.getElementById('booking-form-cta-styles')) return;
    const css = `.ghl-btn.ghl-submit-btn.bf-cta{display:inline-flex;align-items:center;gap:10px;white-space:nowrap;}\n.ghl-btn.ghl-submit-btn.bf-cta .bf-cta-text{display:inline-block;}\n.ghl-btn.ghl-submit-btn.bf-cta .bf-arrow{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;transition:transform 220ms ease;will-change:transform;}\n.ghl-btn.ghl-submit-btn.bf-cta .bf-arrow svg{width:18px;height:18px;stroke:#fff;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;fill:none;}\n.ghl-btn.ghl-submit-btn.bf-cta:hover .bf-arrow, .ghl-btn.ghl-submit-btn.bf-cta:focus-visible .bf-arrow{transform:translateX(5px);}\n`;
    const s=document.createElement('style'); s.id='booking-form-cta-styles'; s.textContent=css; document.head.appendChild(s);
  })();

  /* ===== Section 2: Global Configuration
    Purpose: Centralized settings for API key, country restriction, time picker window, timeouts.
    Remove or trim properties only if the dependent feature (see comments) is removed.
  
  ===================================================== */
  
// Load client configuration if not already loaded
async function loadClientConfig() {
  if (window.CFG?.configLoaded) return window.CFG;
  
  const client = window.CFG?.client || 'demo';
  const baseUrl = `https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@main`;
  
  try {
    const response = await fetch(`${baseUrl}/clients/${client}/core/config.json`);
    if (response.ok) {
      const config = await response.json();
      window.CFG = {
        ...window.CFG,
        ...config.FORM_CONFIG,
        GMAPS_KEY: config.FORM_CONFIG?.GMAPS_KEY,
        PLACES_API_KEY: config.FORM_CONFIG?.GMAPS_KEY,
        COUNTRIES: config.FORM_CONFIG?.COUNTRIES,
        configLoaded: true
      };
      console.log(`[TourForm] Loaded config for ${client}, API key: ${window.CFG.GMAPS_KEY?.substring(0, 10)}...`);
      
      // Update CONFIG object after loading
      CONFIG.googleApiKey = window.CFG.GMAPS_KEY || '';
      CONFIG.countries = window.CFG.COUNTRIES ? (Array.isArray(window.CFG.COUNTRIES) ? window.CFG.COUNTRIES.map(x => String(x).toLowerCase()) : [String(window.CFG.COUNTRIES).toLowerCase()]) : null;
      
      return window.CFG;
    }
  } catch (error) {
    console.warn(`[TourForm] Failed to load config for ${client}:`, error);
  }
  return window.CFG;
}

// Initialize config loading and wait for it
let configPromise = null;
if (window.CFG?.client) {
  configPromise = loadClientConfig();
}

const CONFIG = {
  googleApiKey:
    (window.CFG && (window.CFG.GMAPS_KEY || window.CFG.PLACES_API_KEY)) || '',
  region: (window.CFG && (window.CFG.REGION || window.CFG.region)) || '',
  countries: (() => {
    const c =
      (window.CFG && (window.CFG.COUNTRIES ?? window.CFG.COUNTRY)) ?? null;
    if (!c) return null;
    if (Array.isArray(c)) return c.map(x => String(x).toLowerCase());
    return [String(c).toLowerCase()];
  })(),
  geolocationTimeoutMs: 8000,   // <-- restore
  mapsLoadTimeoutMs: 10000,     // <-- restore
  time: { start: '00:00', end: '23:59', stepMinutes: 15, format12: true }
};

  /* ===== Section 3: Google Maps Loader (dynamic include + readiness poll)
    Purpose: Loads Places library if not already present; polls until available.
    Remove if you always load Google Maps via a static <script> tag before this file.
  
  ===================================================== */
  
  function loadGoogleMaps(callback){
    // First ensure config is loaded
    const loadMapsWithConfig = async () => {
      if (configPromise) {
        await configPromise;
      }
      
      if (window.google?.maps?.places) return callback();
      if (document.querySelector('script[data-gmaps-loader]')){
        const poll = setInterval(()=>{ if (window.google?.maps?.places){ clearInterval(poll); callback(); } },150);
        setTimeout(()=>clearInterval(poll), CONFIG.mapsLoadTimeoutMs);
        return;
      }
      
      const apiKey = CONFIG.googleApiKey || window.CFG?.GMAPS_KEY || '';
      console.log(`[TourForm] Loading Google Maps with API key: ${apiKey?.substring(0, 10)}...`);
      
      if (!apiKey) {
        console.error('[TourForm] No Google Maps API key found in CONFIG.googleApiKey or window.CFG.GMAPS_KEY');
        return;
      }
      
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
      s.async = true; s.defer = true; s.setAttribute('data-gmaps-loader','1');
      s.onerror = () => console.error('[Maps] Failed to load Google Maps JS');
      document.head.appendChild(s);
      const poll = setInterval(()=>{ if (window.google?.maps?.places){ clearInterval(poll); callback(); } },150);
      setTimeout(()=>clearInterval(poll), CONFIG.mapsLoadTimeoutMs);
    };
    
    loadMapsWithConfig();
  }

  /* ===== Section 4: Past Date Guard (attachPickupDateGuard)
    Purpose: Prevent past dates and reformat user input into a verbose date string.
    Remove if native date input validation or backend checks are sufficient.
    Caveat: Formats value (could differ from backend ISO expectations).
  ===================================================== */
  function attachPickupDateGuard(rootDoc){
    const input = rootDoc.querySelector('input[data-q="pickup_date"]');
    if (!input || input.dataset.dateGuard === '1') return;
    input.dataset.dateGuard = '1';
    
    // Minimal styling - main layout handled by CSS to prevent shifts
    try {
      input.style.setProperty('color', '#000', 'important');
      input.style.setProperty('background', '#fff', 'important');
      input.style.setProperty('opacity', '1', 'important');
      // Width and padding are now handled by CSS to prevent layout shift
    } catch(_) {}
    
    const todayStart = () => { const d=new Date(); d.setHours(0,0,0,0); return d; };
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    function parseLocalDate(str){
      if (!str) return null;
      let s = str.trim();
      // Remove commas & ordinal suffixes (1st/2nd/3rd/4th...)
      s = s.replace(/,/g,'').replace(/\b(\d{1,2})(st|nd|rd|th)\b/i,'$1');
  // Remove leading weekday (full or 3‑letter) if present
  s = s.replace(/^(Sun(day)?|Mon(day)?|Tue(sday)?|Wed(nesday)?|Thu(rsday)?|Fri(day)?|Sat(urday)?)\s+/i,'');
      // YYYY-MM-DD
      let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (m) return new Date(+m[1],+m[2]-1,+m[3]);
      // MM/DD/YYYY or M-D-YYYY
      m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (m){ const a=+m[1], b=+m[2], y=+m[3]; const day=a>12?a:b, mon=a>12?b:a; return new Date(y,mon-1,day);} 
  // Full MonthName Day Year
  m = s.match(/^(January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2}) (\d{4})$/i);
      if (m){ return new Date(+m[3], MONTHS.findIndex(M=>M.toLowerCase()===m[1].toLowerCase()), +m[2]); }
  // Abbrev MonthName Day Year
  m = s.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2}) (\d{4})$/i);
  if (m){ const fullIndex=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(m[1].substr(0,3)); return new Date(+m[3], fullIndex, +m[2]); }
      const d=new Date(s); return isNaN(d)?null:new Date(d.getFullYear(),d.getMonth(),d.getDate());
    }
    function formatDisplay(d){
      const month = MONTHS[d.getMonth()].slice(0,3); // Abbrev month
      const day = d.getDate();
      const yr = d.getFullYear();
      const weekday = WEEKDAYS[d.getDay()].slice(0,3); // Abbrev weekday
  return `${weekday}, ${month} ${day}, ${yr}`;
    }
    function enforce(){
      const d=parseLocalDate(input.value);
      if(!d){ input.setCustomValidity(''); return; }
      if(d<todayStart()){ input.setCustomValidity('Please choose today or a future date.'); input.value=''; input.reportValidity?.(); }
      else {
        input.setCustomValidity('');
        // Format immediately for user-friendly display
        input.value = formatDisplay(d);
      }
    }
    input.addEventListener('blur',enforce);
    input.addEventListener('change',enforce);
    input.addEventListener('input',()=>{ if(input.value.length>=6) enforce(); });
    
    // Watch for value changes from date picker components
    let lastValue = input.value;
    const observer = new MutationObserver(() => {
      if (input.value !== lastValue) {
        lastValue = input.value;
        enforce();
      }
    });
    observer.observe(input, { attributes: true, attributeFilter: ['value'] });
    
    // Also use a periodic check to catch any missed updates
    setInterval(() => {
      if (input.value !== lastValue && input.value.length >= 6) {
        lastValue = input.value;
        enforce();
      }
    }, 500);
    
    // Remove the wrapper-based event handling that's causing issues
    // const wrapper=input.closest('.vdpWithInput, .vdpComponent, .date-picker-field-survey');
    // if(wrapper) wrapper.addEventListener('click',()=>{ startWatch(); setTimeout(enforce,50); });
  }

  // (Time input logic removed at user request)
  /* ===== Section 5: Custom Time Picker (singleton popover)
    Purpose: Replaces native time input with a keyboard/mouse friendly popover supporting 12/24h.
    Remove to revert to native <input type="time"> (also strip attachPickupTimePicker calls & CSS).
  ===================================================== */
  (function initSingletonTimePicker(){
    if(window.__singletonTimePicker) return; // already initialized
    const cfgRef = () => CONFIG.time;
    const state = { open:false, input:null, h:6, m:0 };
    const root = document.createElement('div');
    root.id='pickup-time-popover';
    root.style.cssText='position:absolute;inset:auto auto auto auto;z-index:2147483647;background:#fff;border:1px solid #444;border-radius:8px;box-shadow:0 6px 22px rgba(0,0,0,.18);padding:10px;display:none;min-width:230px;font:14px/1.2 system-ui,Arial,sans-serif;';
    root.innerHTML=`<div style="display:flex;gap:18px;justify-content:center;align-items:flex-start;">
      <div data-col="hour" style="text-align:center;">
        <button type="button" data-act="hu" aria-label="Hour up" style="all:unset;cursor:pointer;font-size:16px;">▲</button>
        <div data-part="hour" style="font-size:28px;font-weight:300;margin:6px 0 6px;">06</div>
        <button type="button" data-act="hd" aria-label="Hour down" style="all:unset;cursor:pointer;font-size:16px;">▼</button>
      </div>
      <div style="font-size:28px;padding-top:22px;font-weight:700;">:</div>
      <div data-col="minute" style="text-align:center;">
        <button type="button" data-act="mu" aria-label="Minute up" style="all:unset;cursor:pointer;font-size:16px;">▲</button>
        <div data-part="minute" style="font-size:28px;font-weight:300;margin:6px 0 6px;">00</div>
        <button type="button" data-act="md" aria-label="Minute down" style="all:unset;cursor:pointer;font-size:16px;">▼</button>
      </div>
      <div data-col="ampm" style="text-align:center;" data-ampm-col>
        <button type="button" data-act="tu" aria-label="Toggle AM/PM" style="all:unset;cursor:pointer;font-size:16px;">▲</button>
        <div data-part="ampm" style="font-size:28px;font-weight:300;margin:6px 0 6px;">AM</div>
        <button type="button" data-act="td" aria-label="Toggle AM/PM" style="all:unset;cursor:pointer;font-size:16px;">▼</button>
      </div>
    </div>
    <div style="display:flex;justify-content:center;margin-top:12px;">
      <button type="button" data-act="ok" style="background:#188BF6;color:#FFF;font-weight:600;border:none;padding:8px 40px;border-radius:6px;cursor:pointer;">OK</button>
    </div>`;
    document.body.appendChild(root);
    function parse(str){ if(!str) return null; const m=str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if(!m) return null; let h=+m[1]; const mn=+m[2]; if(m[3]){ const ap=m[3].toUpperCase(); if(ap==='PM'&&h<12) h+=12; if(ap==='AM'&&h===12) h=0; } if(h>23||mn>59) return null; return {h,m:mn}; }
    function clamp(h,m){
      // Constrains within configured window (now full day 00:00–23:59 unless changed)
      const cfg=cfgRef(); const [sh,sm]=cfg.start.split(':').map(Number); const [eh,em]=cfg.end.split(':').map(Number);
      let mins=h*60+m; const s=sh*60+sm, e=eh*60+em; if(mins<s) mins=s; if(mins>e) mins=e; return {h:Math.floor(mins/60), m:mins%60};
    }
    function fmt(h,m){ const cfg=cfgRef(); if(cfg.format12){ const ap=h>=12?'PM':'AM'; let hh=h%12; if(hh===0) hh=12; return `${String(hh).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ap}`; } return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; }
    function updateDisplay(){ const cfg=cfgRef(); const hourEl=root.querySelector('[data-part="hour"]'); const minEl=root.querySelector('[data-part="minute"]'); const apEl=root.querySelector('[data-part="ampm"]'); let displayH=state.h; if(cfg.format12){ let hh=displayH%12; if(hh===0) hh=12; hourEl.textContent=String(hh).padStart(2,'0'); if(apEl) apEl.textContent=state.h>=12?'PM':'AM'; } else { hourEl.textContent=String(displayH).padStart(2,'0'); if(apEl) apEl.parentElement.style.display='none'; } minEl.textContent=String(Math.floor(state.m/(cfgRef().stepMinutes||15))*(cfgRef().stepMinutes||15)).padStart(2,'0'); }
    function adjust(hd, md, toggle){
      const cfg=cfgRef();
      if(typeof hd==='number'){
        // Pure 24h arithmetic; AM/PM derives from final hour value.
        state.h = (state.h + hd + 24) % 24;
      }
      if(toggle){
        state.h = (state.h + 12) % 24; // flip period
      }
      if(typeof md==='number'){
        const step = cfg.stepMinutes || 15;
        let total = state.h*60 + state.m + step*md;
        total = ((total % (24*60)) + 24*60) % (24*60);
        state.h = Math.floor(total/60);
        state.m = total % 60;
      }
      ({h:state.h,m:state.m} = clamp(state.h,state.m));
      updateDisplay();
    }
    function openFor(input){ const cfg=cfgRef(); state.input=input; const cur=parse(input.value)&&parse(input.value) || parse(cfg.start) || {h:6,m:0}; state.h=cur.h; state.m=cur.m; ({h:state.h,m:state.m}=clamp(state.h,state.m)); updateDisplay(); const r=input.getBoundingClientRect(); root.style.display='block'; root.style.top=window.scrollY + r.bottom + 6 + 'px'; root.style.left=window.scrollX + r.left + 'px'; state.open=true; setTimeout(()=>{ document.addEventListener('mousedown', outside, true); document.addEventListener('keydown', keyNav, true); },0); }
    function close(){ if(!state.open) return; state.open=false; root.style.display='none'; document.removeEventListener('mousedown', outside, true); document.removeEventListener('keydown', keyNav, true); }
    function outside(e){ if(root.contains(e.target) || e.target===state.input) return; close(); }
    function keyNav(e){ if(e.key==='Escape'){ close(); state.input?.focus(); } else if(e.key==='Enter'){ commit(); } }
    function commit(){
      if(!state.input) return;
      const val = fmt(state.h,state.m);
      state.input.value = val;
      state.input.setAttribute('value', val);
      // Fire both input & change so GHL autosave logic captures value regardless of listener type
      state.input.dispatchEvent(new Event('input',{bubbles:true}));
      state.input.dispatchEvent(new Event('change',{bubbles:true}));
      close();
      window.__singletonTimePicker.suppressNextFocusOpen = true;
      // Blur to finalize; some frameworks persist on blur
      try { state.input.blur(); } catch(_) {}
    }
    root.addEventListener('click', e=>{ const act=e.target.getAttribute('data-act'); if(!act) return; if(act==='hu') adjust(+1,0,false); else if(act==='hd') adjust(-1,0,false); else if(act==='mu') adjust(0,+1,false); else if(act==='md') adjust(0,-1,false); else if(act==='tu'||act==='td') adjust(0,0,true); else if(act==='ok') commit(); else if(act==='x') { close(); state.input?.focus(); } });
  window.__singletonTimePicker = { openFor, close, suppressNextFocusOpen: false };
    // public helper for debugging
    window.__tpOpenNow = sel => openFor(document.querySelector(sel));
  })();

  // Wire one or more pickup time inputs to the singleton picker
  function attachPickupTimePicker(rootDoc, specificEl){
    const input = specificEl || rootDoc.querySelector('input[data-q="pickup_time"]');
    if(!input) return;
    if(input.dataset.timeSpinnerWired) return;
    input.dataset.timeSpinnerWired='1';
    input.type='text';
    input.readOnly=true; // prevent mobile keyboard
    input.style.cursor='pointer';
    input.autocomplete='off';
    input.addEventListener('click', ()=> window.__singletonTimePicker.openFor(input));
    input.addEventListener('focus', ()=> {
      if(window.__singletonTimePicker.suppressNextFocusOpen){
        window.__singletonTimePicker.suppressNextFocusOpen = false; // consume flag
        return;
      }
      window.__singletonTimePicker.openFor(input);
    });
  }

  /* ===== Section 5.5: Step 1 Validation on NEXT (shake + message) =====
     Purpose: Validate the five first-step fields when the user clicks the NEXT button
              (class="ghl-btn ghl-footer-next"). Prevent advancing if any are empty.
  ===================================================== */
  (function installStepOneNextValidation(){
    if(window.__stepOneNextValidation) return;

    const SELECTORS = [
      'input[data-q="pickup_location"]',
      'input[data-q="drop-off_location"]',
      'input[data-q="pickup_date"]',
      'input[data-q="pickup_time"]',
      'input[data-q="number_of_passengers"]'
    ];
    const MESSAGES = {
      'pickup_location':'Please enter a pickup location.',
      'drop-off_location':'Please enter a drop-off location.',
      'pickup_date':'Please choose a pickup date.',
      'pickup_time':'Please choose a pickup time.',
      'number_of_passengers':'Please enter the number of passengers.'
    };

    // Find a reasonable container to animate (closest sizable ancestor)
    function findStepContainerFrom(el){
      let node = el.closest?.('.survey-form-step, .ghl-question-set, .hl_form-builder--step, .ghl-form-wrap, form') || el.parentElement;
      let depth = 0;
      while(node && depth < 6){
        try{
          const rect = node.getBoundingClientRect();
          if(rect.height > 120 && node.querySelector?.('input[data-q], .ghl-btn')) return node;
        }catch(_){ /* noop */ }
        node = node.parentElement;
        depth++;
      }
      return document.querySelector('.ghl-question-set') || el.closest?.('form') || document.body;
    }

    // Utility: get visible elements for the provided selectors
    function getVisibleNodes(selectors){
      const nodes = selectors.map(sel => document.querySelector(sel)).filter(Boolean);
      return nodes.filter(el => {
        const s = getComputedStyle(el);
        if(el.disabled || el.type==='hidden' || s.display==='none' || s.visibility==='hidden') return false;
        const r = el.getBoundingClientRect();
        return r.width>0 && r.height>0;
      });
    }

    // Utility: compute the deepest common ancestor that still contains all nodes
    function deepestCommonAncestor(nodes){
      if(!nodes || !nodes.length) return null;
      // Build ancestor chains for each node (upwards to html)
      const chains = nodes.map(n=>{ const path=[]; let x=n; while(x){ path.push(x); x=x.parentElement; } return path; });
      // Start from the first chain, find the first element present in all other chains
      let lca = null;
      outer: for(const candidate of chains[0]){
        for(let i=1;i<chains.length;i++){
          if(!chains[i].includes(candidate)) continue outer;
        }
        lca = candidate; break;
      }
      if(!lca) return null;
      // Walk down while there is exactly one child that contains all nodes
      let curr = lca;
      while(true){
        const children = Array.from(curr.children || []);
        const carriers = children.filter(ch => nodes.every(nd => ch.contains(nd)));
        if(carriers.length === 1){ curr = carriers[0]; } else { break; }
      }
      return curr;
    }

    // Choose the element to animate: prefer the deepest common ancestor within the container
    function pickAnimTarget(container, selectors){
      try{
        const nodes = getVisibleNodes(selectors);
        const dca = deepestCommonAncestor(nodes);
        if(dca && container.contains(dca) && dca !== container) return dca;
      }catch(_){ /* noop */ }
      // Fallback: try common inner wrappers
      const fallback = container.querySelector('.ghl-questions, .ghl-form-rows, .survey-form-content, .survey-form-step .content, .hl_form-builder--step .step-content, .ghl-form-wrap .ghl-content, .ghl-form-container');
      return fallback || container;
    }

    function animateNextThenAdvance(btn){
      if(window.__bfAnimating) return; // avoid overlap
      const container = findStepContainerFrom(btn);
      if(!container){ window.__allowNextOnce = true; setTimeout(()=>btn.click(),0); return; }
      // Animate only the fields area so the outer white background remains
      const animTarget = pickAnimTarget(container, SELECTORS);
      window.__bfAnimating = true;
      animTarget.classList.add('bf-fade-anim');
      // Force reflow before applying out state
      void animTarget.offsetWidth;
      animTarget.classList.add('bf-fade-out');
      // After fade-out, re-trigger the click once (bypassing our guard), then fade-in Step 2
      const DUR = 230;
      setTimeout(()=>{
        // Allow the framework's native action to run once
        window.__allowNextOnce = true;
        // Remove fade-out to prevent lingering style
        animTarget.classList.remove('bf-fade-out');
        animTarget.classList.remove('bf-fade-anim');
        setTimeout(()=>{
          try { btn.click(); } catch(_) {}
          // Try a fade-in on the next step container once it appears
      setTimeout(()=>{
            const STEP2_SELECTORS = [
              'input[data-q="email"]',
              'input[data-q="phone"]',
              'input[data-q="full_name"]'
            ];
            const nextField = document.querySelector(STEP2_SELECTORS.join(', '));
            if(nextField){
              const cont2 = findStepContainerFrom(nextField);
              if(cont2){
                const target2 = pickAnimTarget(cont2, STEP2_SELECTORS);
                target2.classList.add('bf-fade-anim','bf-fade-in-init');
                void target2.offsetWidth; // reflow
                target2.classList.remove('bf-fade-in-init');
                setTimeout(()=> target2.classList.remove('bf-fade-anim'), DUR + 60);
              }
        // Ensure CTA is applied on step 2
        try { enhanceSubmitButton(document); } catch(_) {}
            }
            window.__bfAnimating = false;
          }, 40);
        }, 0);
      }, DUR);
    }

    function isVisible(el){
      if(!el || el.disabled) return false;
      if(el.type === 'hidden') return false;
      const s = getComputedStyle(el);
      if(s.display==='none' || s.visibility==='hidden') return false;
      const rect = el.getBoundingClientRect();
      return rect.width>0 && rect.height>0;
    }

    function ensureMsgNode(container){
      let msg = container.querySelector(':scope > .field-error');
  if(!msg){ msg = document.createElement('div'); msg.className='field-error'; container.appendChild(msg); }
      return msg;
    }

    function showError(el, text){
  try { el.setCustomValidity?.(text); } catch(_) {}
      el.classList.add('input-error');
  el.setAttribute('aria-invalid','true');
      const wrap = el.closest('.icon-field-wrapper');
      const container = wrap || el.parentElement || el;
      // Keep the border only on the input; wrapper is used for shake positioning only
  const msg = ensureMsgNode(container);
  msg.textContent = text;
  container.classList.remove('shake'); void container.offsetWidth; container.classList.add('shake');
      setTimeout(()=> container.classList.remove('shake'), 500);
    }

    function clearError(el){
  try { el.setCustomValidity?.(''); } catch(_) {}
  el.removeAttribute('aria-invalid');
      el.classList.remove('input-error');
      const wrap = el.closest('.icon-field-wrapper');
      const container = wrap || el.parentElement || el;
      const msg = container.querySelector(':scope > .field-error');
      if(msg) msg.textContent = '';
    }

    function hookClearOnInput(el){
      if(el.dataset.step1Wired==='1') return;
      el.dataset.step1Wired='1';
      const h = ()=>{ if((el.value||'').trim()) clearError(el); };
      el.addEventListener('input', h);
      el.addEventListener('change', h);
    }

    function validateStep1(){
      const nodes = SELECTORS.map(sel => document.querySelector(sel)).filter(Boolean);
      let firstInvalid = null;
      for(const el of nodes){
        hookClearOnInput(el);
        if(!isVisible(el)) continue; // ignore hidden in this step
        const v = (el.value||'').trim();
        if(!v){
          const q = el.getAttribute('data-q') || '';
          showError(el, MESSAGES[q] || 'This field is required.');
          if(!firstInvalid) firstInvalid = el;
        } else {
          clearError(el);
        }
      }
      if(firstInvalid){
        try { firstInvalid.scrollIntoView({ behavior:'smooth', block:'center' }); } catch(_) {}
        setTimeout(()=>{ try { firstInvalid.focus({ preventScroll:true }); } catch(_) {} }, 200);
        try { firstInvalid.reportValidity?.(); } catch(_) {}
        return false;
      }
      return true;
    }

    // Delegate click on NEXT buttons so we catch dynamically-rendered ones too
    document.addEventListener('click', (e)=>{
      const btn = e.target.closest?.('.ghl-btn.ghl-footer-next');
      if(!btn) return;
      // One-time bypass to avoid recursion when we re-trigger the click after animation
      if(window.__allowNextOnce){ window.__allowNextOnce = false; return; }
      const ok = validateStep1();
      if(!ok){
        e.preventDefault();
        e.stopPropagation();
      } else {
        // Valid: animate out/in before advancing
        e.preventDefault();
        e.stopPropagation();
        animateNextThenAdvance(btn);
      }
    }, true);

    // Some UIs act on mousedown; intercept that as well
    document.addEventListener('mousedown', (e)=>{
      const btn = e.target.closest?.('.ghl-btn.ghl-footer-next');
      if(!btn) return;
      // One-time bypass for programmatic click
      if(window.__allowNextOnce){ return; }
      if(!validateStep1()){
        e.preventDefault();
        e.stopPropagation();
      } else {
        // Prevent immediate advance; run animation path which will re-fire click
        e.preventDefault();
        e.stopPropagation();
        animateNextThenAdvance(btn);
      }
    }, true);

    window.__stepOneNextValidation = true;
  })();

  /* ===== Section 5.6: Step 2 Validation on SUBMIT (inline messages + shake)
     Purpose: Validate the three second-step fields when the user clicks the SUBMIT button
              (class="ghl-btn ghl-submit-btn"). Prevent submission and show per-field
              inline messages below each input (consistent with Step 1) instead of top list.
  ===================================================== */
  (function installStepTwoSubmitValidation(){
    if(window.__stepTwoSubmitValidation) return;

    const SELECTORS = [
      'input[data-q="email"]',
      'input[data-q="phone"]',
      'input[data-q="full_name"]'
    ];
    const EMPTY_MSG = {
      'email':'Please enter your email address.',
      'phone':'Please enter your phone number.',
      'full_name':'Please enter your full name.'
    };
    const INVALID_MSG = {
      'email':'Please enter a valid email address.'
    };

    function isVisible(el){
      if(!el || el.disabled) return false;
      if(el.type === 'hidden') return false;
      const s = getComputedStyle(el);
      if(s.display==='none' || s.visibility==='hidden') return false;
      const rect = el.getBoundingClientRect();
      return rect.width>0 && rect.height>0;
    }

    function ensureMsgNode(container){
      let msg = container.querySelector(':scope > .field-error');
      if(!msg){ msg = document.createElement('div'); msg.className='field-error'; container.appendChild(msg); }
      return msg;
    }

    function showError(el, text){
      try { el.setCustomValidity?.(text); } catch(_) {}
      el.classList.add('input-error');
      el.setAttribute('aria-invalid','true');
      const wrap = el.closest('.icon-field-wrapper');
      const container = wrap || el.parentElement || el;
      const msg = ensureMsgNode(container);
      msg.textContent = text;
      container.classList.remove('shake'); void container.offsetWidth; container.classList.add('shake');
      setTimeout(()=> container.classList.remove('shake'), 500);
    }

    function clearError(el){
      try { el.setCustomValidity?.(''); } catch(_) {}
      el.removeAttribute('aria-invalid');
      el.classList.remove('input-error');
      const wrap = el.closest('.icon-field-wrapper');
      const container = wrap || el.parentElement || el;
      const msg = container.querySelector(':scope > .field-error');
      if(msg) msg.textContent = '';
    }

    function hookClearOnInput(el){
      if(el.dataset.step2Wired==='1') return;
      el.dataset.step2Wired='1';
      const h = ()=>{ if((el.value||'').trim()) clearError(el); };
      el.addEventListener('input', h);
      el.addEventListener('change', h);
    }

    function validateStep2(){
      const nodes = SELECTORS.map(sel => document.querySelector(sel)).filter(Boolean);
      let firstInvalid = null;
      for(const el of nodes){
        hookClearOnInput(el);
        if(!isVisible(el)) continue; // ignore hidden in other steps
        const q = el.getAttribute('data-q') || '';
        const v = (el.value||'').trim();
        let message = '';
        if(!v){
          message = EMPTY_MSG[q] || 'This field is required.';
        } else if(q==='email' && el.type==='email' && el.validity && el.validity.typeMismatch){
          message = INVALID_MSG[q] || EMPTY_MSG[q];
        }
        if(message){
          showError(el, message);
          if(!firstInvalid) firstInvalid = el;
        } else {
          clearError(el);
        }
      }
      if(firstInvalid){
        try { firstInvalid.scrollIntoView({ behavior:'smooth', block:'center' }); } catch(_) {}
        setTimeout(()=>{ try { firstInvalid.focus({ preventScroll:true }); } catch(_) {} }, 200);
        try { firstInvalid.reportValidity?.(); } catch(_) {}
        return false;
      }
      return true;
    }

    // Intercept SUBMIT button to prevent default top-of-form errors and keep inline messages
    document.addEventListener('click', (e)=>{
      const btn = e.target.closest?.('.ghl-btn.ghl-submit-btn');
      if(!btn) return;
      const ok = validateStep2();
      if(!ok){
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    document.addEventListener('mousedown', (e)=>{
      const btn = e.target.closest?.('.ghl-btn.ghl-submit-btn');
      if(!btn) return;
      if(!validateStep2()){
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    window.__stepTwoSubmitValidation = true;
  })();

  /* ===== Added: Lightweight Calendar Date Picker (popup) =====
     Purpose: On click/focus of pickup_date input, show a custom calendar; selecting a date writes
              a verbose formatted string (Weekday, Month DayOrdinal, Year) into the input and
              dispatches input/change events so existing date guard & form logic respond.
     Notes:   - Respects 'today' as minimum (no past date selection).
              - Rebuilds grid on month navigation.
              - Integrates with existing attachPickupDateGuard formatting (same output shape).
  ============================================================= */
  (function initDatePicker(){
    if(window.__pickupDatePicker) return;
    const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
    const WEEKDAYS_SHORT=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  function formatVerbose(d){ const wd=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]; const mon=MONTHS[d.getMonth()].slice(0,3); return `${wd}, ${mon} ${d.getDate()}, ${d.getFullYear()}`; }
    const pop=document.createElement('div'); pop.id='pickup-date-popover'; pop.setAttribute('role','dialog'); pop.setAttribute('aria-hidden','true'); document.body.appendChild(pop);
    const state={open:false, month:new Date().getMonth(), year:new Date().getFullYear(), input:null};
    function todayStart(){ const d=new Date(); d.setHours(0,0,0,0); return d; }
    function build(){
      const first=new Date(state.year,state.month,1); const startDow=first.getDay();
      const daysInMonth=new Date(state.year,state.month+1,0).getDate();
      const prevDays=new Date(state.year,state.month,0).getDate();
      let html=`<div class="dp-header"><button type="button" class="dp-nav" data-nav="-1" aria-label="Previous Month">‹</button><div>${MONTHS[state.month]} ${state.year}</div><button type="button" class="dp-nav" data-nav="1" aria-label="Next Month">›</button></div>`;
      html+=`<div class="dp-weekdays">${WEEKDAYS_SHORT.map(w=>`<div>${w}</div>`).join('')}</div>`;
      html+='<div class="dp-grid">';
      // leading blanks from previous month (disabled)
      for(let i=0;i<startDow;i++){ const d=prevDays-startDow+i+1; html+=`<div class="dp-day dp-disabled" aria-hidden="true">${d}</div>`; }
      const today=todayStart();
      for(let day=1; day<=daysInMonth; day++){
        const current=new Date(state.year,state.month,day); current.setHours(0,0,0,0);
        const disabled=current<today; const isToday=current.getTime()===today.getTime();
        const classes=['dp-day']; if(disabled) classes.push('dp-disabled'); if(isToday) classes.push('dp-today');
        html+=`<div class="${classes.join(' ')}" data-day="${day}" role="button" tabindex="${disabled?-1:0}" aria-disabled="${disabled}" aria-label="${MONTHS[state.month]} ${day}, ${state.year}">${day}</div>`;
      }
      html+='</div>';
      pop.innerHTML=html;
    }
    function openFor(input){ state.input=input; const now=new Date(); state.month=now.getMonth(); state.year=now.getFullYear(); build(); position(); pop.style.display='block'; pop.setAttribute('aria-hidden','false'); state.open=true; setTimeout(()=>{ document.addEventListener('mousedown',outside,true); document.addEventListener('keydown',keyNav,true); },0); }
    function close(){ if(!state.open) return; state.open=false; pop.style.display='none'; pop.setAttribute('aria-hidden','true'); document.removeEventListener('mousedown',outside,true); document.removeEventListener('keydown',keyNav,true); }
    function position(){ if(!state.input) return; const r=state.input.getBoundingClientRect(); pop.style.top=window.scrollY + r.bottom + 6 + 'px'; pop.style.left=window.scrollX + r.left + 'px'; }
    function outside(e){ if(pop.contains(e.target) || e.target===state.input) return; close(); }
    function keyNav(e){ if(e.key==='Escape'){ close(); state.input?.focus(); } }
    pop.addEventListener('click',e=>{ const nav=e.target.getAttribute('data-nav'); if(nav){ state.month+= +nav; if(state.month<0){ state.month=11; state.year--; } else if(state.month>11){ state.month=0; state.year++; } build(); return; } const day=e.target.getAttribute('data-day'); if(day){ const sel=new Date(state.year,state.month,+day); if(sel<todayStart()) return; const formatted=formatVerbose(sel); state.input.value=formatted; state.input.setAttribute('value',formatted); state.input.dispatchEvent(new Event('input',{bubbles:true})); state.input.dispatchEvent(new Event('change',{bubbles:true})); close(); }});
    window.addEventListener('resize',()=> position()); window.addEventListener('scroll',()=> position(), true);
    function attach(rootDoc){ const input=rootDoc.querySelector('input[data-q="pickup_date"]'); if(!input || input.dataset.datePickerWired==='1') return; input.dataset.datePickerWired='1'; input.readOnly=true; input.addEventListener('focus',()=> openFor(input)); input.addEventListener('click',()=> openFor(input)); }
    window.__pickupDatePicker={ openFor, close, attach };
    // initial attach
    attach(document);
  })();

  // (Passenger number input left as native default; custom helpers removed by request)

  /* ===== Section 6.5: Passenger Count Select (1–15, then 16+)
    Purpose: Replace number_of_passengers input with a proper dropdown select
    Remove if native number input is preferred
  ===================================================== */
  (function initPassengerSelect(){
    if (window.__passengerSelect) return;

    // Build a <select> to replace the input[data-q="number_of_passengers"]
    function buildSelectFromInput(input){
      const sel = document.createElement('select');

      // carry core attributes so styling/validation behave the same
      sel.name = input.name || 'number_of_passengers';
      sel.setAttribute('data-q', 'number_of_passengers');
      if (input.id) sel.id = input.id;
      if (input.required) sel.required = true;
      sel.className = input.className; // inherit any theme classes

      // --- Placeholder (pulled from the original input, same source as other fields) ---
      const phText = input.getAttribute('placeholder') || 'Number of Passengers';
      const ph = document.createElement('option');
      ph.value = '';
      ph.textContent = phText;
      ph.disabled = true;
      ph.selected = true;
      ph.hidden = true;
      sel.appendChild(ph);

      // --- 1..15 then 16+ ---
      for (let i = 1; i <= 15; i++){
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = String(i);
        sel.appendChild(opt);
      }
      const big = document.createElement('option');
      big.value = '16+';
      big.textContent = '16+';
      sel.appendChild(big);

      // Preserve an existing value if one was already set on the input
      const cur = (input.value || '').trim();
      if ((/^\d+$/.test(cur) && +cur >= 1 && +cur <= 15) || cur === '16+') {
        sel.value = cur;
      }

      // Apply placeholder class for styling
      function applyPlaceholderClass(el) {
        if (!el) return;
        if (el.value === '' || el.value === null) {
          el.classList.add('is-placeholder');
        } else {
          el.classList.remove('is-placeholder');
        }
      }

      applyPlaceholderClass(sel);
      sel.addEventListener('change', () => {
        sel.setAttribute('value', sel.value);
        applyPlaceholderClass(sel);
        sel.dispatchEvent(new Event('input', { bubbles: true }));
      });

      return sel;
    }

    function attachPassengerSelect(rootDoc){
      const input = rootDoc.querySelector('input[data-q="number_of_passengers"]');
      // If the select already exists, bail
      const selAlready = rootDoc.querySelector('select[data-q="number_of_passengers"]');
      if (!input || selAlready) return;
      if (input.dataset.paxSelectWired === '1') return;

      // Build the select element
      const selectEl = buildSelectFromInput(input);
      
      // Hide the original input but keep it for form submission
      input.style.display = 'none';
      input.style.visibility = 'hidden';
      input.style.position = 'absolute';
      input.style.left = '-9999px';
      
      // Insert select after the hidden input (don't replace it)
      input.parentNode.insertBefore(selectEl, input.nextSibling);
      
      // Sync select changes back to the hidden input for form submission
      selectEl.addEventListener('change', () => {
        input.value = selectEl.value;
        selectEl.setAttribute('value', selectEl.value);
        
        // Trigger change event on hidden input
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('input', { bubbles: true }));
        
        selectEl.dispatchEvent(new Event('input', { bubbles: true }));
      });
      
      // Sync input changes back to the select (for URL parameter population)
      input.addEventListener('change', () => {
        if (input.value && input.value !== selectEl.value) {
          selectEl.value = input.value;
          selectEl.setAttribute('value', selectEl.value);
        }
      });
      
      // Also sync any initial value from input to select
      if (input.value) {
        selectEl.value = input.value;
      }
      
      selectEl.dataset.paxSelectWired = '1';
      input.dataset.paxSelectWired = '1';

      // Re-run icon wrapper just in case
      try { enhanceVisual(document); } catch(_) {}
    }

    window.__passengerSelect = { attach: attachPassengerSelect };

    // initial attach
    try { attachPassengerSelect(document); } catch(_) {}
  })();

  /* ===== Section 6: Autocomplete + Airport Code Normalization
    Purpose: Adds Google Places Autocomplete to pickup/drop-off fields; appends airport codes for clarity.
    Remove if free-text entry is acceptable. Also remove Section 10 airport data & prioritizer.
  ===================================================== */
  // Maps‑dependent variables
  let jmBounds, AIRPORT_CODES, airportBounds;

  function normalizeSafely(el, obs){
    if (obs) obs.disconnect();
    el.classList.remove('pac-target-input','disabled','is-disabled');
    el.removeAttribute('readonly');
    if (el.getAttribute('aria-disabled') === 'true') el.removeAttribute('aria-disabled');
    if (el.getAttribute('autocomplete') !== 'on') el.setAttribute('autocomplete','on');
    if (el.style.opacity) el.style.opacity='';
    if (obs) obs.observe(el,{attributes:true,attributeFilter:['class','readonly','aria-disabled','autocomplete','style'],attributeOldValue:true});
  }

  function wireAutocomplete(rootDoc){
    if(!window.google?.maps?.places) return;
    const sels=['input[data-q="pickup_location"]','input[data-q="drop-off_location"]'];
    for(const sel of sels){
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
      } catch(err){ console.error('[Maps] Autocomplete init failed:', err); continue; }

      ac.addListener('place_changed',()=>{
        const place=ac.getPlace(); if(!place?.place_id || !place.geometry) return;
        const isAirport=(place.types||[]).includes('airport');
        let display='';
        if(isAirport && place.name){ const code = AIRPORT_CODES[place.name]; display = code? `${place.name} (${code})` : place.name; }
        else if(place.name) display=place.name; else if(place.formatted_address) display=place.formatted_address;
        // Defer value mutation to next tick so Google can close the dropdown first.
        setTimeout(()=>{
          el.value = display;
          el.setAttribute('value', display);
          el.dispatchEvent(new Event('input', { bubbles:true }));
          el.dispatchEvent(new Event('change', { bubbles:true }));
          // Force close: blur + synthetic Escape + multi-pass hide + temporary CSS rule
          try { el.blur(); } catch(_) {}
          try { el.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); } catch(_) {}
          if(!document.getElementById('pac-temp-hide')){
            const st=document.createElement('style');
            st.id='pac-temp-hide';
            st.textContent='.pac-container{display:none !important;}';
            document.head.appendChild(st);
            setTimeout(()=>{ st.remove(); },400);
          }
          function hideAll(){ document.querySelectorAll('.pac-container').forEach(pc=>{ pc.style.display='none'; }); }
          [0,30,80,160,300].forEach(d=> setTimeout(hideAll,d));
        },0);
      });

      el.addEventListener('focus', ()=>{
			  if(!el.value && typeof airportBounds === 'function') {
			    ac.setBounds(airportBounds());
			  }
			}, { once:true });

      const obs=new MutationObserver(()=>{ normalizeSafely(el, obs); });
      normalizeSafely(el, obs);
    }  
  
  }

  /* ===== Section 7: Icon Injection / Visual Enhancement
    Purpose: Wrap targeted inputs with a container and prepend inline SVG icon.
    Remove to simplify DOM; keep CSS padding logic consistent if removed.
  ===================================================== */
  function enhanceVisual(rootDoc){
    if(!rootDoc) return;
    const ICONS={
      'pickup_location':`<svg viewBox='0 0 24 24' aria-hidden='true'><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
      'drop-off_location':`<svg viewBox='0 0 24 24' aria-hidden='true'><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
      'pickup_date':`<svg viewBox='0 0 24 24' aria-hidden='true'><rect x='3' y='5' width='18' height='16' rx='2' ry='2'/><line x1='16' y1='3' x2='16' y2='7'/><line x1='8' y1='3' x2='8' y2='7'/><line x1='3' y1='11' x2='21' y2='11'/></svg>`,
      'pickup_time':`<svg viewBox='0 0 24 24' aria-hidden='true'><circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/></svg>`,
      // 'number_of_passengers' icon removed to prevent trailing icon issue
      'full_name':`<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/></svg>`,
      'email':`<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z'/><polyline points='22,6 12,13 2,6'/></svg>`,
      'phone':`<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.86 19.86 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.66 12.66 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.66 12.66 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z'/></svg>`
    };
    function wrap(el, svg, key){
      if(!el) return;
      // Find or create wrapper
      let wrapDiv = el.closest('.icon-field-wrapper');
      if(!wrapDiv){
        wrapDiv=document.createElement('div');
        wrapDiv.className='icon-field-wrapper';
        el.parentNode.insertBefore(wrapDiv, el);
      }
      // Ensure an input-row exists (icon aligns to this row only)
      let row = wrapDiv.querySelector(':scope > .icon-input-row');
      if(!row){
        row=document.createElement('div');
        row.className='icon-input-row';
        // place at top so any error message can appear below
        wrapDiv.insertBefore(row, wrapDiv.firstChild);
      }
      // Move input into the row if not already
      if(el.parentElement !== row){
        row.appendChild(el);
      }
      // Create or move the icon into the row
      let span = row.querySelector(':scope > .field-icon') || wrapDiv.querySelector(':scope > .field-icon');
      if(!span){
        span=document.createElement('span');
        span.className='field-icon';
        span.setAttribute('aria-hidden','true');
        if(key) span.setAttribute('data-for', key);
        span.innerHTML=svg;
      } else {
        // Ensure attributes match latest key
        if(key) span.setAttribute('data-for', key);
      }
      if(span.parentElement !== row){
        row.appendChild(span);
      }
      el.dataset.iconized='1';
    }
    Object.entries(ICONS).forEach(([k,svg])=>{
      [...rootDoc.querySelectorAll(`input[data-q='${k}'],select[data-q='${k}']`)].forEach(el=>wrap(el,svg,k));
      [...rootDoc.querySelectorAll(`input[name='${k}'],select[name='${k}']`)].forEach(el=>wrap(el,svg,k));
    });
  }

  // Enhance Step 1 NEXT button on mobile by appending a "NEXT" label next to the arrow
  function enhanceNextButtonMobile(rootDoc){
    if(!rootDoc) rootDoc = document;
    const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
    const btns = rootDoc.querySelectorAll('.ghl-btn.ghl-footer-next');
    btns.forEach(btn => {
      let labelSpan = btn.querySelector('.bf-next-label');
      if(isMobile){
        // Ensure alignment class exists only on mobile
        btn.classList.add('bf-next');
        // Add or move label to the first position
        if(!labelSpan){
          labelSpan = document.createElement('span');
          labelSpan.className = 'bf-next-label';
          labelSpan.textContent = 'NEXT';
          btn.insertBefore(labelSpan, btn.firstChild);
        } else if (btn.firstElementChild !== labelSpan) {
          btn.insertBefore(labelSpan, btn.firstChild);
        }
      } else {
        // Desktop: remove our alignment class and custom label to avoid side effects
        btn.classList.remove('bf-next');
        if(labelSpan) labelSpan.remove();
      }
    });
  }

  // Toggle NEXT label on viewport changes
  try {
    const mq = window.matchMedia('(max-width: 768px)');
    const reapply = ()=> enhanceNextButtonMobile(document);
    if(mq.addEventListener){ mq.addEventListener('change', reapply); }
    else if(mq.addListener){ mq.addListener(reapply); }
    window.addEventListener('resize', reapply, { passive: true });
  } catch(_) {}

  // Enhance the Step 2 submit button with CTA text + white arrow
  function enhanceSubmitButton(rootDoc){
    if(!rootDoc) rootDoc = document;
    const btns = rootDoc.querySelectorAll('.ghl-btn.ghl-submit-btn');
    btns.forEach(btn => {
      if(btn.dataset.bfCtaWired === '1') return;
      // Replace text with our CTA while preserving the button element and its listeners
      const label = 'GET YOUR QUOTES!';
      btn.classList.add('bf-cta');
      btn.innerHTML = `<span class="bf-cta-text">${label}</span>`+
        `<span class="bf-arrow" aria-hidden="true">`+
        `<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">`+
        `<line x1="4" y1="12" x2="18" y2="12"></line>`+
        `<polyline points="12,6 18,12 12,18"></polyline>`+
        `</svg>`+
        `</span>`;
      btn.dataset.bfCtaWired = '1';
    });
  }

  // ===== Prefill helpers (optional) =====
function setInputValue(el, val){
  el.value = val;
  el.setAttribute('value', val);
  el.dispatchEvent(new Event('input', { bubbles:true }));
  el.dispatchEvent(new Event('change', { bubbles:true }));
}

// Plain-text prefill: runs even before Maps is loaded
function applyPrefillBasic(rootDoc){
  const cfg = window.CFG?.PREFILL;
  if(!cfg) return;
  const pairs = [
    ['pickup_location', 'input[data-q="pickup_location"]'],
    // ['drop_off_location','input[data-q="drop-off_location"]'], // optional: enable if you want
  ];
  for(const [key, sel] of pairs){
    const pre = cfg[key];
    if(!pre || typeof pre === 'object') continue;         // only handle strings here
    const el = rootDoc.querySelector(sel);
    if(!el || el.dataset.prefilled === '1') continue;
    el.dataset.prefilled = '1';
    setInputValue(el, String(pre));
  }
}

// Maps-based prefill: Place ID or lat/lng (requires Google Maps JS loaded)
function applyPrefillMaps(rootDoc){
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
    if(pre.placeId){
      const svc = new google.maps.places.PlacesService(document.createElement('div'));
      svc.getDetails({ placeId: pre.placeId, fields: ['name','formatted_address','types'] }, (place, status) => {
        if(status === google.maps.places.PlacesServiceStatus.OK && place){
          // Prefer name; fall back to formatted address
          finish(place.name || place.formatted_address || '');
        }
      });
      return;
    }

    // Case B: lat/lng
    if(typeof pre.lat === 'number' && typeof pre.lng === 'number'){
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat: pre.lat, lng: pre.lng } }, (results, status) => {
        if(status === 'OK' && results?.[0]){
          finish(results[0].formatted_address);
        }
      });
    }
  };

  doOne('pickup_location', 'input[data-q="pickup_location"]');
  // doOne('drop_off_location', 'input[data-q="drop-off_location"]'); // optional
}

// ---------- Autofill hidden drop-off from page title ----------
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

function autofillHiddenDropOff(rootDoc) {
  const el = (rootDoc || document).querySelector('input[data-q="drop-off_location"]');
  if (!el) return;
  if (el.dataset.dropAutoFilled === '1') return;

  // Only set if empty (don’t overwrite anything user/system already put in)
  const current = (el.value || '').trim();
  if (current) { el.dataset.dropAutoFilled = '1'; return; }

  const title = getBestTitle();
  if (!title) return;

  // Ensure it's hidden if that's your intent (won’t hurt if already hidden)
  try { if (el.type !== 'hidden') el.type = 'hidden'; } catch(_) {}

  setInputValue(el, title);
  el.dataset.dropAutoFilled = '1';
}

// Initial run
autofillHiddenDropOff(document);

// Keep in sync if the title changes later (useful for SPAs / lazy title updates)
(function watchTitleChanges(){
  let last = document.title;
  setInterval(() => {
    if (document.title !== last) {
      last = document.title;
      // Allow re-fill if it was never filled (don’t override if already set)
      const el = document.querySelector('input[data-q="drop-off_location"]');
      if (el && !(el.value || '').trim()) {
        el.dataset.dropAutoFilled = ''; // allow another try
        autofillHiddenDropOff(document);
      }
    }
  }, 1000);
})();

// Hook into your existing late-field observer: call inside your observer where you
// already handle new inputs showing up.

  /* ===== Section 8: Initial Enhancement Invocation
    Purpose: Kick off date guard, time picker wiring, and icon injection for elements already in DOM.
    Adjust order only if dependencies change (icons don’t depend on others).
  ===================================================== */
  
  // Hide drop-off field for tour forms
  function hideDropOffField() {
    if (window.CFG?.formType === 'tour') {
      // Hide the entire drop-off container including the icon
      const dropOffContainer = document.getElementById('el_pmkaWAYqmvey4VusfPvF_Ff2mstR1InquK2d7G2hX_2');
      if (dropOffContainer) {
        dropOffContainer.style.display = 'none';
        console.log('[TourForm] Hidden drop-off container for tour form');
      }
      
      // Also hide any other drop-off field containers that might exist
      const dropOffInputs = document.querySelectorAll('input[data-q="drop-off_location"]');
      dropOffInputs.forEach(input => {
        // Find the closest form field wrapper
        const wrapper = input.closest('.form-builder--item') || 
                       input.closest('.ghl-question') || 
                       input.closest('.icon-field-wrapper') ||
                       input.closest('[id*="el_"]');
        if (wrapper) {
          wrapper.style.display = 'none';
          console.log('[TourForm] Hidden drop-off field wrapper');
        }
      });
    }
  }
  
  hideDropOffField();
  attachPickupDateGuard(document);
  attachPickupTimePicker(document);
  enhanceVisual(document);
  enhanceNextButtonMobile(document);
  enhanceSubmitButton(document);
  applyPrefillBasic(document);
  
  // Initialize passenger select dropdown
  if (window.__passengerSelect && window.__passengerSelect.attach) {
    window.__passengerSelect.attach(document);
  }
  
  // Step 1 NEXT validation is installed by its module above (IIFE).
  
  // Secondary run to catch late-rendered inputs
  setTimeout(()=>{
    enhanceVisual(document);
    if (window.__passengerSelect && window.__passengerSelect.attach) {
      window.__passengerSelect.attach(document);
    }
  },400);
  
  /* ===== Section 9: Dynamic Field Observer (MutationObserver)
   Purpose: Detects new/re-rendered inputs (GHL dynamic forms) and re-applies enhancements.
   Remove for static forms to reduce overhead.
===================================================== */
(function observeLateFields(){
  if(window.__iconFieldObserver) return;

  const targetAttrs = [
    'pickup_location','drop-off_location','pickup_date','pickup_time',
    'number_of_passengers','full_name','email','phone'
  ];

  const obs = new MutationObserver(muts=>{
    for(const m of muts){
      if(!m.addedNodes) continue;

      m.addedNodes.forEach(node=>{
        if(!(node instanceof HTMLElement)) return;

        const candidates = node.matches?.('input,select')
          ? [node]
          : [...(node.querySelectorAll?.('input,select') || [])];

        candidates.forEach(el=>{
          const q = el.getAttribute('data-q');
          if(q && targetAttrs.includes(q)){
            // Visual & button enhancements (idempotent)
            enhanceVisual(document);
            enhanceNextButtonMobile(document);
            enhanceSubmitButton(document);

            // Prefill attempts (idempotent; guarded internally)
            applyPrefillBasic(document);
            if(window.google?.maps) applyPrefillMaps(document);

            // Late Maps wiring for location fields
            if((q === 'pickup_location' || q === 'drop-off_location') &&
               window.google?.maps?.places){
              try { wireAutocomplete(document); } catch(_) {}
            }
            
            if (q === 'drop-off_location') {
					  try { autofillHiddenDropOff(document); } catch(_) {}
						}

            // Late date field: guard + popup attach
            if(q === 'pickup_date'){
              try { attachPickupDateGuard(document); } catch(_) {}
              try { window.__pickupDatePicker?.attach(document); } catch(_) {}
            }

            // Late time field: time picker attachment  
            if(q === 'pickup_time'){
              try { attachPickupTimePicker(document, el); } catch(_) {}
            }

            // Late passenger field: dropdown select
            if(q === 'number_of_passengers'){
              try { 
                if (window.__passengerSelect && window.__passengerSelect.attach) {
                  window.__passengerSelect.attach(document);
                }
              } catch(_) {}
            }
          }
        });

        // If a SUBMIT button was inserted
        if(node.matches?.('.ghl-btn.ghl-submit-btn') ||
           node.querySelector?.('.ghl-btn.ghl-submit-btn')){
          enhanceSubmitButton(document);
        }

        // If a NEXT button was inserted
        if(node.matches?.('.ghl-btn.ghl-footer-next') ||
           node.querySelector?.('.ghl-btn.ghl-footer-next')){
          enhanceNextButtonMobile(document);
        }
      });
    }
  });

  obs.observe(document.documentElement, { subtree:true, childList:true });
  window.__iconFieldObserver = obs;
})();
         

  /* ===== Section 10: Maps Initialization + Airport Data + Retry + Prediction Prioritizer
    Purpose: Define geographic bounds, airport metadata, wire autocomplete (including late fields),
          prioritize predictions (airports > hotels), and expose debug reposition helper.
    Remove airport arrays & prioritizer if you only need basic Places autocomplete.
  ===================================================== */
  loadGoogleMaps(()=>{
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
    
    
    wireAutocomplete(document);
    // Retry wiring in case inputs mount after maps load (GHL async rendering)
    (function retryWireAutocomplete(){
      const start=Date.now();
      const interval=setInterval(()=>{
        try { wireAutocomplete(document); } catch(_) {}
        const allWired=['pickup_location','drop-off_location'].every(q=> document.querySelector(`input[data-q="${q}"]`)?.dataset.placesWired==='1');
        if(allWired || Date.now()-start>12000){ clearInterval(interval); }
      },450);
    })();
	    applyPrefillMaps(document);

    // Prediction prioritizer (airports > hotels > others)
    (function installPredictionFilterAndPriority(){
  if (window.__pacFilterObserver) return;

  const airportKeywords = ['airport','international airport','mbj','kin','ocj','neg','ktp','terminal','sangster','norman manley','ian fleming','negril aerodrome','tinson pen'];
  const hotelKeywords   = ['hotel','resort','inn','villa','guest house','guesthouse','lodgings','spa','apartments','suite','suites','bnb','bed & breakfast','bed and breakfast','all-inclusive','marriott','hilton','hyatt','riu','sandals','iberostar','half moon','secrets','royalton'];

  function score(text){
    const t = text.toLowerCase();
    if (airportKeywords.some(k => t.includes(k))) return 3;
    if (hotelKeywords.some(k => t.includes(k)))   return 2;
    return 1; // addresses (with numbers) fall here; still allowed
  }

  // allow only: addresses (has a number) OR airport/hotel keywords
  function isSpecificEnough(text){
    const t = text.toLowerCase();
    const hasNumber = /\d/.test(t);
    const isAirport = airportKeywords.some(k => t.includes(k));
    const isHotel   = hotelKeywords.some(k => t.includes(k));
    return hasNumber || isAirport || isHotel;
  }

  function process(container){
    const items = [...container.querySelectorAll('.pac-item')];
    if (!items.length) return;

    items.forEach(el => {
      const txt = (el.textContent || '').trim();
      if (!isSpecificEnough(txt)) el.remove(); // drop “Montego Bay”-type areas
    });

    const left = [...container.querySelectorAll('.pac-item')];
    if (left.length < 2) return;

    const scored = left.map((el, i) => ({ el, i, s: score(el.textContent || '') }));
    const sorted = scored.sort((a, b) => (b.s - a.s) || (a.i - b.i));

    let changed = false;
    for (let i = 0; i < sorted.length; i++){
      if (sorted[i].el !== left[i]) { changed = true; break; }
    }
    if (!changed) return;

    const frag = document.createDocumentFragment();
    sorted.forEach(s => frag.appendChild(s.el));
    container.appendChild(frag);
  }

  function attach(){
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
})();

  // Debug helper: window.__tpFix() to reposition time popover manually
    window.__tpFix = function(){
      const p=document.getElementById('pickup-time-popover'); const i=document.querySelector('input[data-q="pickup_time"]');
      if(!p||!i) return 'missing element';
      const r=i.getBoundingClientRect();
      Object.assign(p.style,{top:(window.scrollY+r.bottom+4)+'px', left:(window.scrollX+r.left)+'px'});
      return 'repositioned';
    };
  });
});