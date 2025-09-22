// Small popup calendar → writes formatted string, fires input/change

// Global namespace for booking form
window.BookingForm = window.BookingForm || {};

window.BookingForm.initDatePicker = function(root=document){
  if (window.__pickupDatePicker) return;
  const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const WD=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const pop=document.createElement('div'); pop.id='pickup-date-popover';
  pop.style.cssText='position:absolute;z-index:2147483646;background:#fff;border:1px solid #444;border-radius:8px;box-shadow:0 6px 22px rgba(0,0,0,.18);padding:10px 12px;width:320px;display:none';
  document.body.appendChild(pop);

  const state={open:false, month:new Date().getMonth(), year:new Date().getFullYear(), input:null};
  const today=()=>{ const d=new Date(); d.setHours(0,0,0,0); return d; };

  function build(){
    const first=new Date(state.year,state.month,1);
    const startDow=first.getDay();
    const daysInMonth=new Date(state.year,state.month+1,0).getDate();
    let html=`<div class="dp-header" style="display:flex;justify-content:space-between;margin-bottom:10px;font-weight:600">
      <button type="button" data-nav="-1">‹</button>
      <div>${MONTHS[state.month]} ${state.year}</div>
      <button type="button" data-nav="1">›</button></div>`;
    html+=`<div class="dp-weekdays" style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:4px">${WD.map(w=>`<div style="text-align:center;font-size:12px">${w}</div>`).join('')}</div>`;
    html+=`<div class="dp-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">`;
    for(let i=0;i<startDow;i++){ html+=`<div class="dp-day dp-disabled" style="opacity:.35">${new Date(state.year,state.month, -startDow+i+1).getDate()}</div>`; }
    const T=today().getTime();
    for(let day=1; day<=daysInMonth; day++){
      const ts=new Date(state.year,state.month,day).setHours(0,0,0,0);
      const dis = ts < T;
      const style = 'width:100%;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;border-radius:6px;cursor:'+(dis?'not-allowed':'pointer');
      html+=`<div class="dp-day${dis?' dp-disabled':''}" data-day="${day}" style="${style}" aria-disabled="${dis}" tabindex="${dis?-1:0}">${day}</div>`;
    }
    html+='</div>';
    pop.innerHTML=html;
  }
  function openFor(input){ state.input=input; const now=new Date(); state.month=now.getMonth(); state.year=now.getFullYear(); build(); const r=input.getBoundingClientRect(); pop.style.display='block'; pop.style.top=window.scrollY+r.bottom+6+'px'; pop.style.left=window.scrollX+r.left+'px'; state.open=true;
    setTimeout(()=>{ document.addEventListener('mousedown', onDoc, true); document.addEventListener('keydown', onKey, true); },0);
  }
  function close(){ if(!state.open) return; state.open=false; pop.style.display='none'; document.removeEventListener('mousedown', onDoc, true); document.removeEventListener('keydown', onKey, true); }
  function onDoc(e){ if(pop.contains(e.target) || e.target===state.input) return; close(); }
  function onKey(e){ if(e.key==='Escape'){ close(); state.input?.focus(); } }

  pop.addEventListener('click', e=>{
    const nav=e.target.getAttribute('data-nav');
    if (nav){ state.month += +nav; if(state.month<0){state.month=11;state.year--;} if(state.month>11){state.month=0;state.year++;} build(); return; }
    const day=e.target.getAttribute('data-day');
    if(day){
      const d = new Date(state.year,state.month,+day);
      const val = `${WD[d.getDay()]}, ${MONTHS[d.getMonth()].slice(0,3)} ${d.getDate()}, ${d.getFullYear()}`;
      state.input.value = val;
      state.input.setAttribute('value', val);
      state.input.dispatchEvent(new Event('input', { bubbles:true }));
      state.input.dispatchEvent(new Event('change', { bubbles:true }));
      close();
    }
  });

  window.__pickupDatePicker = { openFor: (input)=>openFor(input), close };
  // wire current input
  const input = document.querySelector('input[data-q="pickup_date"]');
  if (input) {
    window.BookingForm.attachPickupDateGuard(document);
    input.readOnly = true;
    input.addEventListener('focus', ()=> openFor(input));
    input.addEventListener('click',  ()=> openFor(input));
  }
};