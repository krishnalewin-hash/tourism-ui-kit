// All style injectors (idempotent)

// Global namespace for booking form
window.BookingForm = window.BookingForm || {};

function inject(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style'); s.id = id; s.textContent = css;
  document.head.appendChild(s);
}

window.BookingForm.injectBaselineStyles = function() {
  inject('booking-form-minimal-styles', `
/* Page-level safety styling */
html, body { max-width: 100%; overflow-x: hidden; }
* { box-sizing: border-box; }

/* Font family override for all form elements */
body, input, button, select, textarea {
    font-family: 'Poppins', sans-serif !important;
}

/* Core icon wrapper + input padding */
.icon-field-wrapper{position:relative;display:block;width:100%;}
.icon-field-wrapper .field-icon{position:absolute;left:0.55rem;top:50%;transform:translateY(-50%);display:inline-flex;align-items:center;justify-content:center;pointer-events:none;color:#777;}
.icon-field-wrapper .field-icon svg{width:20px;height:20px;stroke:#777;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;fill:none;}
.icon-field-wrapper > input[data-iconized='1'][data-q],
.icon-field-wrapper > select[data-iconized='1'][data-q]{padding-left:2.3rem !important;}

/* Baseline field styling (inputs + selects share the same metrics) */
input[data-q], select[data-q]{
  display:inline-block !important;
  width:100% !important;
  min-width:200px !important;
  padding:10px 18px 10px 2.25rem !important; /* leaves room for the icon */
  border:2px solid #DDDDDDFF !important;
  box-shadow: 1px 1px 9px 0px #DCDCDCFF !important;
  background:#fff !important;
  line-height:1.4 !important;
  box-sizing:border-box !important;
  min-height:40px !important;
  color:#222 !important;
}

/* Unified text color across all data-q inputs/selects */
input[data-q], select[data-q], .icon-field-wrapper input, .icon-field-wrapper select{color:#222 !important;}

/* Google Places Autocomplete (PAC) enhanced sizing & appearance (matches temp.js) */
.pac-container{
  font-family: 'Poppins', sans-serif;
  font-size: 1.05rem !important; 
  line-height: 1.35 !important;
  border: 2px solid #ddd;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(0,0,0,.15);
  overflow: hidden;
  z-index: 4000;
}
.pac-container:empty { display: none; }
.pac-item{
  padding: 10px 14px !important; 
  font-size: 0.92rem !important;
  line-height: 1.25;
  cursor: pointer;
  border-top: 1px solid #efefef;
  background: #fff;
  color: #222;
}
.pac-item:first-child { border-top: none; }
/* Primary (top) line - this is the larger text you're looking for */
.pac-item .pac-item-query {
  display: block;
  font-size: 1.18rem !important;
  font-weight: 600;
  line-height: 1.1;
  margin: 0 0 2px 0;
  color: #222;
}
/* Secondary address fragments */
.pac-item .pac-item-query ~ span {
  display: inline;
  font-size: 0.85rem !important;
  font-weight: 400;
  color: #555;
}
.pac-item:hover, .pac-item.pac-item-selected{background:#266BBC !important; color:#fff !important;}
.pac-item:hover .pac-item-query, .pac-item.pac-item-selected .pac-item-query{color:#fff !important;}
.pac-item:hover .pac-item-query ~ span, .pac-item.pac-item-selected .pac-item-query ~ span{color:#fff !important;}
/* Mobile adjustments */
@media (max-width: 600px) {
  .pac-container { font-size: 1.12rem !important; }
  .pac-item { padding: 12px 16px !important; }
  .pac-item .pac-item-query { font-size: 1.2rem !important; }
  .pac-item .pac-item-query ~ span { font-size: 0.88rem !important; }
  
  form#_builder-form {
    padding: 0px 10px !important;
    border-top-left-radius: 10px !important;
    border-top-right-radius: 10px !important;
  }
}

/* Form wrapper margin */
#lc-form-mount .ghl-form-wrap {
  margin-bottom: 0 !important;
}

/* PAC Hide Class for temporarily hiding autocomplete */
.pac-hide .pac-container { display: none !important; }

/* PAC icon and branding styling */
.pac-icon {
    width: 18px;
    height: 18px;
    margin-right: 8px;
}
.pac-container .pac-logo:after {
  display: none;
}

/* Gradient background utility */
.gradientbg {
    background: linear-gradient(to bottom, #ffffff 0%, #F6F5F8 100%);
}

/* Date picker popover */
#pickup-date-popover{position:absolute;z-index:2147483646;background:#fff;border:1px solid #444;border-radius:8px;box-shadow:0 6px 22px rgba(0,0,0,.18);padding:10px 12px;width:320px !important;display:none;font:20px/1.3 system-ui,Arial,sans-serif !important;}
#pickup-date-popover .dp-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px !important;font-weight:600;}
#pickup-date-popover button.dp-nav{all:unset;cursor:pointer;font-size:20px !important;line-height:1;padding:4px 8px;border-radius:6px;color:#222;}
#pickup-date-popover button.dp-nav:hover{background:#f2f2f2;}
#pickup-date-popover .dp-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}
#pickup-date-popover .dp-weekdays{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;font-size:12px !important;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;color:#666;text-align:center;}
#pickup-date-popover .dp-day{width:100%;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;font-size:18px !important;cursor:pointer;border-radius:6px;user-select:none;}
#pickup-date-popover .dp-day:hover{background:#eee;}
#pickup-date-popover .dp-day.dp-disabled{opacity:.35;cursor:not-allowed;}
#pickup-date-popover .dp-day.dp-today{outline:2px solid #188BF6;outline-offset:2px;}
#pickup-date-popover .dp-day.dp-selected{background:#188BF6;color:#FFF;font-weight:600;}

/* Time picker popover */
#pickup-time-popover{position:absolute;z-index:2147483647;background:#fff;border:1px solid #444;border-radius:8px;box-shadow:0 6px 22px rgba(0,0,0,.18);padding:10px;display:none;min-width:230px;font:14px/1.2 system-ui,Arial,sans-serif;}

/* Date and Time side-by-side layout for desktop (matches temp.js behavior) */
@media (min-width:640px){
  /* Ensure the parent can place items side-by-side */
  .ghl-question .fields-container.row{
    display:flex !important;
    flex-wrap:wrap !important;
    gap: 0px 4px; /* adjust or remove if tight on space */
    align-items:flex-start;
  }

  /* Default: all wrappers full width (stacked) */
  .ghl-question .fields-container.row > .form-field-wrapper{
    width:100%;
    max-width:100%;
    flex: 0 0 100%;
    box-sizing:border-box;
  }

  /* Make just Pickup Date + Pickup Time half width */
  .ghl-question .fields-container.row > .form-field-wrapper:has([data-q="pickup_date"]),
  .ghl-question .fields-container.row > .form-field-wrapper:has([data-q="pickup_time"]){
    width: calc(50% - 2px) !important;      /* override .col-12 */
    max-width: calc(50% - 2px) !important;  /* override .col-12 */
    flex: 0 0 calc(50% - 2px) !important;   /* override .col-12 */
  }
}
  `);
  inject('booking-form-iconrow-styles', `
  .icon-field-wrapper .icon-input-row{position:relative;}
  .icon-field-wrapper .icon-input-row > input[data-iconized='1'][data-q], .icon-field-wrapper .icon-input-row > select[data-iconized='1'][data-q]{padding-left:2.3rem !important;}
  `);
};

window.BookingForm.injectValidationStyles = function() {
  inject('booking-form-validation-styles', `
/* Validation visuals */
.input-error{border-color:#e53935 !important;box-shadow:0 0 0 2px rgba(229,57,53,0.15) !important;}
/* Wrapper may shake but shouldn't show red border */
.icon-field-wrapper.input-error{border-radius:6px;}
.field-error{display:block;margin-top:6px;color:#e53935;font-size:12px;line-height:1.2;border:0 !important;box-shadow:none !important;}
@keyframes bf-shake{10%,90%{transform:translateX(-1px);}20%,80%{transform:translateX(2px);}30%,50%,70%{transform:translateX(-4px);}40%,60%{transform:translateX(4px);}}
.shake{animation:bf-shake 400ms ease-in-out;}

/* Equalize border radius for step-1 inputs (normal + error states) */
.icon-field-wrapper .icon-input-row > input[data-q='pickup_location'],
.icon-field-wrapper .icon-input-row > input[data-q='drop-off_location'],
.icon-field-wrapper .icon-input-row > input[data-q='pickup_date'],
.icon-field-wrapper .icon-input-row > input[data-q='pickup_time'],
.icon-field-wrapper .icon-input-row > input[data-q='number_of_passengers'],
input[data-q='pickup_location'],
input[data-q='drop-off_location'],
input[data-q='pickup_date'],
input[data-q='pickup_time'],
input[data-q='number_of_passengers'],
input[data-q='pickup_location'][aria-invalid='true'],
input[data-q='drop-off_location'][aria-invalid='true'],
input[data-q='pickup_date'][aria-invalid='true'],
input[data-q='pickup_time'][aria-invalid='true'],
input[data-q='number_of_passengers'][aria-invalid='true'],
input[data-q='pickup_location'].input-error,
input[data-q='drop-off_location'].input-error,
input[data-q='pickup_date'].input-error,
input[data-q='pickup_time'].input-error,
input[data-q='number_of_passengers'].input-error {
  border-radius: 4px !important;
}

/* Number of passengers placeholder color (matches temp.js) */
select[data-q='number_of_passengers'].is-placeholder {
  color: #8C8C8C !important;
}

/* Form control padding override (matches temp.js) */
.hl-app .form-control {
  padding: 10px 20px !important;
}

/* Number of passengers styling: consistent with other fields */
.icon-field-wrapper .icon-input-row > select[data-q='number_of_passengers'],
select[data-q='number_of_passengers'] {
  background: #fff !important;
  border: 2px solid #DDDDDDFF !important;
  box-shadow: 1px 1px 9px 0px #DCDCDCFF !important;
  outline: none !important;
}

/* Number of passengers hover/focus states */
.icon-field-wrapper .icon-input-row > select[data-q='number_of_passengers']:hover,
.icon-field-wrapper .icon-input-row > select[data-q='number_of_passengers']:focus,
.icon-field-wrapper .icon-input-row > select[data-q='number_of_passengers']:focus-visible,
.icon-field-wrapper .icon-input-row > select[data-q='number_of_passengers']:active,
select[data-q='number_of_passengers']:hover,
select[data-q='number_of_passengers']:focus,
select[data-q='number_of_passengers']:active {
  background: #fff !important;
  border: 2px solid #DDDDDDFF !important;
  box-shadow: 1px 1px 9px 0px #DCDCDCFF !important;
  outline: none !important;
}

/* Number of passengers error states */
.icon-field-wrapper .icon-input-row > select[data-q='number_of_passengers'][aria-invalid='true'],
.icon-field-wrapper .icon-input-row > select[data-q='number_of_passengers'].input-error,
select[data-q='number_of_passengers'][aria-invalid='true'],
select[data-q='number_of_passengers'].input-error {
  background: #fff !important;
  border-color: #e53935 !important;
  box-shadow: 0 0 0 2px rgba(229,57,53,0.15) !important;
  outline: none !important;
}
  `);
  inject('booking-form-fade-styles', `
    .bf-fade-anim{transition:opacity 220ms ease, transform 220ms ease; will-change: opacity, transform;}
    .bf-fade-out{opacity:0 !important; transform: translateY(-4px);}
    .bf-fade-in-init{opacity:0; transform: translateY(6px);}
  `);
};

window.BookingForm.injectCtaStyles = function() {
  inject('booking-form-next-mobile-styles', `
    .ghl-btn.ghl-footer-next.bf-next{display:inline-flex;align-items:center;gap:8px;font-size:20px}
    .ghl-btn.ghl-footer-next .bf-next-label{display:none !important;font-weight:500}
    @media (max-width:768px){
      .ghl-btn.ghl-footer-next.bf-next{width:auto !important;padding-inline:14px !important}
      .ghl-btn.ghl-footer-next .bf-next-label{display:inline-block !important}
    }
  `);
  inject('booking-form-cta-styles', `
    .ghl-btn.ghl-submit-btn.bf-cta{display:inline-flex;gap:10px;white-space:nowrap}
    .ghl-btn.ghl-submit-btn.bf-cta .bf-arrow{width:18px;height:18px;transition:transform .22s ease}
    .ghl-btn.ghl-submit-btn.bf-cta .bf-arrow svg{stroke:white !important;fill:none !important}
    .ghl-btn.ghl-submit-btn.bf-cta:hover .bf-arrow{transform:translateX(5px)}
    .ghl-btn.ghl-submit-btn.bf-cta .bf-cta-text{font-size:20px !important}
    
    /* Loading state styling */
    .ghl-btn.ghl-submit-btn.bf-cta.bf-loading {
      opacity: 0.8;
      cursor: not-allowed;
      pointer-events: none;
    }
    .ghl-btn.ghl-submit-btn.bf-cta.bf-loading:hover .bf-arrow {
      transform: none;
    }
    .bf-spinner {
      animation: bf-spin 1s linear infinite !important;
      color: white !important;
    }
    @keyframes bf-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    /* Fullscreen loading overlay styles */
    .bf-loading-overlay {
      transition: opacity 0.3s ease-in-out !important;
    }
    .bf-loading-overlay .bf-loading-content {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 20px !important;
      text-align: center !important;
    }
    .bf-loading-overlay .bf-loading-spinner-container {
      width: 60px !important;
      height: 60px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .bf-loading-overlay .bf-spinner {
      width: 50px !important;
      height: 50px !important;
      animation: bf-spin 1s linear infinite !important;
    }
    .bf-loading-overlay .bf-loading-text {
      font-family: "Poppins", sans-serif !important;
      font-size: 53px !important;
      font-weight: 700 !important;
      letter-spacing: -1px !important;
      color: white !important;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
    }
    
    @media (max-width: 768px) {
      .bf-loading-overlay .bf-loading-text {
        font-size: 34px !important;
      }
    }
    
    /* Survey step transitions */
    .slide-no-1, .slide-no-2, [class*="slide-no-"] {
      transition: opacity 0.4s ease-in-out, transform 0.4s ease-in-out;
    }
    .survey-step-fade-out {
      opacity: 0;
      transform: translateX(-20px);
    }
    .survey-step-fade-in {
      opacity: 1;
      transform: translateX(0);
    }
  `);
  inject('booking-form-misc-styles', `
    /* Thank you message padding */
    #_builder-form .thank-you-message > div {
      padding: 40px 0px !important;
    }
    
    /* Social icon padding (if present) */
    .social-icon {
      padding: 0.3rem !important;
    }
  `);
};

// Initialize styles immediately
window.BookingForm.injectBaselineStyles();
window.BookingForm.injectValidationStyles();
window.BookingForm.injectCtaStyles();