/* ===== Observer Module =====
   Purpose: Monitor DOM for dynamically added form fields and apply enhancements
   Handles: MutationObserver setup, field detection, enhancement re-application
================================================= */

function initFieldObserver() {
  if(window.__iconFieldObserver) return;

  const targetAttrs = [
    'pickup_location','drop-off_location','pickup_date','pickup_time',
    'number_of_passengers','full_name','email','phone'
  ];

  const obs = new MutationObserver(muts => {
    for(const m of muts) {
      if(!m.addedNodes) continue;

      m.addedNodes.forEach(node => {
        if(!(node instanceof HTMLElement)) return;

        const candidates = node.matches?.('input,select')
          ? [node]
          : [...(node.querySelectorAll?.('input,select') || [])];

        candidates.forEach(el => {
          const q = el.getAttribute('data-q');
          if(q && targetAttrs.includes(q)) {
            console.log(`[Observer] Detected new field: ${q}`);
            
            // Visual & button enhancements (idempotent)
            try {
              if (window.QuoteFormConfig?.enhanceVisual) {
                window.QuoteFormConfig.enhanceVisual(document);
              }
              if (window.QuoteFormConfig?.enhanceNextButtonMobile) {
                window.QuoteFormConfig.enhanceNextButtonMobile(document);
              }
              if (window.QuoteFormConfig?.enhanceSubmitButton) {
                window.QuoteFormConfig.enhanceSubmitButton(document);
              }
            } catch(err) {
              console.warn('[Observer] Visual enhancement error:', err);
            }

            // Prefill attempts (idempotent; guarded internally)
            try {
              if (window.QuoteFormConfig?.applyPrefillBasic) {
                window.QuoteFormConfig.applyPrefillBasic(document);
              }
              if (window.google?.maps && window.QuoteFormConfig?.applyPrefillMaps) {
                window.QuoteFormConfig.applyPrefillMaps(document);
              }
            } catch(err) {
              console.warn('[Observer] Prefill error:', err);
            }

            // Late Maps wiring for location fields
            if((q === 'pickup_location' || q === 'drop-off_location') &&
               window.google?.maps?.places) {
              try { 
                if (window.QuoteFormConfig?.wireAutocomplete) {
                  window.QuoteFormConfig.wireAutocomplete(document);
                }
              } catch(err) {
                console.warn('[Observer] Autocomplete wiring error:', err);
              }
            }
            
            if (q === 'drop-off_location') {
              try { 
                if (window.QuoteFormConfig?.autofillHiddenDropOff) {
                  window.QuoteFormConfig.autofillHiddenDropOff(document);
                }
              } catch(err) {
                console.warn('[Observer] Drop-off autofill error:', err);
              }
            }

            // Late date field: guard + popup attach
            if(q === 'pickup_date') {
              try { 
                if (window.QuoteFormConfig?.attachPickupDateGuard) {
                  window.QuoteFormConfig.attachPickupDateGuard(document);
                }
                if (window.__pickupDatePicker?.attach) {
                  window.__pickupDatePicker.attach(document);
                }
              } catch(err) {
                console.warn('[Observer] Date field enhancement error:', err);
              }
            }

            // Late time field: time picker attachment  
            if(q === 'pickup_time') {
              try { 
                if (window.QuoteFormConfig?.attachPickupTimePicker) {
                  window.QuoteFormConfig.attachPickupTimePicker(document, el);
                }
              } catch(err) {
                console.warn('[Observer] Time picker attachment error:', err);
              }
            }

            // Late passenger field: dropdown select
            if(q === 'number_of_passengers') {
              try { 
                if (window.__passengerSelect?.attach) {
                  window.__passengerSelect.attach(document);
                }
              } catch(err) {
                console.warn('[Observer] Passenger select error:', err);
              }
            }
          }
        });

        // If a SUBMIT button was inserted
        if(node.matches?.('.ghl-btn.ghl-submit-btn') ||
           node.querySelector?.('.ghl-btn.ghl-submit-btn')) {
          try {
            if (window.QuoteFormConfig?.enhanceSubmitButton) {
              window.QuoteFormConfig.enhanceSubmitButton(document);
            }
          } catch(err) {
            console.warn('[Observer] Submit button enhancement error:', err);
          }
        }

        // If a NEXT button was inserted
        if(node.matches?.('.ghl-btn.ghl-footer-next') ||
           node.querySelector?.('.ghl-btn.ghl-footer-next')) {
          try {
            if (window.QuoteFormConfig?.enhanceNextButtonMobile) {
              window.QuoteFormConfig.enhanceNextButtonMobile(document);
            }
          } catch(err) {
            console.warn('[Observer] Next button enhancement error:', err);
          }
        }
      });
    }
  });

  obs.observe(document.documentElement, { subtree:true, childList:true });
  window.__iconFieldObserver = obs;
  
  console.log('[Observer] Field observer initialized');
}

// Export observer functionality
window.QuoteFormConfig = window.QuoteFormConfig || {};
window.QuoteFormConfig.initFieldObserver = initFieldObserver;

export { initFieldObserver };