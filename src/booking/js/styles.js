// All style injectors (idempotent)

function inject(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style'); s.id = id; s.textContent = css;
  document.head.appendChild(s);
}

export function injectBaselineStyles() {
  inject('booking-form-minimal-styles', `
  .icon-field-wrapper{position:relative;display:block;width:100%;}
  .icon-field-wrapper .field-icon{position:absolute;left:.55rem;top:50%;transform:translateY(-50%);display:inline-flex;align-items:center;color:#777;pointer-events:none}
  .icon-field-wrapper .field-icon svg{width:20px;height:20px;stroke:#777;stroke-width:2;fill:none}
  .icon-field-wrapper > input[data-iconized='1'][data-q],
  .icon-field-wrapper > select[data-iconized='1'][data-q]{padding-left:2.3rem !important}
  input[data-q], select[data-q]{display:inline-block;width:100%;min-width:200px;padding:10px 18px 10px 2.25rem;border:1px solid #ccc;background:#fff;line-height:1.4;box-sizing:border-box;min-height:40px;color:#222}
  .pac-container{font-size:16px !important}
  `);
  inject('booking-form-iconrow-styles', `
  .icon-field-wrapper .icon-input-row{position:relative}
  .icon-field-wrapper .icon-input-row > input[data-iconized='1'][data-q],
  .icon-field-wrapper .icon-input-row > select[data-iconized='1'][data-q]{padding-left:2.3rem !important}
  `);
}

export function injectValidationStyles() {
  inject('booking-form-validation-styles', `
    .input-error{border-color:#e53935 !important;box-shadow:0 0 0 2px rgba(229,57,53,0.15) !important}
    .field-error{display:block;margin-top:6px;color:#e53935;font-size:12px;line-height:1.2}
    @keyframes bf-shake{10%,90%{transform:translateX(-1px)}20%,80%{transform:translateX(2px)}
      30%,50%,70%{transform:translateX(-4px)}40%,60%{transform:translateX(4px)}}
    .shake{animation:bf-shake 400ms ease-in-out}
  `);
  inject('booking-form-fade-styles', `
    .bf-fade-anim{transition:opacity .22s ease, transform .22s ease}
    .bf-fade-out{opacity:0 !important; transform: translateY(-4px)}
    .bf-fade-in-init{opacity:0; transform: translateY(6px)}
  `);
}

export function injectCtaStyles() {
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
    .ghl-btn.ghl-submit-btn.bf-cta:hover .bf-arrow{transform:translateX(5px)}
  `);
}