import { getConfig } from './config.js';
import { injectBaselineStyles, injectValidationStyles, injectCtaStyles } from './styles.js';
import { enhanceVisual, enhanceNextButtonMobile, enhanceSubmitButton } from './visuals.js';
import { attachPickupDateGuard } from './date-guard.js';
import { attachDatePicker } from './date-picker.js';
import { attachTimePicker } from './time-picker.js';
import { installStep1Validation } from './validation-step1.js';
import { installStep2Validation } from './validation-step2.js';
import { attachPassengerSelect } from './passengers.js';
import { loadGoogleMaps, makeBiasBoundsSupplier } from './maps.js';
import { wireAutocomplete } from './autocomplete.js';
import { installObserver } from './observer.js';
import { cacheIncomingParams } from './utils.js';

(function boot(){
  const CONFIG = getConfig();

  // Styles first
  injectBaselineStyles();
  injectValidationStyles();
  injectCtaStyles();

  // Static DOM feature wiring
  enhanceVisual(document);
  enhanceNextButtonMobile(document);
  enhanceSubmitButton(document);
  attachPickupDateGuard(document);
  attachDatePicker(document);
  attachPassengerSelect(document);
  attachTimePicker(CONFIG, document);

  // Validation
  installStep1Validation();
  installStep2Validation();

  // Cache incoming URL params (so refresh keeps values)
  const qs = new URLSearchParams(location.search);
  cacheIncomingParams(qs);

  // Load Maps + wire autocomplete (+ PAC helpers)
  if (CONFIG.googleApiKey) {
    loadGoogleMaps(CONFIG.googleApiKey, CONFIG.mapsLoadTimeoutMs)
      .then(() => {
        const biasBoundsFn = makeBiasBoundsSupplier(CONFIG);
        wireAutocomplete(CONFIG, biasBoundsFn, document);
        // Retry a few times for late mounts
        const start=Date.now(); const intv=setInterval(()=>{
          wireAutocomplete(CONFIG, biasBoundsFn, document);
          const allWired = ['pickup_location','drop-off_location']
            .every(q => document.querySelector(`input[data-q="${q}"]`)?.dataset.placesWired==='1');
          if (allWired || Date.now()-start > 12000) clearInterval(intv);
        }, 450);

        // Observe for dynamic fields
        installObserver(CONFIG, biasBoundsFn);
      })
      .catch(err => console.warn('[Maps] load failed or timed out', err));
  } else {
    console.warn('[Maps] No Google API key provided; skipping Places Autocomplete.');
  }
})();