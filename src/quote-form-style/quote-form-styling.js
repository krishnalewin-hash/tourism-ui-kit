/* ===== Quote Form Styling - Main Entry Point =====
   Purpose: Modular form enhancement system for survey forms
   Architecture: Imports and coordinates all form enhancement modules
   Usage: Single script include with automatic initialization
================================================= */

// Import all modules
import { CONFIG } from './config.js';
import { loadGoogleMaps } from './maps-loader.js';
import { initializeMapsFeatures } from './maps-initialization.js';
import { attachPickupDateGuard } from './date-guard.js';
import { attachPickupTimePicker } from './time-picker.js';
import { initDatePicker } from './date-picker.js';
import { initPassengerSelect } from './passenger-select.js';
import { enhanceNextButtonMobile, enhanceSubmitButton } from './button-enhancer.js';

// Import validation modules
import { initStepOneValidation } from './validation-step1.js';
import { initStepTwoValidation } from './validation-step2.js';

// Import visual and other modules
import { enhanceVisual } from './visuals.js';
import { initAutocomplete } from './autocomplete.js';
import { initPrefill } from './prefill.js';
import { initFieldObserver } from './observer.js';

console.log('[QuoteFormStyle] Initializing modular form enhancement system...');

// Main initialization function
function initializeQuoteFormStyling() {
  // CRITICAL: Wait for DOM to be ready - matching original behavior
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeQuoteFormStyling);
    return;
  }

  console.log('[QuoteFormStyle] DOM ready, initializing modules...');

  try {
    // EXACT initialization order from original working code:
    // Section 8: Initial Enhancement Invocation
    attachPickupDateGuard(document);
    attachPickupTimePicker(document);
    enhanceVisual(document);  // Icons run after date/time setup
    enhanceNextButtonMobile(document);
    enhanceSubmitButton(document);
    initPrefill(document);    // Changed from applyPrefillBasic to match our module
    
    // Initialize passenger select dropdown (matches original)
    initPassengerSelect();
    
    // Initialize custom date picker
    initDatePicker();
    
    // Validation systems
    initStepOneValidation();
    initStepTwoValidation();
    
    console.log('[QuoteFormStyle] Core modules initialized successfully');
    
    // Secondary run to catch late-rendered inputs (EXACT timing from original)
    setTimeout(() => {
      try {
        attachPickupTimePicker(document);
        enhanceVisual(document);
        if (window.__passengerSelect?.attach) {
          window.__passengerSelect.attach(document);
        }
        console.log('[QuoteFormStyle] Secondary initialization completed');
      } catch (error) {
        console.warn('[QuoteFormStyle] Secondary initialization error:', error);
      }
    }, 400);
    
    // Google Maps integration - AFTER DOM setup (EXACT Section 10 from original)
    loadGoogleMaps(() => {
      console.log('[QuoteFormStyle] Google Maps loaded, initializing location features...');
      try {
        // Use the complete maps initialization from Section 10 (includes applyPrefillMaps)
        initializeMapsFeatures();
        
        // Initialize basic autocomplete (now lightweight)
        initAutocomplete();
        
        console.log('[QuoteFormStyle] Maps-dependent features initialized');
      } catch (error) {
        console.warn('[QuoteFormStyle] Maps integration error:', error);
      }
    });
    
    // Dynamic field observer - AFTER all other setup
    initFieldObserver();
    
    console.log('[QuoteFormStyle] All modules initialized');
    
  } catch (error) {
    console.error('[QuoteFormStyle] Initialization error:', error);
  }
}

// Auto-initialize
initializeQuoteFormStyling();

// Export main initialization function for manual use
window.QuoteFormConfig = window.QuoteFormConfig || {};
window.QuoteFormConfig.initialize = initializeQuoteFormStyling;
window.QuoteFormConfig.version = '2.0.0-modular';

export { initializeQuoteFormStyling };