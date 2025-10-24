/**
 * Tourism UI Kit - Base Web Component
 * 
 * Base class for all tourism components with shared functionality:
 * - API communication
 * - Slug detection
 * - Event broadcasting
 * - Shadow DOM setup
 * - Error handling
 */

export class TourismComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._data = null;
    this._loading = false;
    this._error = null;
  }

  /**
   * API URL - defaults to production, can be overridden
   */
  get apiUrl() {
    return this.getAttribute('api-url') || 
           'https://tourism-api-production.krishna-0a3.workers.dev';
  }

  /**
   * Client name - required attribute
   */
  get client() {
    return this.getAttribute('client') || '';
  }

  /**
   * Tour slug - auto-detects from URL if not provided
   */
  get slug() {
    const attr = this.getAttribute('slug');
    
    // If slug="auto" or not set, auto-detect from URL
    if (!attr || attr === 'auto') {
      return this.detectSlug();
    }
    
    return attr;
  }

  /**
   * Auto-detect slug from URL pathname
   * Supports formats:
   * - /tours/blue-hole-secret-falls
   * - /blue-hole-secret-falls
   * - /tours/blue-hole-secret-falls?query=params
   */
  detectSlug() {
    const pathname = window.location.pathname;
    const parts = pathname.split('/').filter(Boolean);
    
    // Check if URL has /tours/ segment
    const tourIndex = parts.indexOf('tours');
    if (tourIndex >= 0 && parts[tourIndex + 1]) {
      return parts[tourIndex + 1].toLowerCase().trim();
    }
    
    // Otherwise use last segment
    const lastSegment = parts[parts.length - 1] || '';
    return lastSegment.toLowerCase().trim();
  }

  /**
   * Fetch a single tour by slug
   */
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

  /**
   * Fetch all tours for a client with optional filtering
   */
  async fetchAllTours(filter = {}) {
    if (!this.client) {
      console.error('[TourismComponent] Missing client');
      return [];
    }

    const url = new URL(`${this.apiUrl}/api/tours`);
    url.searchParams.set('client', this.client);
    
    // Add filter parameters
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

  /**
   * Broadcast data to other components via CustomEvent
   */
  broadcastData(eventName, data) {
    const event = new CustomEvent(eventName, {
      detail: data,
      bubbles: true,
      composed: true
    });
    
    window.dispatchEvent(event);
    console.log(`[${this.tagName}] Broadcasted event:`, eventName, data);
  }

  /**
   * Listen for data from other components
   */
  listenForData(eventName, callback) {
    const handler = (e) => {
      console.log(`[${this.tagName}] Received event:`, eventName, e.detail);
      callback(e);
    };
    
    window.addEventListener(eventName, handler);
    
    // Store handler for cleanup
    if (!this._eventHandlers) {
      this._eventHandlers = [];
    }
    this._eventHandlers.push({ eventName, handler });
  }

  /**
   * Inject CSS into Shadow DOM
   */
  injectStyles(cssUrl) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl;
    this.shadowRoot.appendChild(link);
  }

  /**
   * Helper: Escape HTML to prevent XSS
   */
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Helper: Format price
   */
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

  /**
   * Cleanup on disconnect
   */
  disconnectedCallback() {
    // Clean up event listeners
    if (this._eventHandlers) {
      this._eventHandlers.forEach(({ eventName, handler }) => {
        window.removeEventListener(eventName, handler);
      });
      this._eventHandlers = [];
    }
  }

  /**
   * Handle attribute changes (for reactive updates)
   */
  static get observedAttributes() {
    return ['slug', 'client', 'api-url'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.isConnected) {
      console.log(`[${this.tagName}] Attribute changed:`, name, oldValue, '=>', newValue);
      // Subclasses can override to react to changes
      if (this.onAttributeChange) {
        this.onAttributeChange(name, oldValue, newValue);
      }
    }
  }
}

