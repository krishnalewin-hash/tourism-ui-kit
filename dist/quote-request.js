// src/booking/js/booking.js

// IMPORTANT: Load async config loader FIRST before other modules
import './async-config-loader.js';

// Include all modules by importing them (they'll be bundled)
import './config.js';
import './styles.js';
import './utils.js';
import './visuals.js';
import './date-guard.js';
import './date-picker.js';
import './time-picker.js';
import './passengers.js';
import './validation-step1.js';
import './validation-step2.js';
import './maps.js';
import './autocomplete.js';
import './observer.js';

// Global namespace for booking form
window.BookingForm = window.BookingForm || {};

// Section 8: Initial Enhancement Invocation
// Helper functions for styling selects to match inputs
function matchFieldLook(target){
  const ref =
    document.querySelector('.icon-field-wrapper input[data-q]') ||
    document.querySelector('input[data-q]');
  if (!ref) return;

  const cs = getComputedStyle(ref);
  const props = [
    'fontFamily','fontSize','lineHeight','letterSpacing',
    'color','backgroundColor','border','borderTop','borderRight','borderBottom','borderLeft',
    'borderRadius','boxShadow','outline','height','minHeight'
  ];
  props.forEach(p => { try { target.style[p] = cs[p]; } catch(_){} });

  // Ensure consistent font-weight (don't copy from reference as it might differ)
  target.style.fontWeight = 'normal';

  // Keep room for the leading icon, and a normal right padding
  target.style.paddingLeft = '2.3rem';
  target.style.paddingRight = '18px';
  target.style.webkitAppearance = 'none';
  target.style.appearance = 'none';
}

function applyPlaceholderClass(select){
  const isEmpty = !select.value;
  select.classList.toggle('is-placeholder', isEmpty);
}

// Expose helper functions
window.BookingForm.matchFieldLook = matchFieldLook;
window.BookingForm.applyPlaceholderClass = applyPlaceholderClass;

window.BookingForm.initNow = function(root = document) {
  // Section 1 & 2: Inject essential styles first
  window.BookingForm.injectBaselineStyles();
  window.BookingForm.injectValidationStyles();
};

// Section 8: Form Enhancement Function (called after config is loaded)
window.BookingForm.enhance = function() {
  console.log('[BookingForm] Starting form enhancement...');
    
    // Purpose: Kick off date guard, time picker wiring, and icon injection for elements already in DOM.
    // Adjust order only if dependencies change (icons don't depend on others).
    
    window.BookingForm.attachPickupDateGuard(document);
    window.BookingForm.attachPickupTimePicker(document);
    window.BookingForm.enhanceVisual(document);
    window.BookingForm.enhanceNextButtonMobile(document);
    window.BookingForm.enhanceSubmitButton(document);
    window.BookingForm.initSurveyTransitions(document);
    
    // Install validation for both steps
    window.BookingForm.installStepOneNextValidation();
    window.BookingForm.installStepTwoSubmitValidation();
    
    // Secondary run to catch late-rendered inputs
    setTimeout(()=>{
      window.BookingForm.enhanceVisual(document);
    },400);

    // Section 10: Initialize Google Maps, autocomplete, PAC filters, and prediction prioritizer
    window.BookingForm.initMapsAndFilters();

    // Watch for late-rendered/replaced fields (GHL)
    window.BookingForm.observeLateFields();

    // Section 11: Populate URL parameters after components are initialized
    setTimeout(() => {
      try {
      const qs = new URLSearchParams(location.search);
      window.BookingForm.cacheIncomingParams(qs);
      
      // Populate form fields from URL parameters with better field selection
      window.BookingForm.PARAM_ALLOWLIST.forEach(paramName => {
        const paramValue = window.BookingForm.getParam(qs, paramName);
        if (paramValue) {
          // Try multiple selectors to find the field
          let field = document.querySelector(`[data-q="${paramName}"]`) || 
                     document.querySelector(`[name="${paramName}"]`);
          
          // For number_of_passengers, prefer the original input over the select
          if (paramName === 'number_of_passengers') {
            const input = document.querySelector(`input[data-q="${paramName}"], input[name="${paramName}"]`);
            const select = document.querySelector(`select[data-q="${paramName}"], select[name="${paramName}"]`);
            
            if (input && select) {
              // Populate both the hidden input and the visible select for GHL survey
              input.value = paramValue;
              select.value = paramValue;
              select.setAttribute('value', paramValue);
              
              // Mark as survey field for GHL
              input.setAttribute('data-ghl-survey-field', 'true');
              input.setAttribute('data-survey-populated', 'true');
              
              // Apply placeholder styling
              if (window.BookingForm.applyPlaceholderClass) {
                window.BookingForm.applyPlaceholderClass(select);
              }
              
              // Trigger comprehensive events for GHL survey
              const events = ['change', 'input', 'blur'];
              events.forEach(eventType => {
                input.dispatchEvent(new Event(eventType, { bubbles: true }));
                select.dispatchEvent(new Event(eventType, { bubbles: true }));
              });
              
              // Custom GHL survey event
              try {
                input.dispatchEvent(new CustomEvent('ghl-survey-field-populated', { 
                  detail: { field: paramName, value: paramValue, step: 'step1' },
                  bubbles: true 
                }));
              } catch(e) {
                console.warn('GHL survey custom event failed:', e);
              }
            } else if (input) {
              input.value = paramValue;
              input.setAttribute('data-ghl-survey-field', 'true');
              input.setAttribute('data-survey-populated', 'true');
              
              // If there's a synced select, update it too
              if (input._syncedSelect) {
                input._syncedSelect.value = paramValue;
                input._syncedSelect.setAttribute('value', paramValue);
                if (window.BookingForm.applyPlaceholderClass) {
                  window.BookingForm.applyPlaceholderClass(input._syncedSelect);
                }
              }
              
              const events = ['change', 'input', 'blur'];
              events.forEach(eventType => {
                input.dispatchEvent(new Event(eventType, { bubbles: true }));
              });
              
            } else if (select) {
              // If only select exists, populate it and sync to hidden input if present
              select.value = paramValue;
              select.setAttribute('value', paramValue);
              
              if (window.BookingForm.applyPlaceholderClass) {
                window.BookingForm.applyPlaceholderClass(select);
              }
              
              if (select._syncedInput) {
                select._syncedInput.value = paramValue;
                select._syncedInput.setAttribute('data-ghl-survey-field', 'true');
                select._syncedInput.setAttribute('data-survey-populated', 'true');
                
                const events = ['change', 'input', 'blur'];
                events.forEach(eventType => {
                  select._syncedInput.dispatchEvent(new Event(eventType, { bubbles: true }));
                });
              }
              
              select.dispatchEvent(new Event('change', { bubbles: true }));
              select.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
              console.warn(`GHL Survey: No passenger field found for ${paramName}`);
            }
          } else if (field) {
            field.value = paramValue;
            field.dispatchEvent(new Event('change', { bubbles: true }));
            field.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            console.warn(`Field not found for parameter: ${paramName}`);
          }
        }
      });
    } catch (e) {
      console.warn('URL parameter population failed:', e);
    }
  }, 800); // Longer delay to ensure passenger select is created
  
  console.log('[BookingForm] Form enhancement complete');
};

// Note: Form enhancement is now called by async-config-loader.js after config loads
// The old DOM ready initialization is replaced by the config-driven approach