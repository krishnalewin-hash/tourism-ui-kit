// ---- Global boot: wait for per-page config (data-* or window.CFG) ----

// Inline CSS styles for the tour category component
const TOUR_CATEGORY_CSS = `:root{--card-bg:#fff;--card-border:#ececec;--muted:#6b7280;--accent:#D65130;--accent-600:#b54224;--shadow:0 8px 24px rgba(0,0,0,.06);--radius:12px}body,.tour-card,.tour-body,.tour-price{font-family:"Poppins",system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}.tour-list{display:grid;gap:16px}.tour-card{display:grid;grid-template-columns:320px 1fr 200px;gap:20px;background:var(--card-bg);border:1px solid var(--card-border);border-radius:var(--radius);box-shadow:var(--shadow);overflow:hidden;align-items:start}.title-link,.title-link:link,.title-link:visited{text-decoration:none;color:inherit}.title-link:hover,.title-link:active{text-decoration:none}.title-link:focus-visible{outline:none;text-decoration:none}.img-link{display:block;height:100%}.tour-card:hover{box-shadow:0 10px 28px rgba(0,0,0,.08);transition:box-shadow .2s;cursor:pointer}.tour-card[role="link"]:focus{outline:none;box-shadow:0 0 0 3px rgba(214,81,48,0.35)}.tour-img{position:relative;background:#f3f3f3;overflow:hidden;border-radius:var(--radius)}.tour-img img{width:100%;height:100%;object-fit:cover;display:block;aspect-ratio:4/3}.tour-body{padding:18px 16px;display:flex;flex-direction:column;gap:10px}.tour-body h3{margin:0;font-weight:700;font-size:22px;line-height:1.2;color:#111827}.tour-meta{display:flex;flex-wrap:wrap;gap:16px;font-size:13px;color:var(--muted)}.tour-desc{margin:0;color:#374151;line-height:1.6}.tour-price{border-left:1px solid var(--card-border);padding:16px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:10px}.micro{font-size:12px;color:#6b7280}.amount{font-size:28px;font-weight:800;color:#0f172a;line-height:1}.btn{display:inline-flex;align-items:center;justify-content:center;padding:12px 16px;border-radius:5px;font-weight:700;text-decoration:none}.btn-primary{background:var(--accent);color:#fff}.btn-primary:hover,.btn-primary:focus{background:var(--accent-600)}.btn:focus{outline:2px solid #000;outline-offset:2px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.skeleton-list{display:grid;gap:16px}.skeleton{display:grid;grid-template-columns:320px 1fr 200px;gap:20px;background:#fff;border:1px solid var(--card-border);border-radius:var(--radius);box-shadow:var(--shadow);overflow:hidden}.shimmer{position:relative;background:#eef0f3;overflow:hidden;border-radius:12px}.shimmer::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,.6) 50%,rgba(255,255,255,0) 100%);animation:shimmer 1.4s infinite}@keyframes shimmer{100%{transform:translateX(100%)}}.sk-img{height:100%;min-height:220px}.sk-line{height:14px;border-radius:8px}.sk-line.lg{height:20px}.sk-pad{padding:18px 16px;display:flex;flex-direction:column;gap:12px}.sk-right{padding:16px;display:flex;flex-direction:column;gap:10px;border-left:1px solid var(--card-border)}.sk-pill{height:36px;border-radius:5px}@media (max-width:1024px){.tour-card,.skeleton{grid-template-columns:260px 1fr 180px}}@media (max-width:860px){.tour-card,.skeleton{grid-template-columns:1fr}.tour-price,.sk-right{border-left:none;border-top:1px solid var(--card-border);align-items:flex-start}.tour-img img{aspect-ratio:16/9}.sk-img{min-height:180px}.tour-body{padding:10px 16px}}`;

// Function to inject CSS styles into the document
function injectStyles() {
  // Check if styles are already injected
  if (document.getElementById('tour-category-styles')) {
    return;
  }
  
  const styleElement = document.createElement('style');
  styleElement.id = 'tour-category-styles';
  styleElement.textContent = TOUR_CATEGORY_CSS;
  document.head.appendChild(styleElement);
}

// Function to inject Google Fonts
function injectGoogleFonts() {
  // Check if Poppins font is already loaded
  if (document.querySelector('link[href*="Poppins"]')) {
    return;
  }
  
  const fontLink = document.createElement('link');
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap';
  fontLink.rel = 'stylesheet';
  document.head.appendChild(fontLink);
}

// Client configuration loader (similar to quote-results component)
async function loadClientConfig() {
  try {
    // Determine client from various sources
    const client = window.CFG?.client || 
                  new URLSearchParams(location.search).get('client') || 
                  sessionStorage.getItem('client') || 
                  'demo';
    
    // Determine base URL for client configs
    // Try to detect commit hash from the script tag that loaded this component
    let detectedBase = 'krishnalewin-hash/tourism-ui-kit@main';
    try {
      const scriptTags = document.querySelectorAll('script[src*="krishnalewin-hash/tourism-ui-kit"]');
      for (const script of scriptTags) {
        const match = script.src.match(/krishnalewin-hash\/tourism-ui-kit@([^\/]+)/);
        if (match) {
          detectedBase = `krishnalewin-hash/tourism-ui-kit@${match[1]}`;
          break;
        }
      }
    } catch (e) {
      console.log('[tour-category] Could not detect base URL from script tag');
    }
    
    const base = window.CFG?.base || detectedBase;
    
    console.log(`[tour-category] Loading client config: ${client}`);
    console.log(`[tour-category] Base URL: ${base}`);

    // Try built configuration first
    try {
      let configUrl;
      if (base.startsWith('../') || base.startsWith('./') || base.startsWith('/')) {
        configUrl = `${base}/clients/_build/${client}.json`;
      } else {
        configUrl = `https://cdn.jsdelivr.net/gh/${base}/clients/_build/${client}.json`;
      }

      console.log(`[tour-category] Fetching built config: ${configUrl}`);
      
      const response = await fetch(configUrl, { cache: 'no-store' });
      if (response.ok) {
        const clientConfig = await response.json();
        
        // Check for tour data URL in client config
        if (clientConfig.SHARED_CONFIG?.TOUR_DATA_URL) {
          window.CFG = window.CFG || {};
          window.CFG.DATA_URL = clientConfig.SHARED_CONFIG.TOUR_DATA_URL;
        }
        
        console.log(`[tour-category] Successfully loaded ${client} configuration from built config`);
        console.log(`[tour-category] Using DATA_URL: ${window.CFG?.DATA_URL}`);
        return clientConfig;
      } else {
        console.log(`[tour-category] Built config returned ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`[tour-category] Built config fetch failed: ${error.message}`);
    }

    // Fallback: Try legacy single file
    try {
      let legacyUrl;
      if (base.startsWith('../') || base.startsWith('./') || base.startsWith('/')) {
        legacyUrl = `${base}/clients/${client}.json`;
      } else {
        legacyUrl = `https://cdn.jsdelivr.net/gh/${base}/clients/${client}.json`;
      }

      console.log(`[tour-category] Trying legacy config: ${legacyUrl}`);
      
      const response = await fetch(legacyUrl, { cache: 'no-store' });
      if (response.ok) {
        const clientConfig = await response.json();
        
        // Check for tour data URL in client config
        if (clientConfig.SHARED_CONFIG?.TOUR_DATA_URL) {
          window.CFG = window.CFG || {};
          window.CFG.DATA_URL = clientConfig.SHARED_CONFIG.TOUR_DATA_URL;
        }
        
        console.log(`[tour-category] Successfully loaded ${client} configuration from legacy config`);
        console.log(`[tour-category] Using DATA_URL: ${window.CFG?.DATA_URL}`);
        return clientConfig;
      } else {
        console.log(`[tour-category] Legacy config returned ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`[tour-category] Legacy config fetch failed: ${error.message}`);
    }

    // Final fallback: Use defaults
    console.warn(`[tour-category] No configuration found for ${client}, using defaults`);
    return null;
    
  } catch (error) {
    console.error('[tour-category] Error loading client config:', error);
    return null;
  }
}

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
  // Inject styles and fonts first
  injectStyles();
  injectGoogleFonts();
  
  // Load client configuration to get DATA_URL
  try {
    await loadClientConfig();
  } catch (error) {
    console.warn('[tour-category] Failed to load client config, using manual configuration');
  }
  
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
    const res = await fetchWithTimeout(requestUrl, { timeout: 12000, cache:'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    fetchedTours = Array.isArray(json.tours) ? json.tours : [];
    fetchedVersion = json.version || computeVersionFromTours(fetchedTours);
  } catch (e) {
    console.error('Fetch error', e);
  }

  const rows = fetchedTours.filter(match);
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

// Export TourCategory API for programmatic usage
window.TourCategory = {
  init: async function(config = {}) {
    // Override window.CFG with provided config
    window.CFG = { ...window.CFG, ...config };
    
    // Inject styles and fonts
    injectStyles();
    injectGoogleFonts();
    
    // Load client configuration if client is specified
    if (config.client) {
      try {
        await loadClientConfig();
      } catch (error) {
        console.warn('[tour-category] Failed to load client config, using manual configuration');
      }
    }
    
    // Wait for DOM if needed
    if (document.readyState === 'loading') {
      await new Promise(res => document.addEventListener('DOMContentLoaded', res, { once: true }));
    }
    
    // Initialize with current config
    const { DATA_URL, FILTER, LIST_SELECTOR } = window.CFG || {};
    const listSel = LIST_SELECTOR || config.elementId || '#tour-list';
    const mount = document.querySelector(listSel);
    const skeleton = document.getElementById('skeleton');
    
    if (!mount) {
      console.error(`[tour-category] Mount element not found: ${listSel}`);
      return;
    }
    
    if (!DATA_URL) {
      console.error('[tour-category] No DATA_URL configured');
      return;
    }
    
    console.log('[tour-category] Programmatic initialization complete');
  }
};