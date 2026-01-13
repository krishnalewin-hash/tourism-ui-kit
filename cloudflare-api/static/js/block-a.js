/* ===== Block A: Tour Hero Section JavaScript ===== */

(function() {
  'use strict';

  // Initialize inline tour data if present
  try {
    const el = document.getElementById('tour-data');
    if (el && el.textContent.trim()) {
      const t = JSON.parse(el.textContent);
      if (t && t.slug) {
        const slug = String(t.slug).toLowerCase();
        window.__TOUR_DATA__ = window.__TOUR_DATA__ || {};
        window.__TOUR_DATA__[slug] = t;
        // optional: if you include a version/hash in the blob, keep it
        if (t.__v) window.__TOUR_VERSION__ = t.__v;
      }
    }
  } catch (e) {
    console.warn('[Tours] inline JSON parse failed', e);
  }

  // Configuration
  const CFG = window.CFG || {
    DATA_URL: 'https://tour-driver-data-proxy.krishna-0a3.workers.dev',
    CLIENT: 'tour-driver'
  };
  
  const DATA_URL = CFG.DATA_URL;
  const CLIENT = CFG.CLIENT || 'tour-driver';
  
  if (!DATA_URL) {
    console.error('[Tours] Missing CFG.DATA_URL');
    return;
  }

  // ---------- No browser caching - rely on Cloudflare edge only ----------
  // Removed CacheStorage API - D1 is fast enough, Cloudflare edge handles caching

  // ---------- Slug detection ----------
  function getSlug() {
    if (CFG.SLUG) return String(CFG.SLUG).trim().toLowerCase();
    const qp = new URLSearchParams(location.search);
    const qs = (qp.get('slug') || '').trim().toLowerCase();
    if (qs) return qs;
    const parts = (location.pathname || '/').split('/').filter(Boolean);
    const i = parts.indexOf('tours');
    return (i >= 0 && parts[i + 1]) ? parts[i + 1].toLowerCase() : (parts[parts.length - 1] || '').toLowerCase();
  }
  
  const SLUG = getSlug();

  // ---------- Utils ----------
  const norm = s => String(s || '').trim().toLowerCase();
  const rIC = window.requestIdleCallback || function(fn) { return setTimeout(fn, 0); };
  
  function hashString(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return ('0000000' + h.toString(16)).slice(-8);
  }
  
  const computeVersionFromTour = (tour) => hashString(JSON.stringify(tour || {}));

  // ---------- No localStorage - removed for fresh data ----------
  // With D1 + Cloudflare edge, localStorage causes stale data issues

  // ---------- Announce to Block B ----------
  function announceReady(tour, version) {
    try {
      window.__TOUR_READY__ = window.__TOUR_READY__ || {};
      window.__TOUR_READY__[tour.slug.toLowerCase()] = { tour, version: version || '' };
      window.dispatchEvent(new CustomEvent('tour:ready', {
        detail: { slug: tour.slug.toLowerCase(), version: version || '' }
      }));
    } catch {}
  }

  // ---------- Build API URL ----------
  function buildApiURL(knownVersion) {
    const u = new URL(DATA_URL);
    u.searchParams.set('client', CLIENT);
    u.searchParams.set('mode', 'slug');
    u.searchParams.set('value', SLUG);
    if (knownVersion) u.searchParams.set('v', knownVersion);
    return u.toString();
  }

  // ---------- Early JSON preload ----------
  (function earlyPreload() {
    try {
      const url = buildApiURL(window.__TOUR_VERSION__ || '');
      const l = document.createElement('link');
      l.rel = 'preload';
      l.as = 'fetch';
      l.href = url;
      l.crossOrigin = 'anonymous';
      document.head.appendChild(l);
    } catch {}
  })();

  // ---------- Rendering ----------
  function showNotFound() {
    const titleEl = document.getElementById('tdp-title');
    if (titleEl) titleEl.textContent = 'Tour not found';
    
    const topSkel = document.getElementById('tdp-top-skel');
    if (topSkel) topSkel.remove();
    
    const heroSkel = document.getElementById('heroSkel');
    if (heroSkel) heroSkel.remove();
    
    const hero = document.getElementById('heroGallery');
    if (hero) hero.style.display = 'none';
  }

  function renderTop(tour, images) {
    if (!tour || norm(tour.slug) !== SLUG) {
      showNotFound();
      return;
    }

    const titleEl = document.getElementById('tdp-title');
    const metaEl = document.getElementById('tdp-meta');
    const topSkel = document.getElementById('tdp-top-skel');

    if (titleEl) titleEl.textContent = tour.name || '';
    
    // Set page title to prevent reversion to default
    if (tour.name) {
      document.title = tour.name;
      // Also set meta title for better SEO
      const metaTitle = document.querySelector('meta[property="og:title"]');
      if (metaTitle) {
        metaTitle.setAttribute('content', tour.name);
      }
      
      // Store the tour title globally to prevent other scripts from overriding it
      window.__TOUR_TITLE__ = tour.name;
      
      // Set up a title watcher to maintain the correct title
      if (!window.__TITLE_WATCHER__) {
        window.__TITLE_WATCHER__ = true;
        let lastTitle = document.title;
        setInterval(() => {
          if (window.__TOUR_TITLE__ && document.title !== window.__TOUR_TITLE__) {
            document.title = window.__TOUR_TITLE__;
            console.log('[TourDetail] Title corrected to:', window.__TOUR_TITLE__);
          }
        }, 1000);
      }
    }
    
    if (metaEl) {
      const bits = [];
      if (tour.duration) bits.push(`⏱ ${tour.duration}`);
      if (tour.location) bits.push(`📍 ${tour.location}`);
      if (tour.type) bits.push(`🏷 ${tour.type}`);
      if (tour.group) bits.push(`👥 ${tour.group}`);
      metaEl.innerHTML = bits.map(x => `<span>${x}</span>`).join('');
    }
    
    if (topSkel) topSkel.remove();

    // Preload first hero image
    if (images[0]) {
      const l = document.createElement('link');
      l.rel = 'preload';
      l.as = 'image';
      l.href = images[0];
      document.head.appendChild(l);
    }

    const hero = document.getElementById('heroGallery');
    const heroSkel = document.getElementById('heroSkel');
    const heroCount = document.getElementById('heroCount');
    const heroNum = document.getElementById('heroCountNum');

    const heroUsed = Math.min(3, images.length);
    const sizesMain = '(max-width:820px) 100vw, 66vw';

    if (images.length) {
      // Paint big image first
      const bigHTML = `
        <figure class="big">
          <img data-idx="0"
               src="${images[0]}"
               alt="${tour?.name || ''}"
               loading="eager" fetchpriority="high" decoding="async"
               sizes="${sizesMain}" width="1200" height="760">
        </figure>`;
      
      if (hero) {
        hero.innerHTML = bigHTML;
        hero.style.display = '';
      }
      
      if (heroSkel) heroSkel.remove();
      
      if (heroNum) heroNum.textContent = images.length;
      if (heroCount) heroCount.style.display = 'inline-flex';

      // Defer small tiles
      rIC(() => {
        if (heroUsed >= 2 && images[1] && hero) {
          const s1 = document.createElement('figure');
          s1.className = 'small';
          s1.innerHTML = `<img data-idx="1" src="${images[1]}" alt="${tour?.name || ''}" loading="lazy" decoding="async" width="600" height="220">`;
          hero.appendChild(s1);
        }
        if (heroUsed >= 3 && images[2] && hero) {
          const s2 = document.createElement('figure');
          s2.className = 'small';
          s2.innerHTML = `<img data-idx="2" src="${images[2]}" alt="${tour?.name || ''}" loading="lazy" decoding="async" width="600" height="160">`;
          hero.appendChild(s2);
        }
      });

      // Lightbox (once)
      if (!window.__LB_WIRED__) {
        window.__LB_WIRED__ = true;
        const lb = document.getElementById('lightbox');
        const lbImg = document.getElementById('lbImg');
        const lbPrev = document.getElementById('lbPrev');
        const lbNext = document.getElementById('lbNext');
        const lbClose = document.getElementById('lbClose');
        
        let current = 0;
        
        const openLB = (idx) => {
          current = idx;
          if (lbImg) lbImg.src = images[current];
          if (lb) {
            lb.classList.add('open');
            lb.setAttribute('aria-hidden', 'false');
          }
        };
        
        const closeLB = () => {
          if (lb) {
            lb.classList.remove('open');
            lb.setAttribute('aria-hidden', 'true');
          }
          if (lbImg) lbImg.src = '';
        };
        
        const next = () => {
          current = (current + 1) % images.length;
          if (lbImg) lbImg.src = images[current];
        };
        
        const prev = () => {
          current = (current - 1 + images.length) % images.length;
          if (lbImg) lbImg.src = images[current];
        };
        
        document.addEventListener('click', (e) => {
          const t = e.target.closest('[data-idx]');
          if (t) openLB(Number(t.dataset.idx) || 0);
        });
        
        if (lbNext) lbNext.onclick = next;
        if (lbPrev) lbPrev.onclick = prev;
        if (lbClose) lbClose.onclick = closeLB;
        
        if (lb) {
          lb.addEventListener('click', (e) => {
            if (e.target === lb) closeLB();
          });
        }
        
        window.addEventListener('keydown', (e) => {
          if (!lb || !lb.classList.contains('open')) return;
          if (e.key === 'Escape') closeLB();
          if (e.key === 'ArrowRight') next();
          if (e.key === 'ArrowLeft') prev();
        });
      }

      // Expose to Block B
      window.__TOUR_IMAGES__ = images;
      window.__TOUR_HERO_USED__ = heroUsed;
    } else {
      if (heroSkel) heroSkel.remove();
      if (hero) hero.style.display = 'none';
      window.__TOUR_IMAGES__ = [];
      window.__TOUR_HERO_USED__ = 0;
    }
  }

  // ---------- Helper: Parse JSON string fields ----------
  function parseArrayField(value) {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string' || !value.trim()) return null;
    
    try {
      // Remove trailing comma and parse
      const cleaned = value.trim().replace(/,\s*$/, '');
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  // ---------- Build images from tour data ----------
  function imagesFromTour(tour) {
    const gallery = parseArrayField(tour?.gallery) || [];
    const raw = [tour?.image, ...gallery].filter(Boolean);
    return [...new Set(raw)];
  }

  // ---------- Fetch directly from API (Cloudflare edge handles caching) ----------
  async function fetchFresh() {
    const url = buildApiURL(window.__TOUR_VERSION__ || '');

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      const list = Array.isArray(json.tours) ? json.tours : [];
      const picked = list.find(t => norm(t.slug) === SLUG) || null;
      const version = json.version || (picked ? computeVersionFromTour(picked) : '');
      return { version, tour: picked, _source: 'api' };
    } catch (e) {
      console.error('[Tours][BlockA] fetchFresh error:', e);
      return null;
    }
  }

  // ---------- No revalidation needed - always fetch fresh ----------
  // Removed because we're no longer caching in browser

  // ---------- Boot: Simplified (no caching) ----------
  (async function boot() {
    // 1) Check if data already loaded by another block
    if (window.__TOUR_DATA__ && window.__TOUR_DATA__[SLUG]) {
      const t = window.__TOUR_DATA__[SLUG];
      const imgs = imagesFromTour(t);
      
      // Set title immediately if tour data is already available
      if (t && t.name) {
        document.title = t.name;
        window.__TOUR_TITLE__ = t.name;
      }
      
      renderTop(t, imgs);
      announceReady(t, window.__TOUR_VERSION__ || '');
      return;
    }

    // 2) Fetch fresh from API (Cloudflare edge caches this)
    const fresh = await fetchFresh();
    if (!fresh || !fresh.tour) {
      showNotFound();
      return;
    }

    // 3) Store in global and render
    window.__TOUR_DATA__ = window.__TOUR_DATA__ || {};
    window.__TOUR_DATA__[SLUG] = fresh.tour;
    window.__TOUR_VERSION__ = fresh.version || '';

    // Set title immediately when tour data is available
    if (fresh.tour && fresh.tour.name) {
      document.title = fresh.tour.name;
      window.__TOUR_TITLE__ = fresh.tour.name;
    }

    renderTop(fresh.tour, imagesFromTour(fresh.tour));
    announceReady(fresh.tour, window.__TOUR_VERSION__);
  })();

})();