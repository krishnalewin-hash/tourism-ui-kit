/**
 * Tourism UI Kit - Web Components Bundle
 * 
 * This file bundles all components into a single file for easy embedding.
 * Import this once and all components are available:
 * 
 * <script src="https://tourism-api-production.krishna-0a3.workers.dev/components.js"></script>
 * <tourism-hero client="funtrip-tours"></tourism-hero>
 */

// ==================== BASE COMPONENT ====================

class TourismComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._data = null;
    this._loading = false;
    this._error = null;
  }

  get apiUrl() {
    return this.getAttribute('api-url') || 
           'https://tourism-api-production.krishna-0a3.workers.dev';
  }

  get client() {
    return this.getAttribute('client') || '';
  }

  get slug() {
    const attr = this.getAttribute('slug');
    if (!attr || attr === 'auto') {
      return this.detectSlug();
    }
    return attr;
  }

  detectSlug() {
    const pathname = window.location.pathname;
    const parts = pathname.split('/').filter(Boolean);
    const tourIndex = parts.indexOf('tours');
    if (tourIndex >= 0 && parts[tourIndex + 1]) {
      return parts[tourIndex + 1].toLowerCase().trim();
    }
    const lastSegment = parts[parts.length - 1] || '';
    return lastSegment.toLowerCase().trim();
  }

  async fetchTour(slug) {
    if (!slug || !this.client) {
      console.error('[TourismComponent] Missing slug or client');
      return null;
    }

    const url = new URL(`${this.apiUrl}/api/tours/${slug}`);
    url.searchParams.set('client', this.client);
    
    try {
      console.log(`[${this.tagName}] Fetching tour:`, url.toString());
      const res = await fetch(url, { cache: 'default' });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      const tour = data.tours?.[0] || null;
      
      if (!tour) {
        throw new Error('Tour not found in response');
      }
      
      console.log(`[${this.tagName}] Fetched tour:`, tour.name);
      
      // Set page title immediately when tour is fetched
      if (tour.name) {
        console.log(`[${this.tagName}] Setting page title immediately to:`, tour.name);
        document.title = tour.name;
        window.__TOUR_TITLE__ = tour.name;
      }
      
      return tour;
    } catch (err) {
      console.error(`[${this.tagName}] Fetch error:`, err);
      this._error = err.message;
      return null;
    }
  }

  async fetchAllTours(filter = {}) {
    if (!this.client) {
      console.error('[TourismComponent] Missing client');
      return [];
    }

    const url = new URL(`${this.apiUrl}/api/tours`);
    url.searchParams.set('client', this.client);
    
    if (filter.mode && filter.value) {
      url.searchParams.set('mode', filter.mode);
      url.searchParams.set('value', filter.value);
    }
    
    try {
      console.log(`[${this.tagName}] Fetching all tours:`, url.toString());
      const res = await fetch(url, { cache: 'default' });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      const tours = data.tours || [];
      
      console.log(`[${this.tagName}] Fetched ${tours.length} tours`);
      return tours;
    } catch (err) {
      console.error(`[${this.tagName}] Fetch error:`, err);
      this._error = err.message;
      return [];
    }
  }

  broadcastData(eventName, data) {
    const event = new CustomEvent(eventName, {
      detail: data,
      bubbles: true,
      composed: true
    });
    
    window.dispatchEvent(event);
    console.log(`[${this.tagName}] Broadcasted event:`, eventName, data);
  }

  listenForData(eventName, callback) {
    const handler = (e) => {
      console.log(`[${this.tagName}] Received event:`, eventName, e.detail);
      callback(e);
    };
    
    window.addEventListener(eventName, handler);
    
    if (!this._eventHandlers) {
      this._eventHandlers = [];
    }
    this._eventHandlers.push({ eventName, handler });
  }

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  formatPrice(value) {
    if (value == null || value === '') return '';
    
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.]/g, ''));
    
    if (!Number.isFinite(num)) return String(value);
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(num);
    } catch {
      return `$${Math.round(num).toLocaleString()}`;
    }
  }
  
  parseArrayField(value) {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string' || !value.trim()) return null;
    
    try {
      const cleaned = value.trim().replace(/,\s*$/, '');
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  disconnectedCallback() {
    if (this._eventHandlers) {
      this._eventHandlers.forEach(({ eventName, handler }) => {
        window.removeEventListener(eventName, handler);
      });
      this._eventHandlers = [];
    }
  }

  static get observedAttributes() {
    return ['slug', 'client', 'api-url'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.isConnected) {
      console.log(`[${this.tagName}] Attribute changed:`, name, oldValue, '=>', newValue);
      if (this.onAttributeChange) {
        this.onAttributeChange(name, oldValue, newValue);
      }
    }
  }
}

// ==================== TOURISM HERO COMPONENT ====================

class TourismHero extends TourismComponent {
  connectedCallback() {
    this.render();
    this.loadData();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        /* Container */
        .hero-wrapper {
          max-width: 1170px;
          margin: 0 auto;
        }
        
        /* Title */
        h1 {
          margin: 0 0 6px;
          font: 700 30px/1.2 "Poppins", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
          color: #111827;
        }
        
        /* Meta info */
        .meta-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          font-size: 16px;
          color: #6b7280;
          margin: 6px 0 10px;
        }
        
        .meta-grid span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        /* Skeleton loader */
        .skeleton { animation: sk 1.2s ease-in-out infinite; }
        
        @keyframes sk {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        .sk-title {
          height: 18px;
          background: linear-gradient(90deg, #eee, #f5f5f5, #eee);
          background-size: 200% 100%;
          border-radius: 6px;
          margin-bottom: 6px;
          width: 60%;
        }
        
        .sk-meta {
          height: 18px;
          background: linear-gradient(90deg, #eee, #f5f5f5, #eee);
          background-size: 200% 100%;
          border-radius: 6px;
          margin-bottom: 8px;
          width: 40%;
        }
        
        .sk-gallery {
          display: grid;
          grid-template-columns: 2fr 1fr;
          grid-template-rows: 190px 190px;
          gap: 8px;
          border: 1px solid #ececec;
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, .06);
          overflow: hidden;
          margin: 8px 0 12px;
          background: #fff;
        }
        
        .sk-gallery-item {
          background: linear-gradient(90deg, #eee, #f5f5f5, #eee);
          background-size: 200% 100%;
          animation: sk 1.2s ease-in-out infinite;
          border-radius: 8px;
        }
        
        .sk-gallery-item:first-child {
          grid-column: 1/2;
          grid-row: 1/3;
        }
        
        /* Content */
        .content { display: none; }
        .content.visible { display: block; }
        
        /* Gallery */
        .gallery {
          position: relative;
          display: grid;
          grid-template-columns: 2fr 1fr;
          grid-template-rows: 190px 190px;
          gap: 8px;
          border: 1px solid #ececec;
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, .06);
          overflow: hidden;
          background: #fff;
          margin: 8px 0 12px;
        }
        
        .gallery > * { min-height: 0; }
        
        .gallery .big,
        .gallery .small {
          background: #f3f3f3;
          overflow: hidden;
          margin: 0;
        }
        
        .gallery .big {
          grid-column: 1/2;
          grid-row: 1/3;
        }
        
        .gallery img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          cursor: pointer;
        }
        
        /* Photo count badge */
        .gallery-count {
          position: absolute;
          left: 12px;
          bottom: 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          background: #0b5a34;
          color: #fff;
          font-weight: 700;
          font-size: 12px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, .15);
        }
        
        .gallery-count svg {
          width: 16px;
          height: 16px;
        }
        
        /* Error state */
        .error {
          padding: 40px;
          text-align: center;
          color: #e53935;
          font-size: 1.2rem;
        }
        
        /* Mobile responsive */
        @media (max-width: 820px) {
          .gallery {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 150px 150px;
          }
          
          .gallery-item:first-child {
            grid-column: 1/3;
            grid-row: 1/2;
          }
          
          .sk-gallery {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 150px 150px;
          }
          
          .sk-gallery-item:first-child {
            grid-column: 1/3;
            grid-row: 1/2;
          }
        }
      </style>
      <div class="hero-wrapper">
        <div id="skeleton" class="skeleton">
          <div class="sk-title"></div>
          <div class="sk-meta"></div>
          <div class="sk-gallery">
            <div class="sk-gallery-item"></div>
            <div class="sk-gallery-item"></div>
            <div class="sk-gallery-item"></div>
            <div class="sk-gallery-item"></div>
          </div>
        </div>
        <div id="content" class="content">
          <h1 id="title"></h1>
          <div id="meta" class="meta-grid"></div>
          <div id="gallery" class="gallery"></div>
        </div>
        <div id="error" class="error" style="display: none;"></div>
      </div>
    `;
  }

  async loadData() {
    this._loading = true;
    const slug = this.slug;

    if (!slug) {
      this.showError('No tour slug provided or detected from URL');
      return;
    }

    if (!this.client) {
      this.showError('Client attribute is required');
      return;
    }

    const tour = await this.fetchTour(slug);
    
    if (tour) {
      this._data = tour;
      this.updateContent(tour);
      this.broadcastData('tour-data-loaded', {
        slug,
        tour,
        client: this.client,
        source: 'tourism-hero',
        timestamp: Date.now()
      });
    } else {
      this.showError(this._error || 'Tour not found');
    }

    this._loading = false;
  }

  updateContent(tour) {
    const skeleton = this.shadowRoot.getElementById('skeleton');
    const content = this.shadowRoot.getElementById('content');
    const error = this.shadowRoot.getElementById('error');
    
    skeleton.style.display = 'none';
    error.style.display = 'none';
    content.classList.add('visible');
    
    this.shadowRoot.getElementById('title').textContent = tour.name || 'Untitled Tour';
    this.shadowRoot.getElementById('meta').innerHTML = this.renderMeta(tour);
    this.shadowRoot.getElementById('gallery').innerHTML = this.renderGallery(tour);
    
    // Set page title to prevent reversion to default
    if (tour.name) {
      console.log('[TourismHero] Setting page title to:', tour.name);
      document.title = tour.name;
      
      // Also set meta title for better SEO
      const metaTitle = document.querySelector('meta[property="og:title"]');
      if (metaTitle) {
        metaTitle.setAttribute('content', tour.name);
        console.log('[TourismHero] Updated meta title to:', tour.name);
      }
      
      // Store the tour title globally to prevent other scripts from overriding it
      window.__TOUR_TITLE__ = tour.name;
      console.log('[TourismHero] Stored tour title globally:', window.__TOUR_TITLE__);
      
      // Set up a title watcher to maintain the correct title
      if (!window.__TITLE_WATCHER__) {
        window.__TITLE_WATCHER__ = true;
        console.log('[TourismHero] Setting up title watcher');
        setInterval(() => {
          if (window.__TOUR_TITLE__ && document.title !== window.__TOUR_TITLE__) {
            document.title = window.__TOUR_TITLE__;
            console.log('[TourismHero] Title corrected to:', window.__TOUR_TITLE__);
          }
        }, 1000);
      }
    } else {
      console.log('[TourismHero] No tour name found, cannot set title');
    }
  }

  renderMeta(tour) {
    const meta = [];
    if (tour.duration) meta.push(`<span>⏱ ${this.escapeHtml(tour.duration)}</span>`);
    if (tour.location) meta.push(`<span>📍 ${this.escapeHtml(tour.location)}</span>`);
    if (tour.type) meta.push(`<span>🏷 ${this.escapeHtml(tour.type)}</span>`);
    return meta.join('');
  }

  renderGallery(tour) {
    const images = [tour.image, ...(tour.gallery || [])].filter(Boolean);
    
    if (!images.length) {
      return '<div class="gallery-item"><p style="padding: 40px; text-align: center; color: #999;">No images available</p></div>';
    }

    // First image gets .big class, rest get .small
    const galleryItems = images.slice(0, 3).map((img, index) => `
      <div class="${index === 0 ? 'big' : 'small'}">
        <img 
          src="${this.escapeHtml(img)}" 
          alt="${this.escapeHtml(tour.name)}"
          loading="${index === 0 ? 'eager' : 'lazy'}"
        >
      </div>
    `).join('');

    const countBadge = images.length > 1 ? `
      <div class="gallery-count">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 7h3l1.2-2.4A2 2 0 0 1 10 4h4a2 2 0 0 1 1.8 1.1L17 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <span>${images.length}</span>
      </div>
    ` : '';

    return galleryItems + countBadge;
  }

  showError(message) {
    const skeleton = this.shadowRoot.getElementById('skeleton');
    const content = this.shadowRoot.getElementById('content');
    const error = this.shadowRoot.getElementById('error');
    
    skeleton.style.display = 'none';
    content.style.display = 'none';
    error.style.display = 'block';
    error.textContent = `⚠️ ${message}`;
    
    console.error(`[${this.tagName}] Error:`, message);
  }

  onAttributeChange(name, oldValue, newValue) {
    if (name === 'slug' || name === 'client') {
      this.loadData();
    }
  }
}

// ==================== TOURISM DETAILS COMPONENT (Block B) ====================

class TourismDetails extends TourismComponent {
  connectedCallback() {
    this.render();
    this.setupListeners();
  }

  setupListeners() {
    // Listen for data from Hero component
    this.listenForData('tour-data-loaded', (e) => {
      if (e.detail.slug === this.slug) {
        console.log('[TOURISM-DETAILS] Received tour data from Hero');
        this.updateContent(e.detail.tour);
      }
    });

    // Fallback: fetch if no data received after 2 seconds
    setTimeout(() => {
      if (!this._data) {
        console.log('[TOURISM-DETAILS] No data from Hero, fetching directly');
        this.loadData();
      }
    }, 2000);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .details-wrapper {
          max-width: 1170px;
          margin: 0 auto;
          font-family: "Poppins", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
          color: #111827;
        }
        
        /* Skeleton */
        .skeleton { animation: sk 1.2s ease-in-out infinite; }
        
        @keyframes sk {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        .sk-section {
          background: #fff;
          border: 1px solid #ececec;
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, .06);
          padding: 16px;
          margin-bottom: 16px;
        }
        
        .sk-line {
          height: 16px;
          background: linear-gradient(90deg, #eee, #f5f5f5, #eee);
          background-size: 200% 100%;
          border-radius: 4px;
          margin-bottom: 12px;
        }
        
        .sk-line.lg { height: 20px; width: 40%; }
        
        /* Content */
        .content { display: none; }
        .content.visible { display: block; }
        
        .section {
          background: #fff;
          border: 1px solid #ececec;
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, .06);
          padding: 16px;
          margin-bottom: 16px;
        }
        
        .section h3 {
          margin: 0 0 12px 0;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }
        
        .section p {
          line-height: 1.7;
          margin: 0 0 12px 0;
          color: #374151;
        }
        
        .section p:last-child { margin-bottom: 0; }
        
        /* Highlights chips */
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .chip {
          background: #f3f4f6;
          color: #374151;
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 500;
        }
        
        /* Gallery */
        .gallery {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        
        .gallery img {
          width: 100%;
          aspect-ratio: 4/3;
          object-fit: cover;
          border-radius: 10px;
          display: block;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        
        .gallery img:hover {
          transform: scale(1.02);
        }
        
        @media (max-width: 720px) {
          .gallery {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        /* Accordion */
        details {
          border: 1px solid #ececec;
          border-radius: 10px;
          background: #fff;
          margin-bottom: 10px;
          transition: all 0.2s ease;
        }
        
        details:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, .06);
        }
        
        summary {
          cursor: pointer;
          list-style: none;
          padding: 12px 14px;
          font-weight: 600;
          color: #111827;
          border-radius: 10px;
          transition: background-color 0.2s ease;
        }
        
        summary:hover {
          background-color: #f9fafb;
        }
        
        summary::-webkit-details-marker {
          display: none;
        }
        
        .accordion-content {
          padding: 0 14px 14px 14px;
          color: #374151;
          line-height: 1.6;
        }
        
        ul {
          margin: 8px 0 0 18px;
          padding: 0;
        }
        
        li {
          margin: 4px 0;
        }
        
        .error {
          padding: 40px;
          text-align: center;
          color: #e53935;
          font-size: 1.2rem;
        }
      </style>
      
      <div class="details-wrapper">
        <!-- Skeleton -->
        <div id="skeleton">
          <div class="sk-section">
            <div class="sk-line lg"></div>
            <div class="sk-line" style="width:95%"></div>
            <div class="sk-line" style="width:92%"></div>
            <div class="sk-line" style="width:88%"></div>
          </div>
          <div class="sk-section">
            <div class="sk-line lg"></div>
            <div class="sk-line" style="width:80%"></div>
          </div>
        </div>
        
        <!-- Content -->
        <div id="content" class="content">
          <div id="overview" class="section"></div>
          <div id="highlights-section" class="section" style="display:none;">
            <h3>Highlights</h3>
            <div id="highlights" class="chips"></div>
          </div>
          <div id="gallery-section" class="section" style="display:none;">
            <h3>Gallery</h3>
            <div id="gallery" class="gallery"></div>
          </div>
          <div id="accordion"></div>
        </div>
        
        <!-- Error -->
        <div id="error" class="error" style="display:none;"></div>
      </div>
    `;
  }

  async loadData() {
    const slug = this.slug;
    if (!slug || !this.client) return;
    
    const tour = await this.fetchTour(slug);
    if (tour) {
      this.updateContent(tour);
    } else {
      this.showError(this._error || 'Tour details not found');
    }
  }

  updateContent(tour) {
    this._data = tour;
    
    const skeleton = this.shadowRoot.getElementById('skeleton');
    const content = this.shadowRoot.getElementById('content');
    const error = this.shadowRoot.getElementById('error');
    
    skeleton.style.display = 'none';
    error.style.display = 'none';
    content.classList.add('visible');
    
    // Overview
    const overview = this.shadowRoot.getElementById('overview');
    overview.innerHTML = tour.descriptionHTML || `<p>${this.escapeHtml(tour.excerpt || '')}</p>`;
    
    // Highlights
    const highlights = this.parseArrayField(tour.highlights);
    if (highlights && highlights.length) {
      const highlightsSection = this.shadowRoot.getElementById('highlights-section');
      const highlightsDiv = this.shadowRoot.getElementById('highlights');
      highlightsSection.style.display = 'block';
      highlightsDiv.innerHTML = highlights.map(h => 
        `<span class="chip">${this.escapeHtml(h)}</span>`
      ).join('');
    }
    
    // Gallery
    const gallery = this.parseArrayField(tour.gallery);
    if (gallery && gallery.length) {
      const gallerySection = this.shadowRoot.getElementById('gallery-section');
      const galleryDiv = this.shadowRoot.getElementById('gallery');
      gallerySection.style.display = 'block';
      galleryDiv.innerHTML = gallery.slice(0, 6).map(img => 
        `<img src="${this.escapeHtml(img)}" alt="${this.escapeHtml(tour.name)}" loading="lazy">`
      ).join('');
    }
    
    // Accordion
    const accordion = this.shadowRoot.getElementById('accordion');
    accordion.innerHTML = this.renderAccordion(tour);
  }

  renderAccordion(tour) {
    let html = '';
    
    // Itinerary
    const itinerary = this.parseArrayField(tour.itinerary);
    if (itinerary && itinerary.length) {
      html += `
        <details open>
          <summary>📋 Itinerary</summary>
          <div class="accordion-content">
            <ul>${itinerary.map(item => `<li>${this.escapeHtml(item)}</li>`).join('')}</ul>
          </div>
        </details>
      `;
    }
    
    // Inclusions
    const inclusions = this.parseArrayField(tour.inclusions);
    if (inclusions && inclusions.length) {
      html += `
        <details open>
          <summary>✅ What's Included</summary>
          <div class="accordion-content">
            <ul>${inclusions.map(item => `<li>${this.escapeHtml(item)}</li>`).join('')}</ul>
          </div>
        </details>
      `;
    }
    
    // Exclusions
    const exclusions = this.parseArrayField(tour.exclusions);
    if (exclusions && exclusions.length) {
      html += `
        <details open>
          <summary>❌ What to Bring / Exclusions</summary>
          <div class="accordion-content">
            <ul>${exclusions.map(item => `<li>${this.escapeHtml(item)}</li>`).join('')}</ul>
          </div>
        </details>
      `;
    }
    
    // FAQs
    const faqs = this.parseArrayField(tour.faqs);
    if (faqs && faqs.length) {
      html += `
        <details open>
          <summary>❓ FAQs</summary>
          <div class="accordion-content">
            <ul>${faqs.map(item => `<li>${this.escapeHtml(item)}</li>`).join('')}</ul>
          </div>
        </details>
      `;
    }
    
    return html;
  }

  showError(message) {
    const skeleton = this.shadowRoot.getElementById('skeleton');
    const content = this.shadowRoot.getElementById('content');
    const error = this.shadowRoot.getElementById('error');
    
    skeleton.style.display = 'none';
    content.style.display = 'none';
    error.style.display = 'block';
    error.textContent = `⚠️ ${message}`;
  }
}

// ==================== TOURISM RELATED COMPONENT (Block C) ====================

class TourismRelated extends TourismComponent {
  connectedCallback() {
    this.render();
    this.setupListeners();
  }

  setupListeners() {
    // Listen for current tour data
    this.listenForData('tour-data-loaded', async (e) => {
      if (e.detail.slug === this.slug) {
        console.log('[TOURISM-RELATED] Received current tour data');
        this.currentTour = e.detail.tour;
        await this.loadRelated();
      }
    });

    // Fallback: load after timeout
    setTimeout(async () => {
      if (!this.currentTour) {
        console.log('[TOURISM-RELATED] No data from Hero, loading related anyway');
        await this.loadRelated();
      }
    }, 3000);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .related-wrapper {
          max-width: 1170px;
          margin: 20px auto;
          padding: 20px 0;
          font-family: "Poppins", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        }
        
        h2 {
          font-size: 26px;
          font-weight: bolder;
          color: #111827;
          margin: 0;
          text-align: center;
        }
        
        h3 {
          font-size: 18px;
          font-weight: 400;
          color: #111827;
          margin: 0 0 30px 0;
          text-align: center;
        }
        
        /* Skeleton */
        .skeleton-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }
        
        @media (min-width: 768px) {
          .skeleton-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        @media (max-width: 767px) {
          .skeleton-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .sk-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          padding: 0;
        }
        
        .sk-card .sk-image {
          width: 100%;
          height: 200px;
          background: linear-gradient(90deg, #eee, #f5f5f5, #eee);
          background-size: 200% 100%;
          animation: sk 1.2s ease-in-out infinite;
        }
        
        @keyframes sk {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        /* Tour grid */
        .tour-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          max-width: 100%;
        }
        
        @media (min-width: 768px) {
          .tour-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        @media (max-width: 767px) {
          .tour-grid {
            grid-template-columns: 1fr;
          }
        }
        
        /* Tour Card */
        .tour-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          text-decoration: none;
          color: inherit;
          display: block;
        }
        
        .tour-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          border-color: #d1d5db;
        }
        
        /* Tour Image */
        .tour-card-image {
          position: relative;
          width: 100%;
          height: 200px;
          overflow: hidden;
        }
        
        .tour-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        
        .tour-card:hover .tour-card-image img {
          transform: scale(1.05);
        }
        
        /* Price Badge */
        .tour-card-price {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #0b5a34;
          color: #fff;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        
        /* Tour Content */
        .tour-card-content {
          padding: 20px;
        }
        
        .tour-card-title {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .tour-card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #6b7280;
        }
        
        .tour-card-meta span {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        
        .tour-card-description {
          margin: 0 0 16px 0;
          font-size: 14px;
          line-height: 1.5;
          color: #4b5563;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* View Details Button */
        .tour-card-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 12px 16px;
          background: #1f2937;
          color: #fff;
          text-decoration: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
        }
        
        .tour-card-button:hover {
          background: #111827;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .tour-card-button:active {
          transform: translateY(0);
        }
        
        .error {
          padding: 40px;
          text-align: center;
          color: #e53935;
        }
        
        @media (max-width: 768px) {
          .related-wrapper {
            padding: 16px;
          }
          
          h2 {
            font-size: 22px;
          }
          
          h3 {
            font-size: 16px;
          }
          
          .tour-card-content {
            padding: 16px;
          }
          
          .tour-card-title {
            font-size: 16px;
          }
        }
      </style>
      
      <div class="related-wrapper">
        <section class="related-tours-section">
          <h2>Related Tours</h2>
          <h3>Discover more amazing experiences</h3>
          
          <!-- Skeleton -->
          <div id="skeleton" class="skeleton-grid">
            <div class="sk-card">
              <div class="sk-image"></div>
            </div>
            <div class="sk-card">
              <div class="sk-image"></div>
            </div>
            <div class="sk-card">
              <div class="sk-image"></div>
            </div>
          </div>
          
          <!-- Grid -->
          <div id="grid" class="tour-grid" style="display:none;"></div>
          
          <!-- Error -->
          <div id="error" class="error" style="display:none;"></div>
        </section>
      </div>
    `;
  }

  async loadRelated() {
    const allTours = await this.fetchAllTours();
    const currentSlug = this.slug;
    
    // Filter out current tour
    let related = allTours.filter(t => t.slug !== currentSlug);
    
    // If we have current tour type, filter by same type
    if (this.currentTour?.type) {
      const sameType = related.filter(t => t.type === this.currentTour.type);
      if (sameType.length > 0) {
        related = sameType;
      }
    }
    
    // Limit
    const limit = parseInt(this.getAttribute('limit') || '3');
    related = related.slice(0, limit);
    
    this.renderRelated(related);
  }

  renderRelated(tours) {
    const skeleton = this.shadowRoot.getElementById('skeleton');
    const grid = this.shadowRoot.getElementById('grid');
    const error = this.shadowRoot.getElementById('error');
    
    skeleton.style.display = 'none';
    
    if (!tours.length) {
      error.style.display = 'block';
      error.textContent = 'No related tours found';
      return;
    }
    
    grid.style.display = 'grid';
    grid.innerHTML = tours.map(tour => this.renderCard(tour)).join('');
  }

  renderCard(tour) {
    const price = tour.fromPrice ? this.formatPrice(tour.fromPrice) : 'Price on request';
    
    // Build meta info
    const meta = [];
    if (tour.duration) meta.push(`<span>⏱ ${this.escapeHtml(tour.duration)}</span>`);
    if (tour.location) meta.push(`<span>📍 ${this.escapeHtml(tour.location)}</span>`);
    if (tour.type) meta.push(`<span>🏷 ${this.escapeHtml(tour.type)}</span>`);
    const metaHTML = meta.length ? `<div class="tour-card-meta">${meta.join('')}</div>` : '';
    
    // Build description
    const description = tour.excerpt ? `<div class="tour-card-description">${this.escapeHtml(tour.excerpt)}</div>` : '';
    
    return `
      <div class="tour-card">
        <div class="tour-card-image">
          <img src="${this.escapeHtml(tour.image)}" alt="${this.escapeHtml(tour.name)}" loading="lazy">
          <div class="tour-card-price">From ${price}</div>
        </div>
        <div class="tour-card-content">
          <h4 class="tour-card-title">${this.escapeHtml(tour.name)}</h4>
          ${metaHTML}
          ${description}
          <a href="/${this.escapeHtml(tour.slug)}" class="tour-card-button">View Details</a>
        </div>
      </div>
    `;
  }
}

// ==================== REGISTER COMPONENTS ====================

customElements.define('tourism-hero', TourismHero);
customElements.define('tourism-details', TourismDetails);
customElements.define('tourism-related', TourismRelated);

console.log('✅ Tourism UI Kit Web Components loaded successfully!');
console.log('📦 Available components: <tourism-hero>, <tourism-details>, <tourism-related>');

