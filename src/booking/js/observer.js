// Watches for late-rendered inputs/buttons and re-applies features

// Global namespace for booking form
window.BookingForm = window.BookingForm || {};

window.BookingForm.observeLateFields = function(){
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

          window.BookingForm.enhanceVisual(document);
          window.BookingForm.enhanceNextButtonMobile(document);
          window.BookingForm.enhanceSubmitButton(document);

          if (q==='pickup_location' || q==='drop-off_location') {
            try { window.BookingForm.wireAutocomplete(document); } catch {}
          }
          if (q==='pickup_date') {
            try { window.BookingForm.attachPickupDateGuard(document); } catch {}
            try { window.BookingForm.initDatePicker(document); } catch {}
          }
          if (q==='pickup_time') {
            try { window.BookingForm.attachPickupTimePicker(document); } catch {}
          }
          if (q==='number_of_passengers') {
            try { window.BookingForm.initPassengerSelect(document); } catch {}
          }
        });

        if (node.matches?.('.ghl-btn.ghl-submit-btn') || node.querySelector?.('.ghl-btn.ghl-submit-btn')) window.BookingForm.enhanceSubmitButton(document);
        if (node.matches?.('.ghl-btn.ghl-footer-next') || node.querySelector?.('.ghl-btn.ghl-footer-next')) window.BookingForm.enhanceNextButtonMobile(document);
      });
    }
  });

  obs.observe(document.documentElement, { subtree:true, childList:true });
  window.__iconFieldObserver = obs;
};