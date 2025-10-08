// Section 7: Icon Injection / Visual Enhancement from temp.js

// Global namespace for booking form
window.BookingForm = window.BookingForm || {};

// Enhanced layout for date and time fields on desktop (custom from your temp.js)
function enhanceDateTimeLayout(rootDoc) {
  if (!rootDoc) return;
  
  // Find date and time input wrappers
  const dateWrapper = rootDoc.querySelector('.icon-field-wrapper:has(input[data-q="pickup_date"])') ||
                     rootDoc.querySelector('input[data-q="pickup_date"]')?.closest('.icon-field-wrapper');
  const timeWrapper = rootDoc.querySelector('.icon-field-wrapper:has(input[data-q="pickup_time"])') ||
                     rootDoc.querySelector('input[data-q="pickup_time"]')?.closest('.icon-field-wrapper');
  
  if (!dateWrapper || !timeWrapper) return;
  
  // Check if they're siblings and not already in a flex container
  if (dateWrapper.nextElementSibling === timeWrapper && !dateWrapper.parentElement.classList.contains('bf-datetime-container')) {
    // Create flex container
    const container = document.createElement('div');
    container.className = 'bf-datetime-container';
    container.style.cssText = 'display: flex; gap: 12px; align-items: flex-start;';
    
    // Insert container before date wrapper
    dateWrapper.parentElement.insertBefore(container, dateWrapper);
    
    // Move both wrappers into container and set flex properties
    dateWrapper.style.cssText = 'flex: 2; min-width: 0;'; // Date gets more space
    timeWrapper.style.cssText = 'flex: 1; min-width: 0;'; // Time gets less space
    
    container.appendChild(dateWrapper);
    container.appendChild(timeWrapper);
  }
}

// Section 7 implementation from temp.js
function enhanceVisual(rootDoc){
  if(!rootDoc) return;
  const ICONS={
    'pickup_location':`<svg viewBox='0 0 24 24' aria-hidden='true'><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    'drop-off_location':`<svg viewBox='0 0 24 24' aria-hidden='true'><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    'pickup_date':`<svg viewBox='0 0 24 24' aria-hidden='true'><rect x='3' y='5' width='18' height='16' rx='2' ry='2'/><line x1='16' y1='3' x2='16' y2='7'/><line x1='8' y1='3' x2='8' y2='7'/><line x1='3' y1='11' x2='21' y2='11'/></svg>`,
    'pickup_time':`<svg viewBox='0 0 24 24' aria-hidden='true'><circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/></svg>`,
    'number_of_passengers':`<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><path d='M22 21v-2a4 4 0 0 0-3-3.87'/><path d='M16 3.13a4 4 0 0 1 0 7.75'/></svg>`,
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
    if (k === 'number_of_passengers') {
      // Only inject icon for select, not input
      [...rootDoc.querySelectorAll(`select[data-q='${k}']`)].forEach(el=>wrap(el,svg,k));
      [...rootDoc.querySelectorAll(`select[name='${k}']`)].forEach(el=>wrap(el,svg,k));
    } else {
      [...rootDoc.querySelectorAll(`input[data-q='${k}'],select[data-q='${k}']`)].forEach(el=>wrap(el,svg,k));
      [...rootDoc.querySelectorAll(`input[name='${k}'],select[name='${k}']`)].forEach(el=>wrap(el,svg,k));
    }
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

// Initialize survey step transitions (disabled to prevent navigation issues)
// Remove the disabled approach since it causes navigation issues
// (Survey transitions are handled by GoHighLevel's platform)
function initSurveyTransitions() {
  // Intentionally disabled to prevent navigation issues
}

// Enhance the Step 2 submit button with CTA text + white arrow + loading state
function enhanceSubmitButton(rootDoc){
  if(!rootDoc) rootDoc = document;
  const btns = rootDoc.querySelectorAll('.ghl-btn.ghl-submit-btn');
  btns.forEach(btn => {
    if(btn.dataset.bfCtaWired === '1') return;
    // Replace text with our CTA while preserving the button element and its listeners
    const label = 'GET YOUR QUOTE!';
    btn.classList.add('bf-cta');
    btn.innerHTML = `<span class="bf-cta-text">${label}</span>`+
      `<span class="bf-arrow" aria-hidden="true">`+
      `<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">`+
      `<line x1="5" y1="12" x2="19" y2="12" stroke="white" stroke-width="2" stroke-linecap="round"></line>`+
      `<line x1="12" y1="5" x2="19" y2="12" stroke="white" stroke-width="2" stroke-linecap="round"></line>`+
      `<line x1="12" y1="19" x2="19" y2="12" stroke="white" stroke-width="2" stroke-linecap="round"></line>`+
      `</svg>`+
      `</span>`;
    
    // Add loading state functionality with fullscreen overlay approach
    btn.addEventListener('click', function(e) {
      // Check if overlay already exists
      if (document.querySelector('.bf-loading-overlay')) {
        return; // Loading overlay already exists
      }
      
      // Create fullscreen loading overlay immediately
      const loadingOverlay = document.createElement('div');
      loadingOverlay.className = 'bf-loading-overlay';
      loadingOverlay.innerHTML = `
        <div class="bf-loading-content">
          <div class="bf-loading-spinner-container">
            <svg class="bf-spinner" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <circle cx="12" cy="12" r="10" fill="none" stroke="white" stroke-width="2" opacity="0.25"/>
              <path fill="white" d="M4,12a8,8 0 0,1 16,0" opacity="0.75"/>
            </svg>
          </div>
          <span class="bf-loading-text">Processing Your Request...</span>
        </div>
      `;
      
      // Make it fullscreen with subtle styling
      loadingOverlay.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.7) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 999999 !important;
        backdrop-filter: blur(5px) !important;
        font-family: "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      `;
      
      document.body.appendChild(loadingOverlay);
      
      // Check for validation errors after a brief delay
      setTimeout(() => {
        const hasErrors = rootDoc.querySelectorAll('.error, .ghl-error, [data-error="true"], .invalid').length > 0;
        const formElement = btn.closest('form');
        const isFormValid = formElement ? formElement.checkValidity() : true;
        
        if (hasErrors || !isFormValid) {
          // Remove loading overlay if validation fails
          loadingOverlay.remove();
        } else {
          // Keep overlay visible during submission and redirect
        }
      }, 100);
      
    });
    
    btn.dataset.bfCtaWired = '1';
  });
}

// Expose functions on global namespace
window.BookingForm.enhanceVisual = enhanceVisual;
window.BookingForm.enhanceDateTimeLayout = enhanceDateTimeLayout;
window.BookingForm.enhanceNextButtonMobile = enhanceNextButtonMobile;
window.BookingForm.enhanceSubmitButton = enhanceSubmitButton;
window.BookingForm.initSurveyTransitions = initSurveyTransitions;