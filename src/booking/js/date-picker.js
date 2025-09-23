// Small popup calendar → writes formatted string, fires input/change

// Global namespace for booking form
window.BookingForm = window.BookingForm || {};

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