/* ===== Date Guard Module =====
   Purpose: Prevent past dates and format user input into verbose date strings
   Handles: Date parsing, validation, formatting, user feedback
================================================= */

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function attachPickupDateGuard(rootDoc) {
  const input = rootDoc.querySelector('input[data-q="pickup_date"]');
  if (!input || input.dataset.dateGuard === '1') return;
  input.dataset.dateGuard = '1';
  
  // Minimal styling - main layout handled by CSS to prevent shifts
  try {
    input.style.setProperty('color', '#000', 'important');
    input.style.setProperty('background', '#fff', 'important');
    input.style.setProperty('opacity', '1', 'important');
  } catch(_) {}
  
  const todayStart = () => { const d=new Date(); d.setHours(0,0,0,0); return d; };
  
  function parseLocalDate(str) {
    if (!str) return null;
    let s = str.trim();
    // Remove commas & ordinal suffixes (1st/2nd/3rd/4th...)
    s = s.replace(/,/g,'').replace(/\b(\d{1,2})(st|nd|rd|th)\b/i,'$1');
    // Remove leading weekday (full or 3‑letter) if present
    s = s.replace(/^(Sun(day)?|Mon(day)?|Tue(sday)?|Wed(nesday)?|Thu(rsday)?|Fri(day)?|Sat(urday)?)\s+/i,'');
    
    // YYYY-MM-DD
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/); 
    if (m) return new Date(+m[1],+m[2]-1,+m[3]);
    
    // MM/DD/YYYY or M-D-YYYY
    m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) { 
      const a=+m[1], b=+m[2], y=+m[3]; 
      const day=a>12?a:b, mon=a>12?b:a; 
      return new Date(y,mon-1,day);
    } 
    
    // Full MonthName Day Year
    m = s.match(/^(January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2}) (\d{4})$/i);
    if (m) { 
      return new Date(+m[3], MONTHS.findIndex(M=>M.toLowerCase()===m[1].toLowerCase()), +m[2]); 
    }
    
    // Abbrev MonthName Day Year
    m = s.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2}) (\d{4})$/i);
    if (m) { 
      const fullIndex=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(m[1].substr(0,3)); 
      return new Date(+m[3], fullIndex, +m[2]); 
    }
    
    const d=new Date(s); 
    return isNaN(d)?null:new Date(d.getFullYear(),d.getMonth(),d.getDate());
  }
  
  function formatDisplay(d) {
    const month = MONTHS[d.getMonth()].slice(0,3); // Abbrev month
    const day = d.getDate();
    const yr = d.getFullYear();
    const weekday = WEEKDAYS[d.getDay()].slice(0,3); // Abbrev weekday
    return `${weekday}, ${month} ${day}, ${yr}`;
  }
  
  function enforce() {
    const d=parseLocalDate(input.value);
    if(!d) { 
      input.setCustomValidity(''); 
      return; 
    }
    if(d<todayStart()) { 
      input.setCustomValidity('Please choose today or a future date.'); 
      input.value=''; 
      input.reportValidity?.(); 
    } else {
      input.setCustomValidity('');
      // Format immediately for user-friendly display
      input.value = formatDisplay(d);
    }
  }
  
  input.addEventListener('blur', enforce);
  input.addEventListener('change', enforce);
  input.addEventListener('input', () => { 
    if(input.value.length >= 6) enforce(); 
  });
  
  // Watch for value changes from date picker components
  let lastValue = input.value;
  const observer = new MutationObserver(() => {
    if (input.value !== lastValue) {
      lastValue = input.value;
      enforce();
    }
  });
  observer.observe(input, { attributes: true, attributeFilter: ['value'] });
  
  // Also use a periodic check to catch any missed updates
  setInterval(() => {
    if (input.value !== lastValue && input.value.length >= 6) {
      lastValue = input.value;
      enforce();
    }
  }, 500);
}

// Export the date guard functionality
window.QuoteFormConfig = window.QuoteFormConfig || {};
window.QuoteFormConfig.attachPickupDateGuard = attachPickupDateGuard;

export { attachPickupDateGuard };