/* ===== Date Picker Module =====
   Purpose: Custom calendar popup for date selection with past date prevention
   Handles: Calendar grid generation, month navigation, date selection, formatting
================================================= */

function initDatePicker() {
  if(window.__pickupDatePicker) return;
  
  const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const WEEKDAYS_SHORT=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  
  function formatVerbose(d) { 
    const wd=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]; 
    const mon=MONTHS[d.getMonth()].slice(0,3); 
    return `${wd}, ${mon} ${d.getDate()}, ${d.getFullYear()}`; 
  }
  
  const pop=document.createElement('div'); 
  pop.id='pickup-date-popover'; 
  pop.setAttribute('role','dialog'); 
  pop.setAttribute('aria-hidden','true'); 
  pop.style.cssText='position:absolute;z-index:2147483647;background:#fff;border:1px solid #ccc;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);padding:16px;display:none;font:14px/1.4 system-ui,Arial,sans-serif;min-width:280px;';
  document.body.appendChild(pop);
  
  const state={open:false, month:new Date().getMonth(), year:new Date().getFullYear(), input:null};
  
  function todayStart() { 
    const d=new Date(); 
    d.setHours(0,0,0,0); 
    return d; 
  }
  
  function build() {
    const first=new Date(state.year,state.month,1); 
    const startDow=first.getDay();
    const daysInMonth=new Date(state.year,state.month+1,0).getDate();
    const prevDays=new Date(state.year,state.month,0).getDate();
    
    let html=`<div class="dp-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <button type="button" class="dp-nav" data-nav="-1" aria-label="Previous Month" style="background:none;border:none;font-size:18px;cursor:pointer;padding:4px 8px;">‹</button>
      <div style="font-weight:600;font-size:16px;">${MONTHS[state.month]} ${state.year}</div>
      <button type="button" class="dp-nav" data-nav="1" aria-label="Next Month" style="background:none;border:none;font-size:18px;cursor:pointer;padding:4px 8px;">›</button>
    </div>`;
    
    html+=`<div class="dp-weekdays" style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:8px;">
      ${WEEKDAYS_SHORT.map(w=>`<div style="text-align:center;font-weight:600;color:#666;padding:4px;">${w}</div>`).join('')}
    </div>`;
    
    html+='<div class="dp-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">';
    
    // leading blanks from previous month (disabled)
    for(let i=0;i<startDow;i++) { 
      const d=prevDays-startDow+i+1; 
      html+=`<div class="dp-day dp-disabled" aria-hidden="true" style="padding:8px;text-align:center;color:#ccc;cursor:not-allowed;">${d}</div>`; 
    }
    
    const today=todayStart();
    for(let day=1; day<=daysInMonth; day++) {
      const current=new Date(state.year,state.month,day); 
      current.setHours(0,0,0,0);
      const disabled=current<today; 
      const isToday=current.getTime()===today.getTime();
      
      let styles = 'padding:8px;text-align:center;cursor:pointer;border-radius:4px;';
      if(disabled) {
        styles += 'color:#ccc;cursor:not-allowed;';
      } else {
        styles += 'color:#333;';
        if(isToday) {
          styles += 'background:#e3f2fd;font-weight:600;';
        } else {
          styles += 'background:transparent;';
        }
        styles += 'transition:background 0.2s;';
      }
      
      html+=`<div class="dp-day${disabled?' dp-disabled':''}${isToday?' dp-today':''}" 
                   data-day="${day}" 
                   role="button" 
                   tabindex="${disabled?-1:0}" 
                   aria-disabled="${disabled}" 
                   aria-label="${MONTHS[state.month]} ${day}, ${state.year}"
                   style="${styles}"
                   onmouseover="if(!this.classList.contains('dp-disabled')) this.style.background='#f5f5f5'"
                   onmouseout="if(!this.classList.contains('dp-disabled')) this.style.background='${isToday?'#e3f2fd':'transparent'}'">${day}</div>`;
    }
    html+='</div>';
    pop.innerHTML=html;
  }
  
  function openFor(input) { 
    state.input=input; 
    const now=new Date(); 
    state.month=now.getMonth(); 
    state.year=now.getFullYear(); 
    build(); 
    position(); 
    pop.style.display='block'; 
    pop.setAttribute('aria-hidden','false'); 
    state.open=true; 
    setTimeout(()=>{ 
      document.addEventListener('mousedown',outside,true); 
      document.addEventListener('keydown',keyNav,true); 
    },0); 
  }
  
  function close() { 
    if(!state.open) return; 
    state.open=false; 
    pop.style.display='none'; 
    pop.setAttribute('aria-hidden','true'); 
    document.removeEventListener('mousedown',outside,true); 
    document.removeEventListener('keydown',keyNav,true); 
  }
  
  function position() { 
    if(!state.input) return; 
    const r=state.input.getBoundingClientRect(); 
    pop.style.top=window.scrollY + r.bottom + 6 + 'px'; 
    pop.style.left=window.scrollX + r.left + 'px'; 
  }
  
  function outside(e) { 
    if(pop.contains(e.target) || e.target===state.input) return; 
    close(); 
  }
  
  function keyNav(e) { 
    if(e.key==='Escape') { 
      close(); 
      state.input?.focus(); 
    } 
  }
  
  pop.addEventListener('click',e => {
    const nav=e.target.getAttribute('data-nav'); 
    if(nav) { 
      state.month+= +nav; 
      if(state.month<0) { 
        state.month=11; 
        state.year--; 
      } else if(state.month>11) { 
        state.month=0; 
        state.year++; 
      } 
      build(); 
      return; 
    } 
    
    const day=e.target.getAttribute('data-day'); 
    if(day) { 
      const sel=new Date(state.year,state.month,+day); 
      if(sel<todayStart()) return; 
      const formatted=formatVerbose(sel); 
      state.input.value=formatted; 
      state.input.setAttribute('value',formatted); 
      state.input.dispatchEvent(new Event('input',{bubbles:true})); 
      state.input.dispatchEvent(new Event('change',{bubbles:true})); 
      close(); 
    }
  });
  
  window.addEventListener('resize',()=> position()); 
  window.addEventListener('scroll',()=> position(), true);
  
  function attach(rootDoc) { 
    const input=rootDoc.querySelector('input[data-q="pickup_date"]'); 
    if(!input || input.dataset.datePickerWired==='1') return; 
    input.dataset.datePickerWired='1'; 
    input.readOnly=true; 
    input.style.cursor='pointer';
    input.addEventListener('focus',()=> openFor(input)); 
    input.addEventListener('click',()=> openFor(input)); 
  }
  
  window.__pickupDatePicker={ openFor, close, attach };
  
  // initial attach
  attach(document);
}

// Initialize the date picker
initDatePicker();

// Export date picker functionality
window.QuoteFormConfig = window.QuoteFormConfig || {};
window.QuoteFormConfig.initDatePicker = initDatePicker;

export { initDatePicker };