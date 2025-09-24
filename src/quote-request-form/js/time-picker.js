// Time picker - using IIFE singleton pattern from temp.js
window.BookingForm = window.BookingForm || {};

(function initSingletonTimePicker(){
  if(window.__singletonTimePicker) return; // already initialized
  const cfgRef = () => window.BookingForm.CONFIG.time;
  const state = { open:false, input:null, h:6, m:0 };
  const root = document.createElement('div');
  root.id='pickup-time-popover';
  root.style.cssText='position:absolute;inset:auto auto auto auto;z-index:2147483647;background:#fff;border:1px solid #444;border-radius:8px;box-shadow:0 6px 22px rgba(0,0,0,.18);padding:10px;display:none;min-width:230px;font:14px/1.2 system-ui,Arial,sans-serif;';
  root.innerHTML=`<div style="display:flex;gap:18px;justify-content:center;align-items:flex-start;">
    <div data-col="hour" style="text-align:center;">
      <button type="button" data-act="hu" aria-label="Hour up" style="all:unset;cursor:pointer;font-size:16px;">▲</button>
      <div data-part="hour" style="font-size:28px;font-weight:600;margin:6px 0 6px;">06</div>
      <button type="button" data-act="hd" aria-label="Hour down" style="all:unset;cursor:pointer;font-size:16px;">▼</button>
    </div>
    <div style="font-size:28px;padding-top:22px;font-weight:700;">:</div>
    <div data-col="minute" style="text-align:center;">
      <button type="button" data-act="mu" aria-label="Minute up" style="all:unset;cursor:pointer;font-size:16px;">▲</button>
      <div data-part="minute" style="font-size:28px;font-weight:600;margin:6px 0 6px;">00</div>
      <button type="button" data-act="md" aria-label="Minute down" style="all:unset;cursor:pointer;font-size:16px;">▼</button>
    </div>
    <div data-col="ampm" style="text-align:center;" data-ampm-col>
      <button type="button" data-act="tu" aria-label="Toggle AM/PM" style="all:unset;cursor:pointer;font-size:16px;">▲</button>
      <div data-part="ampm" style="font-size:28px;font-weight:600;margin:6px 0 6px;">AM</div>
      <button type="button" data-act="td" aria-label="Toggle AM/PM" style="all:unset;cursor:pointer;font-size:16px;">▼</button>
    </div>
  </div>
  <div style="display:flex;justify-content:flex-start;margin-top:12px;">
    <button type="button" data-act="ok" style="background:#188BF6;color:#FFF;font-weight:600;border:none;padding:8px 40px;border-radius:6px;cursor:pointer;">OK</button>
    <button type="button" data-act="x" style="margin-left:8px;background:transparent;color:#666;border:none;padding:8px 10px;cursor:pointer;">Cancel</button>
  </div>`;
  document.body.appendChild(root);
  function parse(str){ if(!str) return null; const m=str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if(!m) return null; let h=+m[1]; const mn=+m[2]; if(m[3]){ const ap=m[3].toUpperCase(); if(ap==='PM'&&h<12) h+=12; if(ap==='AM'&&h===12) h=0; } if(h>23||mn>59) return null; return {h,m:mn}; }
  function clamp(h,m){
    // Constrains within configured window (now full day 00:00–23:59 unless changed)
    const cfg=cfgRef(); const [sh,sm]=cfg.start.split(':').map(Number); const [eh,em]=cfg.end.split(':').map(Number);
    let mins=h*60+m; const s=sh*60+sm, e=eh*60+em; if(mins<s) mins=s; if(mins>e) mins=e; return {h:Math.floor(mins/60), m:mins%60};
  }
  function fmt(h,m){ const cfg=cfgRef(); if(cfg.format12){ const ap=h>=12?'PM':'AM'; let hh=h%12; if(hh===0) hh=12; return `${String(hh).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ap}`; } return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; }
  function quantize(m){
    const step = cfgRef().stepMinutes || 15;
    return Math.floor(m / step) * step;
  }
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
  function openFor(input){ const cfg=cfgRef(); state.input=input; const cur=parse(input.value)&&parse(input.value) || parse(cfg.start) || {h:6,m:0}; state.h=cur.h; state.m=quantize(cur.m); ({h:state.h,m:state.m}=clamp(state.h,state.m)); updateDisplay(); const r=input.getBoundingClientRect(); root.style.display='block'; root.style.top=window.scrollY + r.bottom + 6 + 'px'; root.style.left=window.scrollX + r.left + 'px'; state.open=true; setTimeout(()=>{ document.addEventListener('mousedown', outside, true); document.addEventListener('keydown', keyNav, true); },0); }
  function close(){ if(!state.open) return; state.open=false; root.style.display='none'; document.removeEventListener('mousedown', outside, true); document.removeEventListener('keydown', keyNav, true); }
  function outside(e){ if(root.contains(e.target) || e.target===state.input) return; close(); }
  function keyNav(e){ if(e.key==='Escape'){ close(); state.input?.focus(); } else if(e.key==='Enter'){ commit(); } }
  function commit(){
    if(!state.input) return;
    const val = fmt(state.h, quantize(state.m));
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
})();

// Wire one or more pickup time inputs to the singleton picker
window.BookingForm.attachPickupTimePicker = function(rootDoc, specificEl){
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
};