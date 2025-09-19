const LUCIDE_SRC = 'https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.min.js';
function ensureLucide(){
  return new Promise((resolve)=>{
    if (window.lucide?.createIcons) return resolve();
    const s = document.createElement('script');
    s.src = LUCIDE_SRC; s.onload = resolve; document.head.appendChild(s);
  });
}
export async function hydrateIcons(){
  await ensureLucide();
  window.lucide.createIcons({
    attrs:{ class:'ico', width:18, height:18, stroke:'currentColor',
      'stroke-width':2,'stroke-linecap':'round','stroke-linejoin':'round' }
  });
}