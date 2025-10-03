// ---- Global boot: wait for per-page config (data-* or window.CFG) ----
async function __waitForConfig__(selectorFallback='#tour-list') {
  const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
  function readConfig() {
    const sel = (window.CFG && window.CFG.LIST_SELECTOR) || selectorFallback;
    const mount = document.querySelector(sel) || document.querySelector('#tour-list');
    if (mount && mount.dataset) {
      const { dataUrl, filterMode, filterValue, listSelector } = mount.dataset;
      if (dataUrl || filterMode || filterValue || listSelector) {
        return {
          DATA_URL: dataUrl || (window.CFG && window.CFG.DATA_URL),
          FILTER: (filterMode || filterValue) ? { mode: filterMode || 'all', value: filterValue || '' } : (window.CFG && window.CFG.FILTER),
          LIST_SELECTOR: listSelector || (window.CFG && window.CFG.LIST_SELECTOR) || '#tour-list'
        };
      }
    }
    if (window.CFG && window.CFG.DATA_URL) return window.CFG;
    return null;
  }
  if (document.readyState === 'loading') {
    await new Promise(res => document.addEventListener('DOMContentLoaded', res, { once:true }));
  }
  for (let i=0;i<60;i++){
    const cfg = readConfig();
    if (cfg && cfg.DATA_URL) { window.CFG = cfg; return cfg; }
    await sleep(50);
  }
  console.error('Tour list config not found. Ensure data-data-url or window.CFG is present.');
  return null;
}

(async function(){
  await __waitForConfig__('#tour-list');
  const { DATA_URL, FILTER, LIST_SELECTOR } = window.CFG || {};
  const listSel  = LIST_SELECTOR || '#tour-list';
  const mount    = document.querySelector(listSel);
  const skeleton = document.getElementById('skeleton');

  /* ---------- Utilities ---------- */
  const esc = (s) => String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');

  const norm = (s) => String(s ?? '').toLowerCase().trim();

  const formatPrice = (v) => {
    if (v == null || v === '') return '';
    const n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d.]/g,''));
    if (!Number.isFinite(n)) return esc(v);
    try {
      return new Intl.NumberFormat(undefined, { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(n);
    } catch {
      return '$' + Math.round(n).toLocaleString();
    }
  };

  const fetchWithTimeout = async (input, { timeout=12000, ...opts } = {}) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(input, { ...opts, signal: ctrl.signal });
      return res;
    } finally {
      clearTimeout(timer);
    }
  };

  // Tiny FNV-1a hash (fallback version if backend doesn't provide one)
  const hashString = (str) => {
    let h = 0x811c9dc5;
    for (let i=0; i<str.length; i++){
      h ^= str.charCodeAt(i);
      h = (h + ((h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24))) >>> 0;
    }
    return ('0000000' + h.toString(16)).slice(-8);
  };
  const computeVersionFromTours = (tours) => hashString(JSON.stringify(tours||[]));

  const setItemListLD = (rows=[]) => {
    const prev = document.getElementById('tours-itemlist-ld');
    if (prev) prev.remove();
    if (!rows.length) return;
    const data = {
      "@context":"https://schema.org",
      "@type":"ItemList",
      "itemListElement": rows.map((t, i) => ({
        "@type":"ListItem", "position": i+1, "url": `/${t.slug || ''}`
      }))
    };
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'tours-itemlist-ld';
    el.textContent = JSON.stringify(data);
    document.head.appendChild(el);
  };

  /* ---------- Skeleton ---------- */
  if (skeleton && !skeleton.children.length) {
    const skeletonCard = () => `
      <div class="skeleton" role="presentation">
        <div class="shimmer sk-img"></div>
        <div class="sk-pad">
          <div class="shimmer sk-line lg" style="width:60%"></div>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <div class="shimmer sk-line" style="width:110px"></div>
            <div class="shimmer sk-line" style="width:130px"></div>
            <div class="shimmer sk-line" style="width:90px"></div>
          </div>
          <div class="shimmer sk-line" style="width:95%"></div>
          <div class="shimmer sk-line" style="width:88%"></div>
        </div>
        <div class="sk-right">
          <div class="shimmer sk-line" style="width:140px"></div>
          <div class="shimmer sk-line lg" style="width:80px"></div>
          <div class="shimmer sk-pill" style="width:140px"></div>
        </div>
      </div>`;
    skeleton.innerHTML = skeletonCard() + skeletonCard() + skeletonCard();
  }

  const hideSkeleton = () => {
    if (!skeleton) return;
    skeleton.setAttribute('hidden','true');
    skeleton.style.display = 'none';
    requestAnimationFrame(() => skeleton.remove());
  };
  const ultimateFallback = setTimeout(hideSkeleton, 20000);

  /* ---------- SWR Cache Keys (include filter) ---------- */
  const keyBase = [
    (DATA_URL || '').split('?')[0],
    FILTER?.mode || 'all',
    FILTER?.value || ''
  ].join('|');
  const STORAGE_KEY = 'tours-cache-v2:' + keyBase;
  const readCache = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; } };
  const writeCache = (obj) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); } catch {} };

  /* ---------- Client-side filter (safety net) ---------- */
  const match = (t) => {
    if (!FILTER || FILTER.mode === 'all') return true;
    if (FILTER.mode === 'tag')     return (t.tags||[]).map(norm).includes(norm(FILTER.value));
    if (FILTER.mode === 'type')    return norm(t.type) === norm(FILTER.value);
    if (FILTER.mode === 'keyword') return [t.name,t.excerpt,(t.tags||[]).join(' ')].map(norm).join(' ').includes(norm(FILTER.value));
    return true;
  };

  /* ---------- Card template (image+title links, data-url) ---------- */
  const card = (t, i) => {
    const name = esc(t.name);
    const duration = t.duration ? esc(t.duration) : '';
    const location = t.location ? esc(t.location) : '';
    const type = t.type ? esc(t.type) : '';
    const group = t.group ? esc(t.group) : '';
    const excerpt = t.excerpt ? esc(t.excerpt) : '';
    const slug = esc(t.slug || '');
    const img = esc(t.image || '');
    const sizes = '(max-width:860px) 100vw, 320px';
    const url = `/${slug}`;

    return `
    <article class="tour-card" data-url="${url}" aria-label="${name}">
      <div class="tour-img">
        <a href="${url}" class="img-link" aria-label="View ${name} details">
          <img
            src="${img}"
            sizes="${sizes}"
            alt="${name || 'Tour image'}"
            ${i < 2 ? 'loading="eager" fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"'}
            width="320" height="240"
          >
        </a>
      </div>
      <div class="tour-body">
        <h3><a href="${url}" class="title-link">${name}</a></h3>
        <div class="tour-meta" aria-label="Tour details">
          ${duration ? `<span><span aria-hidden="true">⏱ </span><span class="sr-only">Duration: </span>${duration}</span>` : ''}
          ${location ? `<span><span aria-hidden="true">📍 </span><span class="sr-only">Location: </span>${location}</span>` : ''}
          ${type ? `<span><span aria-hidden="true">🏷 </span><span class="sr-only">Type: </span>${type}</span>` : ''}
          ${group ? `<span><span aria-hidden="true">👥 </span><span class="sr-only">Group: </span>${group}</span>` : ''}
        </div>
        ${excerpt ? `<p class="tour-desc">${excerpt}</p>` : ''}
      </div>
      <aside class="tour-price" aria-label="Price and actions">
        <div class="micro">Prices starting from…</div>
        ${t.fromPrice != null && t.fromPrice !== '' ? `<div class="amount">${formatPrice(t.fromPrice)}</div>` : ''}
        <div class="micro">Request exact quote</div>
        <a href="${url}" class="btn btn-primary">View Details</a>
      </aside>
    </article>`;
  };

  /* ---------- Whole-card click (except real controls) ---------- */
  function enableCardClicks(containerEl) {
    const cards = containerEl.querySelectorAll('.tour-card[data-url]');
    for (const card of cards) {
      const url = card.getAttribute('data-url');
      if (!url) continue;

      card.style.cursor = 'pointer';
      if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'link');

      card.addEventListener('click', (e) => {
        if (e.defaultPrevented) return;
        if (e.target.closest('a, button, input, select, textarea')) return;
        window.location.href = url;
      });

      card.addEventListener('keydown', (e) => {
        if (e.target !== card) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.location.href = url;
        }
      });
    }
  }

  /* ---------- Render (single definition) ---------- */
  const render = (rows = []) => {
    mount.innerHTML = rows.length
      ? rows.map((t, i) => card(t, i)).join('')
      : `<div style="opacity:.8">No tours found for this filter.</div>
         <div><button class="btn btn-primary" type="button" onclick="location.reload()">Retry</button></div>`;
    mount.hidden = false;
    enableCardClicks(mount);
    setItemListLD(rows);
  };

  if (!mount) {
    console.error('Mount not found:', listSel);
    clearTimeout(ultimateFallback);
    hideSkeleton();
    return;
  }

  /* ---------- 1) Paint from cache instantly (if present) ---------- */
  const cached = readCache();
  let paintedFromCache = false;
  if (cached && Array.isArray(cached.tours)) {
    const cachedRows = cached.tours.filter(match);
    render(cachedRows);
    paintedFromCache = true;
    requestAnimationFrame(hideSkeleton);
  }

  /* ---------- Build a URL that asks the server to filter ---------- */
  const urlParams = new URLSearchParams();
  if (FILTER?.mode && FILTER?.value) {
    urlParams.set('mode', FILTER.mode);
    urlParams.set('value', FILTER.value);
  }
  urlParams.set('v', Date.now().toString()); // cache-buster while testing

  const sep = (DATA_URL || '').includes('?') ? '&' : '?';
  const requestUrl = (DATA_URL || '') + sep + urlParams.toString();

  /* ---------- 2) Fetch in background (revalidate) ---------- */
  let fetchedTours = [];
  let fetchedVersion = null;

  try {
    console.log('[Tours] Fetching from:', requestUrl);
    const res = await fetchWithTimeout(requestUrl, { timeout: 12000, cache:'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    fetchedTours = Array.isArray(json.tours) ? json.tours : [];
    fetchedVersion = json.version || computeVersionFromTours(fetchedTours);
    console.log('[Tours] Fetched tours count:', fetchedTours.length);
    console.log('[Tours] Filter config:', FILTER);
  } catch (e) {
    console.error('Fetch error', e);
  }

  // Apply client-side filter only if server didn't already filter
  const rows = (FILTER?.mode && FILTER?.value && FILTER.mode !== 'all') 
    ? fetchedTours  // Server already filtered, don't filter again
    : fetchedTours.filter(match); // Server didn't filter, apply client filter
  
  console.log('[Tours] Final filtered count:', rows.length);
  const cacheVersion = cached?.version || null;
  const shouldRepaint = !paintedFromCache || !cacheVersion || (fetchedVersion && fetchedVersion !== cacheVersion);

  if (shouldRepaint) {
    render(rows);
    requestAnimationFrame(hideSkeleton);
    if (fetchedTours.length) {
      writeCache({ version: fetchedVersion || computeVersionFromTours(fetchedTours), tours: fetchedTours });
    }
  }

  requestAnimationFrame(() => {
    clearTimeout(ultimateFallback);
    hideSkeleton();
  });
})();