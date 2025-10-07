/* ===== Step 1 Validation Module =====
   Purpose: Validate Step 1 fields when NEXT button is clicked
   Handles: Field validation, shake animations, error messages, form progression
================================================= */

function initStepOneValidation() {
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
  function findStepContainerFrom(el) {
    let node = el.closest?.('.survey-form-step, .ghl-question-set, .hl_form-builder--step, .ghl-form-wrap, form') || el.parentElement;
    let depth = 0;
    while(node && depth < 6) {
      try {
        const rect = node.getBoundingClientRect();
        if(rect.height > 120 && node.querySelector?.('input[data-q], .ghl-btn')) return node;
      } catch(_) { /* noop */ }
      node = node.parentElement;
      depth++;
    }
    return document.querySelector('.ghl-question-set') || el.closest?.('form') || document.body;
  }

  // Utility: get visible elements for the provided selectors
  function getVisibleNodes(selectors) {
    const nodes = selectors.map(sel => document.querySelector(sel)).filter(Boolean);
    return nodes.filter(el => {
      const s = getComputedStyle(el);
      if(el.disabled || el.type==='hidden' || s.display==='none' || s.visibility==='hidden') return false;
      const r = el.getBoundingClientRect();
      return r.width>0 && r.height>0;
    });
  }

  // Utility: compute the deepest common ancestor that still contains all nodes
  function deepestCommonAncestor(nodes) {
    if(!nodes || !nodes.length) return null;
    // Build ancestor chains for each node (upwards to html)
    const chains = nodes.map(n => { 
      const path=[]; 
      let x=n; 
      while(x) { 
        path.push(x); 
        x=x.parentElement; 
      } 
      return path; 
    });
    // Start from the first chain, find the first element present in all other chains
    let lca = null;
    outer: for(const candidate of chains[0]) {
      for(let i=1;i<chains.length;i++) {
        if(!chains[i].includes(candidate)) continue outer;
      }
      lca = candidate; 
      break;
    }
    if(!lca) return null;
    // Walk down while there is exactly one child that contains all nodes
    let curr = lca;
    while(true) {
      const children = Array.from(curr.children || []);
      const carriers = children.filter(ch => nodes.every(nd => ch.contains(nd)));
      if(carriers.length === 1) { 
        curr = carriers[0]; 
      } else { 
        break; 
      }
    }
    return curr;
  }

  // Choose the element to animate: prefer the deepest common ancestor within the container
  function pickAnimTarget(container, selectors) {
    try {
      const nodes = getVisibleNodes(selectors);
      const dca = deepestCommonAncestor(nodes);
      if(dca && container.contains(dca) && dca !== container) return dca;
    } catch(_) { /* noop */ }
    // Fallback: try common inner wrappers
    const fallback = container.querySelector('.ghl-questions, .ghl-form-rows, .survey-form-content, .survey-form-step .content, .hl_form-builder--step .step-content, .ghl-form-wrap .ghl-content, .ghl-form-container');
    return fallback || container;
  }

  function animateNextThenAdvance(btn) {
    if(window.__bfAnimating) return; // avoid overlap
    const container = findStepContainerFrom(btn);
    if(!container) { 
      window.__allowNextOnce = true; 
      setTimeout(()=>btn.click(),0); 
      return; 
    }
    // Animate only the fields area so the outer white background remains
    const animTarget = pickAnimTarget(container, SELECTORS);
    window.__bfAnimating = true;
    animTarget.classList.add('bf-fade-anim');
    // Force reflow before applying out state
    void animTarget.offsetWidth;
    animTarget.classList.add('bf-fade-out');
    // After fade-out, re-trigger the click once (bypassing our guard), then fade-in Step 2
    const DUR = 230;
    setTimeout(() => {
      // Allow the framework's native action to run once
      window.__allowNextOnce = true;
      // Remove fade-out to prevent lingering style
      animTarget.classList.remove('bf-fade-out');
      animTarget.classList.remove('bf-fade-anim');
      setTimeout(() => {
        try { btn.click(); } catch(_) {}
        // Try a fade-in on the next step container once it appears
        setTimeout(() => {
          const STEP2_SELECTORS = [
            'input[data-q="email"]',
            'input[data-q="phone"]',
            'input[data-q="full_name"]'
          ];
          const nextField = document.querySelector(STEP2_SELECTORS.join(', '));
          if(nextField) {
            const cont2 = findStepContainerFrom(nextField);
            if(cont2) {
              const target2 = pickAnimTarget(cont2, STEP2_SELECTORS);
              target2.classList.add('bf-fade-anim','bf-fade-in-init');
              void target2.offsetWidth; // reflow
              target2.classList.remove('bf-fade-in-init');
              setTimeout(()=> target2.classList.remove('bf-fade-anim'), DUR + 60);
            }
            // Ensure CTA is applied on step 2
            try { 
              // Try multiple ways to access enhanceSubmitButton
              if (window.QuoteFormConfig?.enhanceSubmitButton) {
                window.QuoteFormConfig.enhanceSubmitButton(document); 
              } else if (typeof enhanceSubmitButton === 'function') {
                enhanceSubmitButton(document);
              } else {
                // Last resort: try to find and call it later
                setTimeout(() => {
                  if (window.QuoteFormConfig?.enhanceSubmitButton) {
                    window.QuoteFormConfig.enhanceSubmitButton(document);
                  }
                }, 100);
              }
            } catch(_) {}
          }
          window.__bfAnimating = false;
        }, 40);
      }, 0);
    }, DUR);
  }

  function isVisible(el) {
    if(!el || el.disabled) return false;
    if(el.type === 'hidden') return false;
    const s = getComputedStyle(el);
    if(s.display==='none' || s.visibility==='hidden') return false;
    const rect = el.getBoundingClientRect();
    return rect.width>0 && rect.height>0;
  }

  function ensureMsgNode(container) {
    let msg = container.querySelector(':scope > .field-error');
    if(!msg) { 
      msg = document.createElement('div'); 
      msg.className='field-error'; 
      container.appendChild(msg); 
    }
    return msg;
  }

  function showError(el, text) {
    try { el.setCustomValidity?.(text); } catch(_) {}
    el.classList.add('input-error');
    el.setAttribute('aria-invalid','true');
    const wrap = el.closest('.icon-field-wrapper');
    const container = wrap || el.parentElement || el;
    // Keep the border only on the input; wrapper is used for shake positioning only
    const msg = ensureMsgNode(container);
    msg.textContent = text;
    container.classList.remove('shake'); 
    void container.offsetWidth; 
    container.classList.add('shake');
    setTimeout(()=> container.classList.remove('shake'), 500);
  }

  function clearError(el) {
    try { el.setCustomValidity?.(''); } catch(_) {}
    el.removeAttribute('aria-invalid');
    el.classList.remove('input-error');
    const wrap = el.closest('.icon-field-wrapper');
    const container = wrap || el.parentElement || el;
    const msg = container.querySelector(':scope > .field-error');
    if(msg) msg.textContent = '';
  }

  function hookClearOnInput(el) {
    if(el.dataset.step1Wired==='1') return;
    el.dataset.step1Wired='1';
    const h = () => { 
      if((el.value||'').trim()) clearError(el); 
    };
    el.addEventListener('input', h);
    el.addEventListener('change', h);
  }

  function validateStep1() {
    const nodes = SELECTORS.map(sel => document.querySelector(sel)).filter(Boolean);
    let firstInvalid = null;
    for(const el of nodes) {
      hookClearOnInput(el);
      if(!isVisible(el)) continue; // ignore hidden in this step
      const v = (el.value||'').trim();
      if(!v) {
        const q = el.getAttribute('data-q') || '';
        showError(el, MESSAGES[q] || 'This field is required.');
        if(!firstInvalid) firstInvalid = el;
      } else {
        clearError(el);
      }
    }
    if(firstInvalid) {
      try { firstInvalid.scrollIntoView({ behavior:'smooth', block:'center' }); } catch(_) {}
      setTimeout(()=>{ try { firstInvalid.focus({ preventScroll:true }); } catch(_) {} }, 200);
      try { firstInvalid.reportValidity?.(); } catch(_) {}
      return false;
    }
    return true;
  }

  // Delegate click on NEXT buttons so we catch dynamically-rendered ones too
  document.addEventListener('click', (e) => {
    const btn = e.target.closest?.('.ghl-btn.ghl-footer-next');
    if(!btn) return;
    // One-time bypass to avoid recursion when we re-trigger the click after animation
    if(window.__allowNextOnce) { 
      window.__allowNextOnce = false; 
      return; 
    }
    const ok = validateStep1();
    if(!ok) {
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
  document.addEventListener('mousedown', (e) => {
    const btn = e.target.closest?.('.ghl-btn.ghl-footer-next');
    if(!btn) return;
    // One-time bypass for programmatic click
    if(window.__allowNextOnce) { return; }
    if(!validateStep1()) {
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
}

// Export validation functionality
window.QuoteFormConfig = window.QuoteFormConfig || {};
window.QuoteFormConfig.initStepOneValidation = initStepOneValidation;

export { initStepOneValidation };