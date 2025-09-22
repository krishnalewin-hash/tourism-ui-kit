// Singleton time picker; writes value and dispatches input/change

// Global namespace for booking form
window.BookingForm = window.BookingForm || {};

window.BookingForm.attachPickupTimePicker = function(root=document){
  const CONFIG = window.BookingForm.getConfig();
  if (window.__singletonTimePicker) return;

  const state = { open:false, input:null, h:6, m:0 };
  const rootEl = document.createElement('div');
  rootEl.id='pickup-time-popover';
  rootEl.style.cssText='position:absolute;z-index:2147483647;background:#fff;border:1px solid #444;border-radius:8px;box-shadow:0 6px 22px rgba(0,0,0,.18);padding:10px;display:none;min-width:230px';
  rootEl.innerHTML = `<div style="display:flex;gap:18px;justify-content:center">
    <div data-col="hour" style="text-align:center;"><button data-act="hu">▲</button><div data-part="hour" style="font-size:28px;font-weight:600;margin:6px 0">06</div><button data-act="hd">▼</button></div>
    <div style="font-size:28px;padding-top:22px;font-weight:700">:</div>
    <div data-col="minute" style="text-align:center;"><button data-act="mu">▲</button><div data-part="minute" style="font-size:28px;font-weight:600;margin:6px 0">00</div><button data-act="md">▼</button></div>
    <div data-col="ampm" style="text-align:center" data-ampm-col><button data-act="tu">▲</button><div data-part="ampm" style="font-size:28px;font-weight:600;margin:6px 0">AM</div><button data-act="td">▼</button></div>
  </div>
  <div style="display:flex;gap:8px;margin-top:12px"><button data-act="ok" style="background:#188BF6;color:#fff;border:none;padding:8px 36px;border-radius:6px">OK</button><button data-act="x">Cancel</button></div>`;
  document.body.appendChild(rootEl);

  const cfgRef = () => config.time || { start:'00:00', end:'23:59', stepMinutes:15, format12:true };

  const parse = (str) => {
    if(!str) return null;
    const m=str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if(!m) return null;
    let h=+m[1], mn=+m[2];
    if(m[3]){ const ap=m[3].toUpperCase(); if(ap==='PM'&&h<12) h+=12; if(ap==='AM'&&h===12) h=0; }
    return {h,m:mn};
  };
  const clamp = (h,m) => {
    const [sh,sm]=cfgRef().start.split(':').map(Number);
    const [eh,em]=cfgRef().end.split(':').map(Number);
    const S=sh*60+sm, E=eh*60+em;
    let t=h*60+m; if (t<S) t=S; if (t>E) t=E; return { h:Math.floor(t/60), m:t%60 };
  };
  const quant = (m) => Math.floor(m / (cfgRef().stepMinutes||15))*(cfgRef().stepMinutes||15);
  const fmt = (h,m) => cfgRef().format12
    ? `${String(((h%12)||12)).padStart(2,'0')}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`
    : `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;

  function update(){
    const hourEl=rootEl.querySelector('[data-part="hour"]');
    const minEl =rootEl.querySelector('[data-part="minute"]');
    const apEl  =rootEl.querySelector('[data-part="ampm"]');
    if (cfgRef().format12){
      let hh = state.h%12; if (hh===0) hh=12;
      hourEl.textContent = String(hh).padStart(2,'0');
      apEl.textContent = state.h>=12?'PM':'AM';
    } else {
      hourEl.textContent = String(state.h).padStart(2,'0');
      apEl.parentElement.style.display = 'none';
    }
    minEl.textContent = String(quant(state.m)).padStart(2,'0');
  }

  function openFor(input){
    state.input=input;
    const cur=parse(input.value)||parse(cfgRef().start)||{h:6,m:0};
    ({h:state.h,m:state.m} = clamp(cur.h, cur.m));
    update();
    const r=input.getBoundingClientRect();
    Object.assign(rootEl.style,{ display:'block', top: window.scrollY+r.bottom+6+'px', left: window.scrollX+r.left+'px' });
    state.open=true;
    setTimeout(()=>{ document.addEventListener('mousedown', onDoc, true); document.addEventListener('keydown', onKey, true); },0);
  }
  function close(){ if(!state.open) return; state.open=false; rootEl.style.display='none'; document.removeEventListener('mousedown', onDoc, true); document.removeEventListener('keydown', onKey, true); }
  function onDoc(e){ if(rootEl.contains(e.target) || e.target===state.input) return; close(); }
  function onKey(e){ if(e.key==='Escape'){ close(); state.input?.focus(); } }

  rootEl.addEventListener('click', e=>{
    const act=e.target.getAttribute('data-act'); if(!act) return;
    if(act==='hu') state.h=(state.h+1+24)%24;
    if(act==='hd') state.h=(state.h-1+24)%24;
    if(act==='mu') state.m=(state.m+(cfgRef().stepMinutes||15))%60;
    if(act==='md') state.m=(state.m-(cfgRef().stepMinutes||15)+60)%60;
    if(act==='tu'||act==='td') state.h=(state.h+12)%24;
    if(act==='ok'){ 
      const val=fmt(state.h, quant(state.m));
      state.input.value = val; state.input.setAttribute('value', val);
      state.input.dispatchEvent(new Event('input',{bubbles:true}));
      state.input.dispatchEvent(new Event('change',{bubbles:true}));
      close(); return;
    }
    if(act==='x'){ close(); return; }
    ({h:state.h,m:state.m} = clamp(state.h, state.m)); update();
  });

  // wire input
  const input = root.querySelector('input[data-q="pickup_time"]');
  if (input && !input.dataset.timeSpinnerWired) {
    input.dataset.timeSpinnerWired='1';
    input.type='text'; input.readOnly=true; input.style.cursor='pointer';
    input.autocomplete='off';
    input.addEventListener('click', ()=> openFor(input));
    input.addEventListener('focus', ()=> openFor(input));
  }

  window.__singletonTimePicker = { openFor, close };
};