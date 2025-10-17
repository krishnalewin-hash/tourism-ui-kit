/* ===== Block C: Related Tours Section JavaScript ===== */

(async function() {
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
        if (t.__v) window.__TOUR_VERSION__ = t.__v;
      }
    }
  } catch (e) {
    console.warn('[Tours] inline JSON parse failed', e);
  }

  // Wait for CFG to be available, but use fallback if DATA_URL is missing
  function waitForCFG() {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      
      const checkCFG = () => {
        attempts++;
        console.log('[Tours][BlockC] Checking CFG (attempt', attempts, '):', {
          exists: !!window.CFG,
          hasDataUrl: !!(window.CFG && window.CFG.DATA_URL),
          dataUrl: window.CFG?.DATA_URL,
          keys: window.CFG ? Object.keys(window.CFG) : 'no CFG'
        });
        
        if (window.CFG && window.CFG.DATA_URL) {
          console.log('[Tours][BlockC] CFG found with DATA_URL:', window.CFG);
          resolve(window.CFG);
        } else if (attempts >= maxAttempts) {
          console.log('[Tours][BlockC] Timeout waiting for DATA_URL, using fallback');
          resolve({
            DATA_URL: 'https://tour-driver-data-proxy.krishna-0a3.workers.dev',
            CLIENT: 'kamar-tours'
          });
        } else {
          setTimeout(checkCFG, 100);
        }
      };
      checkCFG();
    });
  }

  // Use CFG with fallback
  const CFG = await waitForCFG();
  
  const DATA_URL = CFG.DATA_URL;
  const CLIENT = CFG.CLIENT || 'tour-driver';
  
  console.log('[Tours][BlockC] Using DATA_URL:', DATA_URL);
  console.log('[Tours][BlockC] Using CLIENT:', CLIENT);

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
    if (CFG.SLUG) {
      console.log('[Tours][BlockC] Using CFG.SLUG:', CFG.SLUG);
      return String(CFG.SLUG).trim().toLowerCase();
    }
    const qp = new URLSearchParams(location.search);
    const qs = (qp.get('slug') || '').trim().toLowerCase();
    if (qs) {
      console.log('[Tours][BlockC] Using query param slug:', qs);
      return qs;
    }
    const parts = (location.pathname || '/').split('/').filter(Boolean);
    const i = parts.indexOf('tours');
    const slug = (i >= 0 && parts[i + 1]) ? parts[i + 1].toLowerCase() : (parts[parts.length - 1] || '').toLowerCase();
    console.log('[Tours][BlockC] Detected slug from URL:', slug, 'Path parts:', parts);
    return slug;
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

  function hashString(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return ('0000000' + h.toString(16)).slice(-8);
  }
  
  const computeVersionFromTour = (tour) => hashString(JSON.stringify(tour || {}));

  // ---------- Build API URL for all tours ----------
  function buildApiURL(knownVersion) {
    const u = new URL(DATA_URL);
    u.searchParams.set('client', CLIENT);
    u.searchParams.set('mode', 'all'); // Get all tours to filter by category
    if (knownVersion) u.searchParams.set('v', knownVersion);
    return u.toString();
  }

  /** Wait for Block A/B to publish current tour data */
  function waitForCurrentTour(slug, timeoutMs = 1200) {
    slug = norm(slug);
    console.log('[Tours][BlockC] Waiting for tour data for slug:', slug);
    return new Promise((resolve) => {
      if (window.__TOUR_DATA__ && window.__TOUR_DATA__[slug]) {
        console.log('[Tours][BlockC] Found tour data immediately:', window.__TOUR_DATA__[slug].name);
        return resolve(window.__TOUR_DATA__[slug]);
      }

      let settled = false;
      const onReady = (e) => {
        const evSlug = norm(e?.detail?.slug || '');
        console.log('[Tours][BlockC] tour:ready event received for slug:', evSlug);
        if (evSlug === slug && !settled) {
          settled = true;
          cleanup();
          const tour = window.__TOUR_DATA__?.[slug] || e.detail?.tour || null;
          console.log('[Tours][BlockC] Resolved tour from event:', tour?.name);
          resolve(tour);
        }
      };
      
      window.addEventListener('tour:ready', onReady);

      const poll = setInterval(() => {
        if (window.__TOUR_DATA__ && window.__TOUR_DATA__[slug]) {
          console.log('[Tours][BlockC] Found tour data via polling:', window.__TOUR_DATA__[slug].name);
          clearInterval(poll);
          cleanup();
          settled = true;
          resolve(window.__TOUR_DATA__[slug]);
        }
      }, 50);

      const timer = setTimeout(() => {
        if (!settled) {
          console.warn('[Tours][BlockC] Timeout waiting for tour data');
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

  // ---------- Fetch all tours ----------
  async function fetchAllTours() {
    const url = buildApiURL(window.__TOUR_VERSION__ || '');
    console.log('[Tours][BlockC] Fetching all tours from:', url);

    // 1) CacheStorage
    const cached = await cacheGet(url);
    if (cached && Array.isArray(cached.tours)) {
      console.log('[Tours][BlockC] Using cached tours:', cached.tours.length);
      return { version: cached.version || '', tours: cached.tours, _source: 'cache' };
    }

    // 2) Network
    try {
      console.log('[Tours][BlockC] Fetching from network...');
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      cachePut(url, json);
      const tours = Array.isArray(json.tours) ? json.tours : [];
      const version = json.version || '';
      console.log('[Tours][BlockC] Network fetch successful:', tours.length, 'tours');
      return { version, tours, _source: 'net' };
    } catch (e) {
      console.error('[Tours][BlockC] fetchAllTours error:', e);
      return null;
    }
  }

  // ---------- Filter related tours ----------
  function getRelatedTours(currentTour, allTours, maxResults = 3) {
    if (!currentTour || !currentTour.type || !Array.isArray(allTours)) {
      console.log('[Tours][BlockC] Invalid tour data for filtering:', { currentTour, allTours: allTours?.length });
      return [];
    }

    const currentType = norm(currentTour.type);
    const currentSlug = norm(currentTour.slug);
    console.log('[Tours][BlockC] Filtering related tours for type:', currentType, 'excluding slug:', currentSlug);

    const related = allTours
      .filter(tour => {
        return norm(tour.type) === currentType && norm(tour.slug) !== currentSlug;
      })
      .slice(0, maxResults);

    console.log('[Tours][BlockC] Found', related.length, 'related tours:', related.map(t => t.name));
    return related;
  }

  // ---------- Create tour card HTML ----------
  function createTourCard(tour) {
    const image = tour.image || 'https://via.placeholder.com/400x200?text=No+Image';
    const title = tour.name || 'Untitled Tour';
    const description = tour.excerpt || 'No description available.';
    const price = tour.fromPrice ? `From $${tour.fromPrice}` : 'Price on request';
    const location = tour.location || '';
    const duration = tour.duration || '';
    const group = tour.group || '';
    
    // Build tour URL (you can customize this based on your URL structure)
    const tourUrl = `/${tour.slug}` || '#';

    const meta = [];
    if (duration) meta.push(`⏱ ${duration}`);
    if (location) meta.push(`📍 ${location}`);
    if (group) meta.push(`👥 ${group}`);

    return `
      <div class="tour-card">
        <div class="tour-card-image">
          <img src="${image}" alt="${title}" loading="lazy" decoding="async">
          <div class="tour-card-price">${price}</div>
        </div>
        <div class="tour-card-content">
          <h4 class="tour-card-title">${title}</h4>
          ${meta.length ? `<div class="tour-card-meta">${meta.map(m => `<span>${m}</span>`).join('')}</div>` : ''}
          <p class="tour-card-description">${description}</p>
          <a href="${tourUrl}" class="tour-card-button">View Details</a>
        </div>
      </div>
    `;
  }

  // ---------- Create skeleton loading ----------
  function createSkeletonCards(count = 3) {
    return Array.from({ length: count }, () => `
      <div class="tour-card-skeleton">
        <div class="sk-image"></div>
        <div class="sk-content">
          <div class="sk-line lg" style="width:80%"></div>
          <div class="sk-line sm" style="width:60%"></div>
          <div class="sk-line" style="width:95%"></div>
          <div class="sk-line" style="width:85%"></div>
          <div class="sk-button"></div>
        </div>
      </div>
    `).join('');
  }

  // ---------- Render related tours ----------
  function render(currentTour, allTours) {
    const container = document.getElementById('related-tours-grid');
    const skeletonContainer = document.getElementById('related-tours-skeleton');
    const section = document.getElementById('related-tours-section');
    
    if (!container || !section) return;

    const relatedTours = getRelatedTours(currentTour, allTours, 3);

    // Remove skeleton
    if (skeletonContainer) {
      skeletonContainer.remove();
    }

    if (relatedTours.length === 0) {
      // Hide the entire section if no related tours
      section.style.display = 'none';
      return;
    }

    // Update section title to show category
    const sectionTitle = section.querySelector('h3');
    if (sectionTitle && currentTour.type) {
      sectionTitle.textContent = `More ${currentTour.type} Tours`;
    }

    // Render tour cards
    container.innerHTML = relatedTours.map(tour => createTourCard(tour)).join('');
    container.style.display = '';
    section.style.display = '';
  }

  // ---------- Boot ----------
  (async function boot() {
    console.log('[Tours][BlockC] Starting with slug:', SLUG);
    
    // Wait for current tour from Block A/B
    const currentTour = await waitForCurrentTour(SLUG, 1200);
    
    if (!currentTour) {
      console.warn('[Tours][BlockC] No current tour found, hiding section');
      const section = document.getElementById('related-tours-section');
      if (section) section.style.display = 'none';
      return;
    }

    console.log('[Tours][BlockC] Current tour:', currentTour.name, 'Type:', currentTour.type);

    // Fetch all tours
    const result = await fetchAllTours();
    
    if (!result || !result.tours) {
      console.warn('[Tours][BlockC] No tours data available, hiding section');
      const section = document.getElementById('related-tours-section');
      if (section) section.style.display = 'none';
      return;
    }

    console.log('[Tours][BlockC] Loaded', result.tours.length, 'tours from', result._source);
    render(currentTour, result.tours);

    // Listen for updates from Block A/B
    const onTourReady = (e) => {
      if (norm(e?.detail?.slug || '') === SLUG && window.__TOUR_DATA__?.[SLUG]) {
        render(window.__TOUR_DATA__[SLUG], result.tours);
      }
    };
    window.addEventListener('tour:ready', onTourReady);
  })();

})();