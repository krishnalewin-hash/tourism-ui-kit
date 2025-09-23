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

    // Replace the input with a select (keep the icon wrapper intact)
    const selectEl = buildSelectFromInput(input);
    input.parentNode.replaceChild(selectEl, input);
    selectEl.dataset.paxSelectWired = '1';

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