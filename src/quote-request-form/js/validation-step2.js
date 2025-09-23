// Validates step 2 on SUBMIT (full_name, email, phone)

// Global namespace for booking form
window.BookingForm = window.BookingForm || {};

window.BookingForm.installStepTwoSubmitValidation = function(){
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
};