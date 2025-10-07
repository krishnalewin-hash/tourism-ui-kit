/* ===== Button Enhancer Module =====
   Purpose: Enhance NEXT and SUBMIT buttons with styling and mobile adaptations
   Handles: Mobile NEXT labels, CTA styling, responsive button behavior
================================================= */

// Enhance Step 1 NEXT button on mobile by appending a "NEXT" label next to the arrow
function enhanceNextButtonMobile(rootDoc) {
  if(!rootDoc) rootDoc = document;
  const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  const btns = rootDoc.querySelectorAll('.ghl-btn.ghl-footer-next');
  
  btns.forEach(btn => {
    let labelSpan = btn.querySelector('.bf-next-label');
    if(isMobile) {
      // Ensure alignment class exists only on mobile
      btn.classList.add('bf-next');
      // Add or move label to the first position
      if(!labelSpan) {
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

// Enhance the Step 2 submit button with CTA text + white arrow
function enhanceSubmitButton(rootDoc) {
  if(!rootDoc) rootDoc = document;
  const btns = rootDoc.querySelectorAll('.ghl-btn.ghl-submit-btn');
  
  btns.forEach(btn => {
    if(btn.dataset.bfCtaWired === '1') return;
    // Replace text with our CTA while preserving the button element and its listeners
    const label = 'GET YOUR QUOTES!';
    btn.classList.add('bf-cta');
    btn.innerHTML = `<span class="bf-cta-text">${label}</span>`+
      `<span class="bf-arrow" aria-hidden="true">`+
      `<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">`+
      `<line x1="4" y1="12" x2="18" y2="12"></line>`+
      `<polyline points="12,6 18,12 12,18"></polyline>`+
      `</svg>`+
      `</span>`;
    btn.dataset.bfCtaWired = '1';
  });
}

// Initialize responsive behavior for NEXT buttons
function initResponsiveButtons() {
  // Toggle NEXT label on viewport changes
  try {
    const mq = window.matchMedia('(max-width: 768px)');
    const reapply = () => enhanceNextButtonMobile(document);
    if(mq.addEventListener) { 
      mq.addEventListener('change', reapply); 
    } else if(mq.addListener) { 
      mq.addListener(reapply); 
    }
    window.addEventListener('resize', reapply, { passive: true });
  } catch(_) {}
  
  // Initial enhancement
  enhanceNextButtonMobile(document);
  enhanceSubmitButton(document);
}

// Initialize button enhancements
initResponsiveButtons();

// Export button enhancement functions
window.QuoteFormConfig = window.QuoteFormConfig || {};
window.QuoteFormConfig.enhanceNextButtonMobile = enhanceNextButtonMobile;
window.QuoteFormConfig.enhanceSubmitButton = enhanceSubmitButton;

export { enhanceNextButtonMobile, enhanceSubmitButton, initResponsiveButtons };