// Validates step 1 on NEXT (pickup, drop-off, date, time, passengers)
// Adds inline messages and fade-out animation before advancing

export function installStep1Validation(){
  if (window.__stepOneNextValidation) return;

  const SELECTORS = [
    'input[data-q="pickup_location"]',
    'input[data-q="drop-off_location"]',
    'input[data-q="pickup_date"]',
    'input[data-q="pickup_time"]',
    'input[data-q="number_of_passengers"]',
    'select[data-q="number_of_passengers"]'
  ];
  const MSG = {
    'pickup_location':'Please enter a pickup location.',
    'drop-off_location':'Please enter a drop-off location.',
    'pickup_date':'Please choose a pickup date.',
    'pickup_time':'Please choose a pickup time.',
    'number_of_passengers':'Please enter the number of passengers.'
  };

  function isVisible(el){
    if(!el || el.disabled || el.type==='hidden') return false;
    const s=getComputedStyle(el); if(s.display==='none'||s.visibility==='hidden') return false;
    const r=el.getBoundingClientRect(); return r.width>0 && r.height>0;
  }
  function ensureMsg(container){
    let msg = container.querySelector(':scope > .field-error');
    if(!msg){ msg=document.createElement('div'); msg.className='field-error'; container.appendChild(msg); }
    return msg;
  }
  function showError(el, text){
    try{ el.setCustomValidity?.(text);}catch{}
    el.classList.add('input-error'); el.setAttribute('aria-invalid','true');
    const cont = el.closest('.icon-field-wrapper') || el.parentElement || el;
    ensureMsg(cont).textContent = text;
    cont.classList.remove('shake'); void cont.offsetWidth; cont.classList.add('shake');
    setTimeout(()=> cont.classList.remove('shake'), 500);
  }
  function clearError(el){
    try{ el.setCustomValidity?.(''); }catch{}
    el.removeAttribute('aria-invalid'); el.classList.remove('input-error');
    const cont = el.closest('.icon-field-wrapper') || el.parentElement || el;
    const msg = cont.querySelector(':scope > .field-error'); if(msg) msg.textContent = '';
  }
  function validate(){
    const nodes = SELECTORS.map(s=>document.querySelector(s)).filter(Boolean);
    let first=null;
    for(const el of nodes){
      if(!isVisible(el)) continue;
      const v=(el.value||'').trim();
      if(!v){ showError(el, MSG[el.getAttribute('data-q')] || 'This field is required.'); if(!first) first=el; }
      else { clearError(el); }
    }
    if(first){
      try{ first.scrollIntoView({behavior:'smooth', block:'center'});}catch{}
      setTimeout(()=>{ try{ first.focus({preventScroll:true}); }catch{} }, 180);
      try{ first.reportValidity?.(); }catch{}
      return false;
    }
    return true;
  }

  function animateThenAdvance(btn){
    const container = btn.closest('.survey-form-step, .ghl-question-set, .hl_form-builder--step, .ghl-form-wrap') || document.body;
    const target = container.querySelector('.ghl-questions, .ghl-form-rows, .survey-form-content') || container;
    target.classList.add('bf-fade-anim'); void target.offsetWidth; target.classList.add('bf-fade-out');
    setTimeout(()=>{
      window.__allowNextOnce = true;
      target.classList.remove('bf-fade-out'); target.classList.remove('bf-fade-anim');
      setTimeout(()=> { try{ btn.click(); }catch{} }, 0);
    }, 230);
  }

  const onClick = (e)=>{
    const btn = e.target.closest?.('.ghl-btn.ghl-footer-next'); if(!btn) return;
    if(window.__allowNextOnce){ window.__allowNextOnce=false; return; }
    const ok = validate();
    if(!ok){ e.preventDefault(); e.stopPropagation(); }
    else { e.preventDefault(); e.stopPropagation(); animateThenAdvance(btn); }
  };

  document.addEventListener('click', onClick, true);
  document.addEventListener('mousedown', onClick, true);
  window.__stepOneNextValidation = true;
}