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

window.BookingForm.initNow = function(root = document) {
  // Styles/visuals first (so fields don't jump)
  window.BookingForm.enhanceVisual(root);
  window.BookingForm.enhanceNextButtonMobile(root);
  window.BookingForm.enhanceSubmitButton(root);

  // Field behaviors
  window.BookingForm.attachPickupDateGuard(root);
  window.BookingForm.initDatePicker(root);
  window.BookingForm.setupTimePicker();
  window.BookingForm.initPassengerSelect(root);

  // Validation (NEXT / SUBMIT)
  window.BookingForm.installStepOneNextValidation();
  window.BookingForm.installStepTwoSubmitValidation();

  // Google Places + filters
  window.BookingForm.loadGoogleMaps(() => {
    window.BookingForm.wireAutocomplete(root);
    window.BookingForm.setupPredictionFilters(); // PAC filter & prioritizer
  });

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