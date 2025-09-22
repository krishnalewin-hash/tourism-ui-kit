// Replace input[data-q="number_of_passengers"] with a styled <select>

// Global namespace for booking form
window.BookingForm = window.BookingForm || {};

function matchFieldLook(select){
  const ref = document.querySelector('.icon-field-wrapper input[data-q]') || document.querySelector('input[data-q]');
  if (!ref) return;
  const cs=getComputedStyle(ref);
  ['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','color','backgroundColor','border','borderRadius','boxShadow','outline','height','minHeight']
    .forEach(p=>{ try{ select.style[p]=cs[p]; }catch{} });
  select.style.paddingLeft='2.3rem'; select.style.paddingRight='18px';
  select.style.webkitAppearance='none'; select.style.appearance='none';
}

function applyPlaceholderClass(sel){
  sel.classList.toggle('is-placeholder', !sel.value);
}

window.BookingForm.initPassengerSelect = function(root=document){
  if (root.querySelector('select[data-q="number_of_passengers"]')) return;
  const input = root.querySelector('input[data-q="number_of_passengers"]');
  if (!input) return;

  const sel = document.createElement('select');
  sel.name = input.name || 'number_of_passengers';
  sel.setAttribute('data-q','number_of_passengers');
  if (input.id) sel.id = input.id;
  if (input.required) sel.required = true;
  sel.className = input.className;

  const ph = document.createElement('option');
  ph.value=''; ph.textContent=input.getAttribute('placeholder')||'Number of Passengers';
  ph.disabled=true; ph.selected=true; ph.hidden=true; sel.appendChild(ph);

  for (let i=1;i<=15;i++){ const o=document.createElement('option'); o.value=String(i); o.textContent=String(i); sel.appendChild(o); }
  const big=document.createElement('option'); big.value='16+'; big.textContent='16+'; sel.appendChild(big);

  // preserve existing value
  const cur = (input.value||'').trim();
  if ((/^\d+$/.test(cur)&&+cur>=1&&+cur<=15) || cur==='16+') sel.value=cur;

  matchFieldLook(sel);
  applyPlaceholderClass(sel);
  sel.addEventListener('change', ()=>{
    sel.setAttribute('value', sel.value);
    applyPlaceholderClass(sel);
    sel.dispatchEvent(new Event('input',{bubbles:true}));
  });

  input.parentNode.replaceChild(sel, input);
};