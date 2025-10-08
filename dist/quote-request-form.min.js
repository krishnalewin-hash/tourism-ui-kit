// Temporary bundled file - combine all modules

// Sticky sidebar CSS first
(function() {
  if (!document.getElementById('tour-sidebar-sticky')) {
    const style = document.createElement('style');
    style.id = 'tour-sidebar-sticky';
    style.textContent = `
      .form-sidebar.borderFull.radius10.none.c-column.c-wrapper.col-EWKLqS1EOO {
        position: sticky !important;
        top: 24px;
        align-self: flex-start !important;
      }
    `;
    document.head.appendChild(style);
  }
})();

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

/* Ensure consistent font-weight across all form fields */
input[data-q], select[data-q] {
    font-weight: normal !important;
}

/* Core icon wrapper + input padding */
.icon-field-wrapper{position:relative;display:block;width:100%;}
.icon-field-wrapper .field-icon{position:absolute;left:0.55rem;top:50%;transform:translateY(-50%);display:inline-flex;align-items:center;justify-content:center;pointer-events:none;color:#777;}
.icon-field-wrapper .field-icon svg{width:20px;height:20px;stroke:#777;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;fill:none;}

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
  min-height:56px !important;
  height:auto !important;
  color:#222 !important;
}

/* Unified text color across all data-q inputs/selects */
input[data-q], select[data-q], .icon-field-wrapper input, .icon-field-wrapper select{color:#222 !important;}

/* Gradient background utility */
.gradientbg {
    background: linear-gradient(to bottom, #ffffff 0%, #F6F5F8 100%);
}
  `);
  inject('booking-form-iconrow-styles', `
  .icon-field-wrapper .icon-input-row{position:relative;}
  .icon-field-wrapper .icon-input-row > input[data-iconized='1'][data-q], .icon-field-wrapper .icon-input-row > select[data-iconized='1'][data-q]{padding-left:2.1rem !important;}
  `);
};

window.BookingForm.injectValidationStyles = function() {
  inject('booking-form-validation-styles', `
/* Number of passengers placeholder color and font-weight */
select[data-q='number_of_passengers'].is-placeholder {
  color: #8C8C8C !important;
  font-weight: normal !important;
}

/* Consistent font-weight for all select options */
select[data-q] option {
  font-weight: normal !important;
}

/* Form control padding override */
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
  font-weight: normal !important;
}
  `);
};

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

// Passenger Count Select
(function initPassengerSelect(){
  if (window.__passengerSelect) return;

  function buildSelectFromInput(input){
    const sel = document.createElement('select');

    sel.name = input.name || 'number_of_passengers';
    sel.setAttribute('data-q', 'number_of_passengers');
    if (input.id) sel.id = input.id;
    if (input.required) sel.required = true;
    sel.className = input.className;

    const phText = input.getAttribute('placeholder') || 'Number of Passengers';
    const ph = document.createElement('option');
    ph.value = '';
    ph.textContent = phText;
    ph.disabled = true;
    ph.selected = true;
    ph.hidden = true;
    sel.appendChild(ph);

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

    const cur = (input.value || '').trim();
    if ((/^\d+$/.test(cur) && +cur >= 1 && +cur <= 15) || cur === '16+') {
      sel.value = cur;
    }

    window.BookingForm.matchFieldLook(sel);
    
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
    const selAlready = rootDoc.querySelector('select[data-q="number_of_passengers"]');
    if (!input || selAlready) return;
    if (input.dataset.paxSelectWired === '1') return;

    const selectEl = buildSelectFromInput(input);
    
    input.style.display = 'none';
    input.style.visibility = 'hidden';
    input.style.position = 'absolute';
    input.style.left = '-9999px';
    
    input.parentNode.insertBefore(selectEl, input.nextSibling);
    
    selectEl.addEventListener('change', () => {
      input.value = selectEl.value;
      selectEl.setAttribute('value', selectEl.value);
      window.BookingForm.applyPlaceholderClass(selectEl);
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      selectEl.dispatchEvent(new Event('input', { bubbles: true }));
    });
    
    input._syncedSelect = selectEl;
    selectEl._syncedInput = input;
    
    selectEl.dataset.paxSelectWired = '1';
    input.dataset.paxSelectWired = '1';
  }

  window.__passengerSelect = { attach };
  try { attach(document); } catch(_) {}
})();

// Visual Enhancement (Icons)
function enhanceVisual(rootDoc){
  if(!rootDoc) return;
  const ICONS={
    'pickup_location':`<svg viewBox='0 0 24 24' aria-hidden='true'><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    'drop-off_location':`<svg viewBox='0 0 24 24' aria-hidden='true'><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    'pickup_date':`<svg viewBox='0 0 24 24' aria-hidden='true'><rect x='3' y='5' width='18' height='16' rx='2' ry='2'/><line x1='16' y1='3' x2='16' y2='7'/><line x1='8' y1='3' x2='8' y2='7'/><line x1='3' y1='11' x2='21' y2='11'/></svg>`,
    'pickup_time':`<svg viewBox='0 0 24 24' aria-hidden='true'><circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/></svg>`,
    'number_of_passengers':`<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><path d='M22 21v-2a4 4 0 0 0-3-3.87'/><path d='M16 3.13a4 4 0 0 1 0 7.75'/></svg>`,
    'full_name':`<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/></svg>`,
    'email':`<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z'/><polyline points='22,6 12,13 2,6'/></svg>`,
    'phone':`<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.86 19.86 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.66 12.66 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.66 12.66 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z'/></svg>`
  };
  function wrap(el, svg, key){
    if(!el) return;
    let wrapDiv = el.closest('.icon-field-wrapper');
    if(!wrapDiv){
      wrapDiv=document.createElement('div');
      wrapDiv.className='icon-field-wrapper';
      el.parentNode.insertBefore(wrapDiv, el);
    }
    let row = wrapDiv.querySelector(':scope > .icon-input-row');
    if(!row){
      row=document.createElement('div');
      row.className='icon-input-row';
      wrapDiv.insertBefore(row, wrapDiv.firstChild);
    }
    if(el.parentElement !== row){
      row.appendChild(el);
    }
    let span = row.querySelector(':scope > .field-icon') || wrapDiv.querySelector(':scope > .field-icon');
    if(!span){
      span=document.createElement('span');
      span.className='field-icon';
      span.setAttribute('aria-hidden','true');
      if(key) span.setAttribute('data-for', key);
      span.innerHTML=svg;
    } else {
      if(key) span.setAttribute('data-for', key);
    }
    if(span.parentElement !== row){
      row.appendChild(span);
    }
    el.dataset.iconized='1';
  }
  Object.entries(ICONS).forEach(([k,svg])=>{
    [...rootDoc.querySelectorAll(`input[data-q='${k}'],select[data-q='${k}']`)].forEach(el=>wrap(el,svg,k));
    [...rootDoc.querySelectorAll(`input[name='${k}'],select[name='${k}']`)].forEach(el=>wrap(el,svg,k));
  });

  // Cleanup any duplicate icons that might appear
  setTimeout(() => {
    const rows = rootDoc.querySelectorAll('.icon-input-row');
    rows.forEach(row => {
      const icons = row.querySelectorAll('.field-icon');
      if (icons.length > 1) {
        // Keep the first icon, remove duplicates
        for (let i = 1; i < icons.length; i++) {
          icons[i].remove();
        }
      }
    });
  }, 100);
}

// Expose functions
window.BookingForm.enhanceVisual = enhanceVisual;
window.BookingForm.initPassengerSelect = function(root = document) {
  if (window.__passengerSelect && window.__passengerSelect.attach) {
    window.__passengerSelect.attach(root);
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  window.BookingForm.injectBaselineStyles();
  window.BookingForm.injectValidationStyles();
  
  setTimeout(() => {
    window.BookingForm.enhanceVisual(document);
    window.BookingForm.initPassengerSelect(document);
  }, 100);
  
  // Additional enhancement for late-rendered elements
  setTimeout(() => {
    window.BookingForm.enhanceVisual(document);
  }, 500);
});