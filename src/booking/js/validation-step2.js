// Validates step 2 on SUBMIT (full_name, email, phone)

export function installStep2Validation(){
  if (window.__stepTwoSubmitValidation) return;

  const SELECTORS = ['input[data-q="email"]','input[data-q="phone"]','input[data-q="full_name"]'];
  const EMPTY = { email:'Please enter your email address.', phone:'Please enter your phone number.', full_name:'Please enter your full name.' };
  const INVALID= { email:'Please enter a valid email address.' };

  function isVisible(el){ if(!el||el.disabled||el.type==='hidden')return false; const s=getComputedStyle(el); if(s.display==='none'||s.visibility==='hidden')return false; const r=el.getBoundingClientRect(); return r.width>0&&r.height>0; }
  function ensureMsg(c){ let m=c.querySelector(':scope > .field-error'); if(!m){ m=document.createElement('div'); m.className='field-error'; c.appendChild(m);} return m; }
  function showError(el, text){ try{el.setCustomValidity?.(text);}catch{} el.classList.add('input-error'); el.setAttribute('aria-invalid','true'); const c=el.closest('.icon-field-wrapper')||el.parentElement||el; ensureMsg(c).textContent=text; c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); setTimeout(()=>c.classList.remove('shake'),500); }
  function clearError(el){ try{el.setCustomValidity?.('');}catch{} el.removeAttribute('aria-invalid'); el.classList.remove('input-error'); const c=el.closest('.icon-field-wrapper')||el.parentElement||el; const m=c.querySelector(':scope > .field-error'); if(m) m.textContent=''; }

  function validate(){
    const nodes=SELECTORS.map(s=>document.querySelector(s)).filter(Boolean);
    let first=null;
    for(const el of nodes){
      if(!isVisible(el)) continue;
      const q=el.getAttribute('data-q')||''; const v=(el.value||'').trim();
      let msg='';
      if(!v) msg=EMPTY[q]||'This field is required.';
      else if(q==='email' && el.type==='email' && el.validity?.typeMismatch) msg=INVALID[q];
      if(msg){ showError(el,msg); if(!first) first=el; } else { clearError(el); }
    }
    if(first){ try{ first.scrollIntoView({behavior:'smooth',block:'center'});}catch{}; setTimeout(()=>{ try{ first.focus({preventScroll:true}); }catch{} },180); try{ first.reportValidity?.(); }catch{}; return false; }
    return true;
  }

  const handle = (e)=>{ const btn=e.target.closest?.('.ghl-btn.ghl-submit-btn'); if(!btn) return; if(!validate()){ e.preventDefault(); e.stopPropagation(); } };
  document.addEventListener('click', handle, true);
  document.addEventListener('mousedown', handle, true);
  window.__stepTwoSubmitValidation = true;
}