// src/booking/js/booking.js

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
    'fontFamily','fontSize','fontWeight','lineHeight','letterSpacing',
    'color','backgroundColor','border','borderTop','borderRight','borderBottom','borderLeft',
    'borderRadius','boxShadow','outline','height','minHeight'
  ];
  props.forEach(p => { try { target.style[p] = cs[p]; } catch(_){} });

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
  
  // Section 8: Initial Enhancement Invocation
  // Purpose: Kick off date guard, time picker wiring, and icon injection for elements already in DOM.
  // Adjust order only if dependencies change (icons don't depend on others).
  
  window.BookingForm.attachPickupDateGuard(document);
  window.BookingForm.attachPickupTimePicker(document);
  window.BookingForm.enhanceVisual(document);
  window.BookingForm.enhanceDateTimeLayout(document);
  window.BookingForm.enhanceNextButtonMobile(document);
  window.BookingForm.enhanceSubmitButton(document);
  // Step 1 NEXT validation is installed by its module above (IIFE).
  
  // Secondary run to catch late-rendered inputs
  setTimeout(()=>{
    window.BookingForm.enhanceVisual(document);
    window.BookingForm.enhanceDateTimeLayout(document);
  },400);

  // Section 10: Initialize Google Maps, autocomplete, PAC filters, and prediction prioritizer
  window.BookingForm.initMapsAndFilters();

  // Watch for late-rendered/replaced fields (GHL)
  window.BookingForm.observeLateFields();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.BookingForm.initNow(document), { once: true });
} else {
  window.BookingForm.initNow(document);
}

// (optional tiny debug helpers)
window.__bookingInit = window.BookingForm.initNow;