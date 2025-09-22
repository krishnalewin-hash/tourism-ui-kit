// Watches for late-rendered inputs/buttons and re-applies features

import { enhanceVisual, enhanceNextButtonMobile, enhanceSubmitButton } from './visuals.js';
import { attachPickupDateGuard } from './date-guard.js';
import { attachDatePicker } from './date-picker.js';
import { attachTimePicker } from './time-picker.js';
import { attachPassengerSelect } from './passengers.js';
import { wireAutocomplete } from './autocomplete.js';

export function installObserver(CONFIG, biasBoundsFn){
  if (window.__iconFieldObserver) return;

  const targets=['pickup_location','drop-off_location','pickup_date','pickup_time','number_of_passengers','full_name','email','phone'];

  const obs = new MutationObserver(muts=>{
    for (const m of muts){
      m.addedNodes?.forEach(node=>{
        if(!(node instanceof HTMLElement)) return;

        const els = node.matches?.('input,select') ? [node] : Array.from(node.querySelectorAll?.('input,select')||[]);
        els.forEach(el=>{
          const q = el.getAttribute('data-q');
          if(!q || !targets.includes(q)) return;

          enhanceVisual(document);
          enhanceNextButtonMobile(document);
          enhanceSubmitButton(document);

          if (q==='pickup_location' || q==='drop-off_location') {
            try { wireAutocomplete(CONFIG, biasBoundsFn, document); } catch {}
          }
          if (q==='pickup_date') {
            try { attachPickupDateGuard(document); } catch {}
            try { attachDatePicker(document); } catch {}
          }
          if (q==='pickup_time') {
            try { attachTimePicker(CONFIG, document); } catch {}
          }
          if (q==='number_of_passengers') {
            try { attachPassengerSelect(document); } catch {}
          }
        });

        if (node.matches?.('.ghl-btn.ghl-submit-btn') || node.querySelector?.('.ghl-btn.ghl-submit-btn')) enhanceSubmitButton(document);
        if (node.matches?.('.ghl-btn.ghl-footer-next') || node.querySelector?.('.ghl-btn.ghl-footer-next')) enhanceNextButtonMobile(document);
      });
    }
  });

  obs.observe(document.documentElement, { subtree:true, childList:true });
  window.__iconFieldObserver = obs;
}