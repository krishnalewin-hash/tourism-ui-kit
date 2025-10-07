/* ===== Passenger Select Module =====
   Purpose: Replace number_of_passengers input with dropdown select (1-15, 16+)
   Handles: Select generation, value syncing, form submission compatibility
================================================= */

function initPassengerSelect() {
  if (window.__passengerSelect) return;

  // Build a <select> to replace the input[data-q="number_of_passengers"]
  function buildSelectFromInput(input) {
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
    for (let i = 1; i <= 15; i++) {
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

    sel.addEventListener('change', () => {
      sel.setAttribute('value', sel.value);
      sel.dispatchEvent(new Event('input', { bubbles: true }));
    });

    return sel;
  }

  function attachPassengerSelect(rootDoc) {
    const input = rootDoc.querySelector('input[data-q="number_of_passengers"]');
    // If the select already exists, bail
    const selAlready = rootDoc.querySelector('select[data-q="number_of_passengers"]');
    if (!input || selAlready) return;
    if (input.dataset.paxSelectWired === '1') return;

    // Build the select element
    const selectEl = buildSelectFromInput(input);
    
    // Hide the original input but keep it for form submission
    input.style.display = 'none';
    input.style.visibility = 'hidden';
    input.style.position = 'absolute';
    input.style.left = '-9999px';
    
    // Insert select after the hidden input (don't replace it)
    input.parentNode.insertBefore(selectEl, input.nextSibling);
    
    // Sync select changes back to the hidden input for form submission
    selectEl.addEventListener('change', () => {
      input.value = selectEl.value;
      selectEl.setAttribute('value', selectEl.value);
      
      // Trigger change event on hidden input
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      
      selectEl.dispatchEvent(new Event('input', { bubbles: true }));
    });
    
    // Sync input changes back to the select (for URL parameter population)
    input.addEventListener('change', () => {
      if (input.value && input.value !== selectEl.value) {
        selectEl.value = input.value;
        selectEl.setAttribute('value', selectEl.value);
      }
    });
    
    // Also sync any initial value from input to select
    if (input.value) {
      selectEl.value = input.value;
    }
    
    selectEl.dataset.paxSelectWired = '1';
    input.dataset.paxSelectWired = '1';
  }

  window.__passengerSelect = { attach: attachPassengerSelect };

  // initial attach
  try { 
    attachPassengerSelect(document); 
  } catch(_) {}

  return { attach: attachPassengerSelect };
}

// Initialize passenger select
const passengerSelect = initPassengerSelect();

// Export passenger select functionality
window.QuoteFormConfig = window.QuoteFormConfig || {};
window.QuoteFormConfig.passengerSelect = passengerSelect;

export { initPassengerSelect };