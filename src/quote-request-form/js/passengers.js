// Section X: Passenger Count Select (1–15, then 16+) from temp.js

// Global namespace for booking form
window.BookingForm = window.BookingForm || {};

// Section X implementation from temp.js
(function initPassengerSelect(){
  if (window.__passengerSelect) return;

  // Build a <select> to replace the input[data-q="number_of_passengers"]
  function buildSelectFromInput(input){
    const sel = document.createElement('select');

    // carry core attributes so styling/validation behave the same
    sel.name = input.name || 'number_of_passengers';
    sel.setAttribute('data-q', 'number_of_passengers');
    if (input.id) sel.id = input.id;
    if (input.required) sel.required = true;
    sel.className = input.className; // inherit any theme classes

    // --- Placeholder (pulled from the original input, same source as other fields) ---
    const phText = input.getAttribute('placeholder') || 'Number of Passengers';
    const ph = document.createElement('option');
    ph.value = '';
    ph.textContent = phText;
    ph.disabled = true;
    ph.selected = true;
    ph.hidden = true;
    sel.appendChild(ph);

    // --- 1..15 then 16+ ---
    for (let i = 1; i <= 15; i++){
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = String(i);
      sel.appendChild(opt);
    }
    const big = document.createElement('option');
    big.value = '16+';
    big.textContent = '16+';
    sel.appendChild(big);

    // Preserve an existing value if one was already set on the input
    const cur = (input.value || '').trim();
    if ((/^\d+$/.test(cur) && +cur >= 1 && +cur <= 15) || cur === '16+') {
      sel.value = cur;
    }

    // Make the <select> look exactly like the other inputs (font, radius, shadow, etc.)
    window.BookingForm.matchFieldLook(sel);
    
    // Copy the input's current box-shadow & border color, and reuse on focus.
    (function unifyFocusStyles(select){
      const ref = document.querySelector('.icon-field-wrapper input[data-q]') || document.querySelector('input[data-q]');
      if (!ref) return;
      const cs = getComputedStyle(ref);
      const refShadow = cs.boxShadow;
      const refBorder = cs.borderColor;

      // Set baseline to match inputs
      select.style.boxShadow = refShadow;
      select.style.borderColor = refBorder;

      // Reapply on focus to override theme focus rules
      const apply = () => {
        select.style.boxShadow = refShadow;
        select.style.borderColor = refBorder;
        select.style.backgroundColor = '#fff';
      };
      select.addEventListener('focus', apply);
      select.addEventListener('blur', apply);
    })(sel);

    // Placeholder tint handling
    window.BookingForm.applyPlaceholderClass(sel);
    sel.addEventListener('change', () => {
      sel.setAttribute('value', sel.value);
      window.BookingForm.applyPlaceholderClass(sel);
      sel.dispatchEvent(new Event('input', { bubbles: true }));
    });

    return sel;
  }

  function attach(rootDoc){
    const input = rootDoc.querySelector('input[data-q="number_of_passengers"]');
    // If the select already exists, bail
    const selAlready = rootDoc.querySelector('select[data-q="number_of_passengers"]');
    if (!input || selAlready) return;
    if (input.dataset.paxSelectWired === '1') return;

    // Build the select element
    const selectEl = buildSelectFromInput(input);
    
    // Hide the original input but keep it for GoHighLevel survey submission
    input.style.display = 'none';
    input.style.visibility = 'hidden';
    input.style.position = 'absolute';
    input.style.left = '-9999px';
    
    // Ensure the input is marked as important for GHL survey
    input.setAttribute('data-ghl-survey-field', 'true');
    input.setAttribute('data-step-field', 'step1');
    
    // Insert select after the hidden input (don't replace it)
    input.parentNode.insertBefore(selectEl, input.nextSibling);
    
    // Sync select changes back to the hidden input for GHL survey submission
    selectEl.addEventListener('change', () => {
      input.value = selectEl.value;
      selectEl.setAttribute('value', selectEl.value);
      window.BookingForm.applyPlaceholderClass(selectEl);
      
      // Trigger change event on hidden input for GHL survey
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Additional GHL survey events that might be needed
      try {
        input.dispatchEvent(new Event('blur', { bubbles: true }));
        input.dispatchEvent(new CustomEvent('ghl-field-update', { 
          detail: { field: 'number_of_passengers', value: selectEl.value },
          bubbles: true 
        }));
      } catch(e) {
        console.warn('GHL survey event dispatch failed:', e);
      }
      
      selectEl.dispatchEvent(new Event('input', { bubbles: true }));
    });
    
    // Sync input changes back to the select (for URL parameter population)
    input.addEventListener('change', () => {
      if (input.value && input.value !== selectEl.value) {
        selectEl.value = input.value;
        selectEl.setAttribute('value', selectEl.value);
        window.BookingForm.applyPlaceholderClass(selectEl);
      }
    });
    
    // Also sync any initial value from input to select
    if (input.value) {
      selectEl.value = input.value;
      window.BookingForm.applyPlaceholderClass(selectEl);
    }
    
    // Store references for external access and survey step transitions
    input._syncedSelect = selectEl;
    selectEl._syncedInput = input;
    
    selectEl.dataset.paxSelectWired = '1';
    input.dataset.paxSelectWired = '1';

    // Monitor for GHL survey step transitions
    const monitorSurveySteps = () => {
      // Watch for survey navigation buttons
      const nextButtons = document.querySelectorAll('[data-action="next"], .survey-next, .btn-next, button[type="submit"]');
      const prevButtons = document.querySelectorAll('[data-action="prev"], .survey-prev, .btn-prev');
      
      [...nextButtons, ...prevButtons].forEach(btn => {
        if (!btn.dataset.passengerMonitor) {
          btn.addEventListener('click', () => {
            // Ensure passenger field is synced before step transition
            if (selectEl.value && input.value !== selectEl.value) {
              input.value = selectEl.value;
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
          btn.dataset.passengerMonitor = 'true';
        }
      });
      
      // Watch for survey form submissions
      const forms = document.querySelectorAll('form, .survey-form, .ghl-form');
      forms.forEach(form => {
        if (!form.dataset.passengerMonitor) {
          form.addEventListener('submit', (e) => {
            // Final sync before submission
            if (selectEl.value && input.value !== selectEl.value) {
              input.value = selectEl.value;
            }
          });
          form.dataset.passengerMonitor = 'true';
        }
      });
    };
    
    // Run monitoring immediately and after DOM changes
    monitorSurveySteps();
    setTimeout(monitorSurveySteps, 1000); // Delay for dynamic button creation
    
    // Use MutationObserver to catch dynamically added survey elements
    if (window.MutationObserver) {
      const observer = new MutationObserver((mutations) => {
        let shouldMonitor = false;
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1 && (
              node.matches && (
                node.matches('button, .btn, .survey-next, .survey-prev') ||
                node.querySelector && node.querySelector('button, .btn, .survey-next, .survey-prev')
              )
            )) {
              shouldMonitor = true;
            }
          });
        });
        if (shouldMonitor) {
          setTimeout(monitorSurveySteps, 100);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Store observer for cleanup
      selectEl._surveyObserver = observer;
    }

    // Re-run icon wrapper just in case
    try { window.BookingForm.enhanceVisual(document); } catch(_) {}
  }

  window.__passengerSelect = { attach };

  // initial attach
  try { attach(document); } catch(_) {}
})();

// Expose attach function for external use
window.BookingForm.initPassengerSelect = function(root = document) {
  if (window.__passengerSelect && window.__passengerSelect.attach) {
    window.__passengerSelect.attach(root);
  }
};