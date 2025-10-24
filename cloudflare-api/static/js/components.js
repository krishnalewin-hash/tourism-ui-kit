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

// ==================== REGISTER COMPONENTS ====================

customElements.define('tourism-hero', TourismHero);

console.log('✅ Tourism UI Kit Web Components loaded successfully!');
console.log('📦 Available components: <tourism-hero>');

