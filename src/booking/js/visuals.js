// Icons + wrappers + CTA/NEXT enhancements

export function enhanceVisual(root=document){
  const ICONS={
    'pickup_location':`<svg viewBox='0 0 24 24'><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    'drop-off_location':`<svg viewBox='0 0 24 24'><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    'pickup_date':`<svg viewBox='0 0 24 24'><rect x='3' y='5' width='18' height='16' rx='2'/><line x1='16' y1='3' x2='16' y2='7'/><line x1='8' y1='3' x2='8' y2='7'/><line x1='3' y1='11' x2='21' y2='11'/></svg>`,
    'pickup_time':`<svg viewBox='0 0 24 24'><circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/></svg>`,
    'number_of_passengers':`<svg viewBox='0 0 24 24'><path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><path d='M22 21v-2a4 4 0 0 0-3-3.87'/><path d='M16 3.13a4 4 0 0 1 0 7.75'/></svg>`
  };

  function wrap(el, svg, key){
    if(!el) return;
    let wrap = el.closest('.icon-field-wrapper');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.className='icon-field-wrapper';
      el.parentNode.insertBefore(wrap, el);
    }
    let row = wrap.querySelector(':scope > .icon-input-row');
    if(!row){ row=document.createElement('div'); row.className='icon-input-row'; wrap.insertBefore(row, wrap.firstChild); }
    if(el.parentElement !== row) row.appendChild(el);
    let span = row.querySelector(':scope > .field-icon');
    if(!span){ span = document.createElement('span'); span.className='field-icon'; span.setAttribute('aria-hidden','true'); span.setAttribute('data-for', key); span.innerHTML = svg; row.appendChild(span); }
    el.dataset.iconized='1';
  }

  Object.entries(ICONS).forEach(([k,svg])=>{
    [...root.querySelectorAll(`input[data-q='${k}'],select[data-q='${k}']`)].forEach(el=>wrap(el,svg,k));
    [...root.querySelectorAll(`input[name='${k}'],select[name='${k}']`)].forEach(el=>wrap(el,svg,k));
  });
}

export function enhanceNextButtonMobile(root=document){
  const isMobile = window.matchMedia?.('(max-width:768px)').matches;
  const btns = root.querySelectorAll('.ghl-btn.ghl-footer-next');
  btns.forEach(btn=>{
    let labelSpan = btn.querySelector('.bf-next-label');
    if (isMobile){
      btn.classList.add('bf-next');
      if(!labelSpan){ labelSpan = document.createElement('span'); labelSpan.className='bf-next-label'; labelSpan.textContent='NEXT'; btn.insertBefore(labelSpan, btn.firstChild); }
    } else {
      btn.classList.remove('bf-next');
      if(labelSpan) labelSpan.remove();
    }
  });
}

export function enhanceSubmitButton(root=document){
  const btns = root.querySelectorAll('.ghl-btn.ghl-submit-btn');
  btns.forEach(btn=>{
    if(btn.dataset.bfCtaWired === '1') return;
    btn.classList.add('bf-cta');
    btn.innerHTML = `<span class="bf-cta-text">GET YOUR QUOTES!</span>
      <span class="bf-arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24"><line x1="4" y1="12" x2="18" y2="12"/><polyline points="12,6 18,12 12,18"/></svg>
      </span>`;
    btn.dataset.bfCtaWired='1';
  });
}