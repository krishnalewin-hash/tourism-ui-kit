/* ===== Block C: Related Tours - Standalone Version ===== */

(function() {
  'use strict';

  // Use existing CFG or set defaults
  const CFG = window.CFG || {
    DATA_URL: 'https://tour-driver-data-proxy.krishna-0a3.workers.dev',
    CLIENT: 'tour-driver'
  };
  
  const DATA_URL = CFG.DATA_URL;
  const CLIENT = CFG.CLIENT || 'tour-driver';
  
  // Extract excerpt from HTML description (first paragraph, plain text)
  function extractExcerpt(htmlDescription) {
    if (!htmlDescription) return '';
    
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlDescription;
    
    // Get the first paragraph or first text content
    const firstParagraph = tempDiv.querySelector('p');
    if (firstParagraph) {
      return firstParagraph.textContent.trim();
    }
    
    // If no paragraph tags, get first text content
    const textContent = tempDiv.textContent.trim();
    
    // Limit to first 200 characters and add ellipsis if needed
    if (textContent.length > 200) {
      return textContent.substring(0, 200).trim() + '...';
    }
    
    return textContent;
  }
  
  if (!DATA_URL) {
    console.error('[Tours] Missing CFG.DATA_URL');
    return;
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

  // ---------- Build API URL for all tours ----------
  function buildApiURL() {
    const u = new URL(DATA_URL);
    u.searchParams.set('client', CLIENT);
    u.searchParams.set('mode', 'all');
    return u.toString();
  }

  // ---------- Fetch all tours and current tour ----------
  async function fetchToursData() {
    const url = buildApiURL();

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      const tours = Array.isArray(json.tours) ? json.tours : [];
      
      // Find current tour by slug
      const currentTour = tours.find(tour => norm(tour.slug) === norm(SLUG));
      
      return { currentTour, allTours: tours, _source: 'net' };
    } catch (e) {
      console.error('[Tours][BlockC] fetchToursData error:', e);
      return null;
    }
  }

  // ---------- Filter related tours ----------
  function getRelatedTours(currentTour, allTours, maxResults = 3) {
    if (!currentTour || !currentTour.type || !Array.isArray(allTours)) {
      return [];
    }

    const currentType = norm(currentTour.type);
    const currentSlug = norm(currentTour.slug);

    return allTours
      .filter(tour => {
        return norm(tour.type) === currentType && norm(tour.slug) !== currentSlug;
      })
      .slice(0, maxResults);
  }

  // ---------- Create tour card HTML ----------
  function createTourCard(tour) {
    const image = tour.image || 'https://via.placeholder.com/400x200?text=No+Image';
    const title = tour.name || 'Untitled Tour';
    const description = extractExcerpt(tour.description_html) || 'No description available.';
    const price = tour.fromPrice ? `From $${tour.fromPrice}` : 'Price on request';
    const location = tour.location || '';
    const duration = tour.duration || '';
    const group = tour.group || '';
    
    // Build tour URL (you can customize this based on your URL structure)
    const tourUrl = `?slug=${tour.slug}` || '#';

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

  // ---------- Render related tours ----------
  function render(currentTour, allTours) {
    const container = document.getElementById('related-tours-grid');
    const section = document.getElementById('related-tours');
    
    if (!container || !section) {
      console.error('Container or section not found');
      return;
    }

    const relatedTours = getRelatedTours(currentTour, allTours, 3);

    if (relatedTours.length === 0) {
      // Hide the entire section if no related tours
      section.style.display = 'none';
      return;
    }

    // Update section title to show category
    const sectionTitle = section.querySelector('.related-tours__title');
    if (sectionTitle && currentTour.type) {
      sectionTitle.textContent = `More ${currentTour.type} Tours`;
    }

    // Render tour cards
    container.innerHTML = relatedTours.map(tour => createTourCard(tour)).join('');
    container.style.display = '';
    section.style.display = '';
  }

  // ---------- Show error state ----------
  function showError(message) {
    const container = document.getElementById('related-tours-grid');
    const section = document.getElementById('related-tours');
    
    if (container && section) {
      container.innerHTML = `<p style="text-align: center; padding: 40px; color: #666;">${message}</p>`;
      section.style.display = '';
    }
  }

  // ---------- Boot ----------
  (async function boot() {
    if (!SLUG) {
      console.warn('[Tours][BlockC] No slug found');
      showError('No tour specified.');
      return;
    }

    // Fetch tours data
    const result = await fetchToursData();
    
    if (!result) {
      showError('Failed to load tours data.');
      return;
    }

    if (!result.currentTour) {
      showError('Current tour not found.');
      return;
    }

    if (!result.allTours || result.allTours.length === 0) {
      showError('No tours available.');
      return;
    }

    render(result.currentTour, result.allTours);
  })();

})();