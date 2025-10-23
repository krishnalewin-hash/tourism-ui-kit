/* ===== Block B: Tour Details Section JavaScript ===== */

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

  // Use existing CFG from Block A, with fallback
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

  // ---------- CacheStorage helpers ----------
  async function cacheGet(url) {
    try {
      const cache = await caches.open('tours-json-v1');
      const hit = await cache.match(url);
      if (hit) return await hit.json();
    } catch {}
    return null;
  }
  
  async function cachePut(url, obj) {
    try {
      const cache = await caches.open('tours-json-v1');
      const res = new Response(JSON.stringify(obj), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=604800, stale-while-revalidate=604800'
        }
      });
      await cache.put(url, res);
    } catch {}
  }

  // ---------- Slug / utils ----------
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
  const norm = s => String(s || '').trim().toLowerCase();
  const rIC = window.requestIdleCallback || ((fn) => setTimeout(fn, 0));

  // ---------- LocalStorage SWR ----------
  const STORAGE_KEY = 'tours-detail-v1::' + SLUG;
  const readCache = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
    } catch {
      return null;
    }
  };
  
  const writeCache = (obj) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch {}
  };

  function hashString(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return ('0000000' + h.toString(16)).slice(-8);
  }
  
  const computeVersionFromTour = (tour) => hashString(JSON.stringify(tour || {}));

  // ---------- Build URL (versioned when known) ----------
  function buildApiURL(knownVersion) {
    const u = new URL(DATA_URL);
    u.searchParams.set('client', CLIENT);
    u.searchParams.set('mode', 'slug');
    u.searchParams.set('value', SLUG);
    if (knownVersion) u.searchParams.set('v', knownVersion);
    return u.toString();
  }

  /** Wait briefly for Block A to publish data. */
  function waitForTour(slug, timeoutMs = 1200) {
    slug = norm(slug);
    return new Promise((resolve) => {
      if (window.__TOUR_DATA__ && window.__TOUR_DATA__[slug]) {
        return resolve(window.__TOUR_DATA__[slug]);
      }

      let settled = false;
      const onReady = (e) => {
        const evSlug = norm(e?.detail?.slug || '');
        if (evSlug === slug && !settled) {
          settled = true;
          cleanup();
          resolve(window.__TOUR_DATA__?.[slug] || e.detail?.tour || null);
        }
      };
      
      window.addEventListener('tour:ready', onReady);

      const poll = setInterval(() => {
        if (window.__TOUR_DATA__ && window.__TOUR_DATA__[slug]) {
          clearInterval(poll);
          cleanup();
          settled = true;
          resolve(window.__TOUR_DATA__[slug]);
        }
      }, 50);

      const timer = setTimeout(() => {
        if (!settled) {
          cleanup();
          resolve(null);
        }
      }, timeoutMs);

      function cleanup() {
        window.removeEventListener('tour:ready', onReady);
        clearInterval(poll);
        clearTimeout(timer);
      }
    });
  }

  // ---------- Build images ----------
  function imagesFromTour(t) {
    const raw = [t?.image, ...(t?.gallery || [])].filter(Boolean);
    return [...new Set(raw)];
  }

  // ---------- Fresh fetch (Cache → Net), versioned ----------
  async function fetchFresh() {
    const url = buildApiURL(window.__TOUR_VERSION__ || '');

    // 1) CacheStorage
    const cached = await cacheGet(url);
    if (cached && Array.isArray(cached.tours)) {
      const picked = cached.tours.find(t => norm(t.slug) === SLUG) || null;
      if (picked) {
        const version = cached.version || computeVersionFromTour(picked);
        return { version, tour: picked, _source: 'cache' };
      }
    }

    // 2) Network
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      cachePut(url, json);
      const list = Array.isArray(json.tours) ? json.tours : [];
      const picked = list.find(t => norm(t.slug) === SLUG) || null;
      const version = json.version || (picked ? computeVersionFromTour(picked) : '');
      return { version, tour: picked, _source: 'net' };
    } catch (e) {
      console.error('[Tours][BlockB] fetchFresh error:', e);
      return null;
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

  // ---------- Render (do minimum now; defer heavy parts) ----------
  function render(t) {
    // Overview
    const html = t?.descriptionHTML || '<p>Trip details coming soon.</p>';
    const overviewEl = document.getElementById('overview');
    if (overviewEl) {
      overviewEl.innerHTML = html;
    }

    // Highlights - parse if string
    const highlightsWrap = document.getElementById('highlightsWrap');
    const highlights = document.getElementById('highlights');
    const skHighlights = document.getElementById('sk-highlights');
    
    const highlightsArray = parseArrayField(t?.highlights);
    if (highlightsArray && highlightsArray.length && highlights) {
      highlights.innerHTML = highlightsArray.map(h => `<span class="chip">${h}</span>`).join('');
      if (highlightsWrap) highlightsWrap.style.display = '';
      if (skHighlights) skHighlights.remove();
      highlights.style.display = '';
    } else {
      if (highlightsWrap) highlightsWrap.style.display = 'none';
    }

    // Defer gallery + accordion
    rIC(() => {
      const imagesFromA = Array.isArray(window.__TOUR_IMAGES__) ? window.__TOUR_IMAGES__ : null;
      const heroUsed = Number(window.__TOUR_HERO_USED__ || 0);
      let images = imagesFromA || imagesFromTour(t);

      const gWrap = document.getElementById('galleryWrap');
      const gEl = document.getElementById('gallery');
      const skGallery = document.getElementById('sk-gallery');
      
      if (images && images.length && gEl) {
        const gridImgs = images.length <= 4 ? images : images.slice(heroUsed);
        const offset = (images.length <= 4 ? 0 : heroUsed);
        gEl.innerHTML = gridImgs.map((u, idx) => `
          <img data-idx="${idx + offset}" src="${u}" alt="${t?.name || ''}" loading="lazy" decoding="async" fetchpriority="low">
        `).join('');
        if (gWrap) gWrap.style.display = '';
        if (skGallery) skGallery.remove();
        gEl.style.display = '';
      } else {
        if (gWrap) gWrap.style.display = 'none';
      }

      // Accordion - parse JSON strings
      const acc = document.getElementById('accordion');
      const skAccordion = document.getElementById('sk-accordion');
      
      if (acc) {
        const ul = arr => `<ul>${arr.map(x => `<li>${x}</li>`).join('')}</ul>`;
        let out = '';
        
        const itinerary = parseArrayField(t?.itinerary);
        const inclusions = parseArrayField(t?.inclusions);
        const exclusions = parseArrayField(t?.exclusions);
        const faqs = parseArrayField(t?.faqs);
        
        if (itinerary && itinerary.length) {
          out += `<details open><summary>Itinerary</summary><div class="content">${ul(itinerary)}</div></details>`;
        }
        if (inclusions && inclusions.length) {
          out += `<details open><summary>What's Included</summary><div class="content">${ul(inclusions)}</div></details>`;
        }
        if (exclusions && exclusions.length) {
          out += `<details open><summary>What to Bring / Exclusions</summary><div class="content">${ul(exclusions)}</div></details>`;
        }
        if (faqs && faqs.length) {
          out += `<details open><summary>FAQs</summary><div class="content">${
            faqs.map(f => `<p><strong>${f.q || f.question}</strong><br>${f.a || f.answer}</p>`).join('')}
          </div></details>`;
        }
        
        acc.innerHTML = out || `<div class="content small">More details coming soon.</div>`;
        acc.querySelectorAll('details').forEach(d => d.setAttribute('open', ''));
        if (skAccordion) skAccordion.remove();
      }
    });
  }

  // ---------- Revalidate if we painted from LS ----------
  async function revalidate(currentVersion = '') {
    const fresh = await fetchFresh();
    if (!fresh || !fresh.tour) return;
    const nextVersion = fresh.version || computeVersionFromTour(fresh.tour);
    if (!currentVersion || nextVersion !== currentVersion) {
      window.__TOUR_VERSION__ = nextVersion; // remember for versioned URLs
      writeCache({ version: nextVersion, tour: fresh.tour });
      render(fresh.tour);
    }
  }

  // ---------- Live updates from Block A ----------
  function wireLiveUpdates() {
    const onReady = (e) => {
      if (norm(e?.detail?.slug || '') === SLUG && window.__TOUR_DATA__?.[SLUG]) {
        window.__TOUR_VERSION__ = e?.detail?.version || window.__TOUR_VERSION__ || '';
        render(window.__TOUR_DATA__[SLUG]);
      }
    };
    window.addEventListener('tour:ready', onReady);
  }

  // ---------- Boot ----------
  (async function boot() {
    // Prefer Block A's data
    let tour = await waitForTour(SLUG, 1200);
    if (!tour) {
      // LocalStorage
      const ls = readCache();
      if (ls?.tour) {
        window.__TOUR_VERSION__ = window.__TOUR_VERSION__ || ls.version || ''; // share known version
        tour = ls.tour;
        render(tour);
        revalidate(ls.version || '');
        wireLiveUpdates();
        return;
      }
      // Cache/Network
      const fresh = await fetchFresh();
      if (fresh?.tour) {
        window.__TOUR_VERSION__ = window.__TOUR_VERSION__ || fresh.version || '';
        tour = fresh.tour;
        writeCache({ version: window.__TOUR_VERSION__, tour });
      }
    }

    if (!tour || norm(tour.slug) !== SLUG) {
      const overviewEl = document.getElementById('overview');
      if (overviewEl) {
        overviewEl.innerHTML = '<p>Tour not found.</p>';
      }
      return;
    }

    render(tour);
    wireLiveUpdates(); // respond to Block A revalidations
  })();

})();