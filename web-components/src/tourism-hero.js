/**
 * Tourism Hero Component (Block A)
 * 
 * Renders the hero section of a tour detail page:
 * - Title
 * - Meta information (duration, location, type)
 * - Image gallery
 * - Loading skeleton
 * 
 * Fetches tour data and broadcasts to other components
 */

import { TourismComponent } from './base-component.js';

export class TourismHero extends TourismComponent {
  connectedCallback() {
    this.render();
    this.loadData();
  }

  /**
   * Initial render with skeleton
   */
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        /* Base styles */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .hero-wrapper {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        /* Skeleton loader */
        .skeleton {
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .sk-title {
          height: 40px;
          background: #e0e0e0;
          border-radius: 8px;
          margin-bottom: 16px;
          width: 60%;
        }

        .sk-meta {
          height: 24px;
          background: #e0e0e0;
          border-radius: 6px;
          margin-bottom: 24px;
          width: 40%;
        }

        .sk-gallery {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 12px;
          height: 400px;
        }

        .sk-gallery-item {
          background: #e0e0e0;
          border-radius: 12px;
        }

        .sk-gallery-item:first-child {
          grid-row: span 2;
        }

        /* Content styles */
        .content {
          display: none;
        }

        .content.visible {
          display: block;
        }

        h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #222;
          margin-bottom: 16px;
          line-height: 1.2;
        }

        .meta-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 24px;
          font-size: 1rem;
          color: #555;
        }

        .meta-grid span {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Gallery styles */
        .gallery {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 12px;
          margin-bottom: 32px;
          position: relative;
        }

        .gallery-item {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          cursor: pointer;
          background: #f5f5f5;
        }

        .gallery-item:first-child {
          grid-row: span 2;
        }

        .gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }

        .gallery-item:hover img {
          transform: scale(1.05);
        }

        .gallery-count {
          position: absolute;
          bottom: 16px;
          right: 16px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 10;
        }

        .gallery-count svg {
          width: 18px;
          height: 18px;
        }

        /* Error state */
        .error {
          padding: 40px;
          text-align: center;
          color: #e53935;
          font-size: 1.2rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          h1 {
            font-size: 1.8rem;
          }

          .gallery {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .gallery-item:first-child {
            grid-row: span 1;
          }

          .meta-grid {
            font-size: 0.9rem;
            gap: 12px;
          }
        }
      </style>

      <div class="hero-wrapper">
        <!-- Skeleton loader -->
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

        <!-- Content (hidden until loaded) -->
        <div id="content" class="content">
          <h1 id="title"></h1>
          <div id="meta" class="meta-grid"></div>
          <div id="gallery" class="gallery"></div>
        </div>

        <!-- Error state -->
        <div id="error" class="error" style="display: none;"></div>
      </div>
    `;
  }

  /**
   * Load tour data from API
   */
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
      
      // Broadcast data to other components
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

  /**
   * Update content with tour data
   */
  updateContent(tour) {
    const skeleton = this.shadowRoot.getElementById('skeleton');
    const content = this.shadowRoot.getElementById('content');
    const error = this.shadowRoot.getElementById('error');
    
    // Hide skeleton and error, show content
    skeleton.style.display = 'none';
    error.style.display = 'none';
    content.classList.add('visible');
    
    // Update title
    this.shadowRoot.getElementById('title').textContent = tour.name || 'Untitled Tour';
    
    // Update meta
    this.shadowRoot.getElementById('meta').innerHTML = this.renderMeta(tour);
    
    // Update gallery
    this.shadowRoot.getElementById('gallery').innerHTML = this.renderGallery(tour);
  }

  /**
   * Render meta information
   */
  renderMeta(tour) {
    const meta = [];
    
    if (tour.duration) {
      meta.push(`<span>⏱ ${this.escapeHtml(tour.duration)}</span>`);
    }
    
    if (tour.location) {
      meta.push(`<span>📍 ${this.escapeHtml(tour.location)}</span>`);
    }
    
    if (tour.type) {
      meta.push(`<span>🏷 ${this.escapeHtml(tour.type)}</span>`);
    }
    
    return meta.join('');
  }

  /**
   * Render image gallery
   */
  renderGallery(tour) {
    const images = [tour.image, ...(tour.gallery || [])].filter(Boolean);
    
    if (!images.length) {
      return '<div class="gallery-item"><p style="padding: 40px; text-align: center; color: #999;">No images available</p></div>';
    }

    const galleryItems = images.slice(0, 4).map((img, index) => `
      <div class="gallery-item">
        <img 
          src="${this.escapeHtml(img)}" 
          alt="${this.escapeHtml(tour.name)}"
          loading="${index === 0 ? 'eager' : 'lazy'}"
        >
      </div>
    `).join('');

    const countBadge = images.length > 4 ? `
      <div class="gallery-count">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 7h3l1.2-2.4A2 2 0 0 1 10 4h4a2 2 0 0 1 1.8 1.1L17 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <span>${images.length} Photos</span>
      </div>
    ` : '';

    return galleryItems + countBadge;
  }

  /**
   * Show error state
   */
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

  /**
   * Handle attribute changes
   */
  onAttributeChange(name, oldValue, newValue) {
    if (name === 'slug' || name === 'client') {
      // Re-fetch data if slug or client changes
      this.loadData();
    }
  }
}

// Register the component
customElements.define('tourism-hero', TourismHero);

