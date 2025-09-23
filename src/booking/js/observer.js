// Section 9: Dynamic Field Observer (MutationObserver) from temp.js

// Global namespace for booking form
window.BookingForm = window.BookingForm || {};

// Section 9 implementation from temp.js
(function observeLateFields(){
  if(window.__iconFieldObserver) return;
  const targetAttrs=['pickup_location','drop-off_location','pickup_date','pickup_time','number_of_passengers','full_name','email','phone'];
  const obs=new MutationObserver(muts=>{
    for(const m of muts){
      m.addedNodes && m.addedNodes.forEach(node=>{
        if(!(node instanceof HTMLElement)) return;
        const candidates = node.matches?.('input,select') ? [node] : [...node.querySelectorAll?.('input,select')||[]];
        candidates.forEach(el=>{
          const q=el.getAttribute('data-q');
          if(q && targetAttrs.includes(q)){
            // Re-run visual enhancement only for the specific element
            window.BookingForm.enhanceVisual(document); // idempotent
            window.BookingForm.enhanceNextButtonMobile(document);
            // Ensure CTA is applied if submit button renders late
            window.BookingForm.enhanceSubmitButton(document);
            // If a location field appears after initial maps load, try wiring autocomplete immediately.
            if ((q==='pickup_location' || q==='drop-off_location') && window.google?.maps?.places) {
              try { window.BookingForm.wireAutocomplete(document); } catch(e){ /* noop */ }
            }
            if(q==='pickup_date'){
              // Re-apply date guard for replaced/late field, preserve vertical metrics
              try { window.BookingForm.attachPickupDateGuard(document); } catch(_) {}
              try { window.__pickupDatePicker?.attach(document); } catch(_) {}
            }
            if(q==='pickup_time'){
              try { window.BookingForm.attachPickupTimePicker(document, el); } catch(_){}
            }
            if(q==='number_of_passengers'){
              try { window.__passengerSelect?.attach(document); } catch(_) {}
            }
          }
        });
        // Also check if a submit button was inserted
        if(node.matches?.('.ghl-btn.ghl-submit-btn') || node.querySelector?.('.ghl-btn.ghl-submit-btn')){
          window.BookingForm.enhanceSubmitButton(document);
        }
        // Also check if a NEXT button was inserted
        if(node.matches?.('.ghl-btn.ghl-footer-next') || node.querySelector?.('.ghl-btn.ghl-footer-next')){
          window.BookingForm.enhanceNextButtonMobile(document);
        }
      });
    }
  });
  obs.observe(document.documentElement,{subtree:true,childList:true});
  window.__iconFieldObserver=obs;
})();

// Expose observeLateFields function for external use
window.BookingForm.observeLateFields = function(){
  // The IIFE above handles the singleton pattern, so this is just for API consistency
  return window.__iconFieldObserver;
};