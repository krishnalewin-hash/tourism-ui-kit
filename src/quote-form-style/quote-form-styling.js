/* ===== Quote Form Styling - Main Entry Point =====
   Purpose: Modular form enhancement system for survey forms
   Architecture: Imports and coordinates all form enhancement modules
   Usage: Single script include with automatic initialization
================================================= */

// Import all modules
import { CONFIG } from './config.js';
import { loadGoogleMaps } from './maps-loader.js';
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
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeQuoteFormStyling);
    return;
  }

  console.log('[QuoteFormStyle] DOM ready, initializing modules...');

  try {
    // Core field enhancements
    attachPickupDateGuard(document);
    attachPickupTimePicker(document);
    
    // Visual enhancements (icons) - run early and often
    enhanceVisual(document);
    
    // Custom UI components
    initDatePicker();
    initPassengerSelect();
    
    // Button enhancements
    enhanceNextButtonMobile(document);
    enhanceSubmitButton(document);
    
    // Validation systems
    initStepOneValidation();
    initStepTwoValidation();
    
    // Prefill functionality
    initPrefill(document);
    
    console.log('[QuoteFormStyle] Core modules initialized successfully');
    
    // Secondary run to catch late-rendered inputs - FORCE ICONS
    setTimeout(() => {
      try {
        attachPickupTimePicker(document);
        enhanceVisual(document); // Re-run visual enhancements
        if (window.__passengerSelect?.attach) {
          window.__passengerSelect.attach(document);
        }
        console.log('[QuoteFormStyle] Secondary initialization completed');
      } catch (error) {
        console.warn('[QuoteFormStyle] Secondary initialization error:', error);
      }
    }, 400);
    
    // AGGRESSIVE icon injection - try multiple times
    setTimeout(() => {
      enhanceVisual(document);
      console.log('[QuoteFormStyle] Aggressive icon injection pass 1');
    }, 800);
    
    setTimeout(() => {
      enhanceVisual(document);
      console.log('[QuoteFormStyle] Aggressive icon injection pass 2');
    }, 1500);
    
    // Google Maps integration
    loadGoogleMaps(() => {
      console.log('[QuoteFormStyle] Google Maps loaded, initializing location features...');
      try {
        initAutocomplete();
        // Re-run prefill for Maps-based features
        initPrefill(document);
        console.log('[QuoteFormStyle] Maps-dependent features initialized');
      } catch (error) {
        console.warn('[QuoteFormStyle] Maps integration error:', error);
      }
    });
    
    // Dynamic field observer
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