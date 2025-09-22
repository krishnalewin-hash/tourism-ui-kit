// Prevent past dates + normalize display format

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEK = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function todayStart(){ const d=new Date(); d.setHours(0,0,0,0); return d; }
function fmt(d){ return `${WEEK[d.getDay()].slice(0,3)}, ${MONTHS[d.getMonth()].slice(0,3)} ${d.getDate()}, ${d.getFullYear()}`; }

function parseLoose(str){
  if (!str) return null;
  let s = str.trim().replace(/,/g,'').replace(/\b(\d{1,2})(st|nd|rd|th)\b/i,'$1')
                    .replace(/^(Sun(day)?|Mon(day)?|Tue(sday)?|Wed(nesday)?|Thu(rsday)?|Fri(day)?|Sat(urday)?)\s+/i,'');
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (m) return new Date(+m[1],+m[2]-1,+m[3]);
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m){ const a=+m[1], b=+m[2], y=+m[3]; const day=a>12?a:b, mon=a>12?b:a; return new Date(y,mon-1,day); }
  m = s.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+(\d{4})$/i);
  if (m){ const idx=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(m[1].substr(0,3)); return new Date(+m[3], idx, +m[2]); }
  const d = new Date(s); return isNaN(d) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function attachPickupDateGuard(root=document) {
  const input = root.querySelector('input[data-q="pickup_date"]');
  if (!input || input.dataset.dateGuard === '1') return;
  input.dataset.dateGuard = '1';

  function enforce(){
    const d = parseLoose(input.value);
    if (!d) { input.setCustomValidity(''); return; }
    if (d < todayStart()){
      input.setCustomValidity('Please choose today or a future date.');
      input.value = '';
      input.reportValidity?.();
    } else {
      input.setCustomValidity('');
      input.value = fmt(d);
    }
  }

  input.addEventListener('blur', enforce);
  input.addEventListener('change', enforce);
  input.addEventListener('input', () => { if ((input.value||'').length >= 6) enforce(); });
}