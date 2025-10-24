# 🧩 Web Components - Revised Architecture

## 🎯 **Key Requirement: Separate Blocks for GHL Form Placement**

The tour detail page needs **3 separate components** (Block A, B, C) so the GHL form can be positioned between them in the page builder.

---

## 🎨 **Revised Component Structure**

### **Tour Detail Page Layout (GHL):**
```html
<script src="https://tourism-api-production.krishna-0a3.workers.dev/components.js"></script>

<!-- Block A: Hero Section -->
<tourism-hero slug="auto" client="funtrip-tours"></tourism-hero>

<!-- Block B: Details Section -->
<tourism-details slug="auto" client="funtrip-tours"></tourism-details>

<!-- GHL Form Goes Here (user can position anywhere!) -->
<div class="ghl-form-container">
  <!-- User's GHL form embed code -->
</div>

<!-- Block C: Related Tours -->
<tourism-related slug="auto" client="funtrip-tours"></tourism-related>
```

**Benefits:**
- ✅ GHL form can be positioned anywhere
- ✅ Each block is independent
- ✅ Flexible layout in page builder
- ✅ Blocks share data via events

---

## 🧩 **Individual Components**

### **1. `<tourism-hero>` (Block A)**
```html
<tourism-hero 
  slug="blue-hole-secret-falls"    <!-- Optional: auto-detects from URL -->
  client="funtrip-tours"            <!-- Required -->
  api-url="https://..."             <!-- Optional: override API -->
></tourism-hero>
```

**Renders:**
- Hero image gallery
- Tour title
- Meta info (duration, location, etc.)
- Breadcrumbs

**Features:**
- Auto-detects slug from URL
- Fetches tour data
- Broadcasts data to other components via `CustomEvent`
- Loading skeleton

---

### **2. `<tourism-details>` (Block B)**
```html
<tourism-details 
  slug="blue-hole-secret-falls"    <!-- Optional: auto-detects -->
  client="funtrip-tours"            <!-- Required -->
></tourism-details>
```

**Renders:**
- Overview/description
- Highlights chips
- Gallery
- Accordion (itinerary, inclusions, exclusions, FAQs)

**Features:**
- Listens for data from `<tourism-hero>` (avoids duplicate fetch)
- Falls back to fetching if no data received
- Parses JSON arrays correctly

---

### **3. `<tourism-related>` (Block C)**
```html
<tourism-related 
  slug="blue-hole-secret-falls"    <!-- Optional: auto-detects -->
  client="funtrip-tours"            <!-- Required -->
  limit="3"                         <!-- Optional: max related tours -->
></tourism-related>
```

**Renders:**
- Related tour cards
- "Discover more experiences" section

**Features:**
- Filters out current tour
- Shows tours from same category
- Links to other tour pages

---

### **4. `<tourism-tour-list>` (Category Pages)**
```html
<tourism-tour-list 
  client="funtrip-tours"
  filter-type="Adventure"           <!-- Optional: filter by type -->
  filter-tag="Family Friendly"      <!-- Optional: filter by tag -->
  filter-keyword="waterfall"        <!-- Optional: keyword search -->
  limit="20"                        <!-- Optional: max tours -->
></tourism-tour-list>
```

**Renders:**
- Tour card grid
- Loading skeleton
- Empty state

**Features:**
- Server-side filtering
- Responsive grid
- Lazy image loading

---

### **5. `<tourism-form>` (Standalone Form - Optional)**
```html
<tourism-form 
  client="funtrip-tours"
  form-type="tour"                  <!-- 'tour' or 'transfer' -->
  tour-name="Blue Hole Secret Falls" <!-- Optional: for auto-fill -->
  google-maps-key="auto"            <!-- Optional: fetches from API -->
></tourism-form>
```

**Renders:**
- Booking form with Google Places autocomplete
- Date/time pickers
- Passenger selector
- Validation

**Note:** Most clients will use GHL forms, but this is available for custom implementations.

---

## 🔄 **Component Communication Pattern**

### **Data Flow:**
```
1. User loads page with slug in URL

2. <tourism-hero> (Block A):
   - Detects slug from URL
   - Fetches tour data from API
   - Renders hero section
   - Dispatches 'tour-data-loaded' event with data

3. <tourism-details> (Block B):
   - Listens for 'tour-data-loaded' event
   - Uses received data (no duplicate fetch!)
   - Renders details section

4. <tourism-related> (Block C):
   - Listens for 'tour-data-loaded' event
   - Fetches all tours separately
   - Filters out current tour
   - Renders related tours

5. GHL Form (between blocks):
   - Can listen for 'tour-data-loaded' to auto-fill tour name
   - Independent of components
```

### **Event API:**
```javascript
// Dispatched by <tourism-hero> after data loads
window.dispatchEvent(new CustomEvent('tour-data-loaded', {
  detail: {
    slug: 'blue-hole-secret-falls',
    tour: { name: '...', type: '...', ... },
    client: 'funtrip-tours',
    source: 'tourism-hero'
  }
}));

// Other components listen:
window.addEventListener('tour-data-loaded', (e) => {
  console.log('Tour loaded:', e.detail.tour.name);
  // Use e.detail.tour for rendering
});
```

---

## 📝 **Complete Embed Examples**

### **Tour Detail Page (Full Layout):**
```html
<!-- Load Web Components library once -->
<script src="https://tourism-api-production.krishna-0a3.workers.dev/components.js"></script>

<!-- Block A: Hero Section -->
<tourism-hero client="funtrip-tours"></tourism-hero>

<!-- Block B: Details Section -->
<tourism-details client="funtrip-tours"></tourism-details>

<!-- GHL Form (positioned by user in page builder) -->
<div id="ghl-form-section">
  <!-- Your GHL form embed code here -->
  <script>
    window.CFG = {
      CLIENT: 'funtrip-tours',
      formType: 'tour'
    };
  </script>
  <link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/tour-detail-form.css">
  <script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/tour-detail-form.js"></script>
</div>

<!-- Block C: Related Tours -->
<tourism-related client="funtrip-tours" limit="3"></tourism-related>
```

---

### **Category Page:**
```html
<!-- Load Web Components library once -->
<script src="https://tourism-api-production.krishna-0a3.workers.dev/components.js"></script>

<!-- Tour List with Filter -->
<tourism-tour-list 
  client="funtrip-tours" 
  filter-type="Adventure">
</tourism-tour-list>
```

---

### **Minimal Tour Detail (No Related Tours):**
```html
<script src="https://tourism-api-production.krishna-0a3.workers.dev/components.js"></script>

<tourism-hero client="funtrip-tours"></tourism-hero>
<tourism-details client="funtrip-tours"></tourism-details>

<!-- No Block C - user choice! -->
```

---

## 🏗️ **Technical Architecture**

### **Base Component Class:**
```javascript
class TourismComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._data = null;
  }

  // Shared getters
  get apiUrl() {
    return this.getAttribute('api-url') || 
           'https://tourism-api-production.krishna-0a3.workers.dev';
  }

  get client() {
    return this.getAttribute('client') || '';
  }

  get slug() {
    return this.getAttribute('slug') || this.detectSlug();
  }

  // Auto-detect slug from URL
  detectSlug() {
    if (this.getAttribute('slug') === 'auto' || !this.hasAttribute('slug')) {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const tourIndex = parts.indexOf('tours');
      return tourIndex >= 0 ? parts[tourIndex + 1] : parts[parts.length - 1];
    }
    return this.getAttribute('slug');
  }

  // Shared fetch method
  async fetchTour(slug) {
    const url = new URL(`${this.apiUrl}/api/tours/${slug}`);
    url.searchParams.set('client', this.client);
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      return data.tours?.[0] || null;
    } catch (err) {
      console.error('[TourismComponent] Fetch error:', err);
      return null;
    }
  }

  async fetchAllTours(filter = {}) {
    const url = new URL(`${this.apiUrl}/api/tours`);
    url.searchParams.set('client', this.client);
    
    if (filter.mode && filter.value) {
      url.searchParams.set('mode', filter.mode);
      url.searchParams.set('value', filter.value);
    }
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      return data.tours || [];
    } catch (err) {
      console.error('[TourismComponent] Fetch error:', err);
      return [];
    }
  }

  // Dispatch data for other components
  broadcastData(eventName, data) {
    window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }

  // Listen for data from other components
  listenForData(eventName, callback) {
    window.addEventListener(eventName, callback);
  }

  // Inject styles into Shadow DOM
  injectStyles(cssUrl) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl;
    this.shadowRoot.appendChild(link);
  }
}
```

---

### **Hero Component (Block A):**
```javascript
class TourismHero extends TourismComponent {
  connectedCallback() {
    this.render();
    this.loadData();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="${this.apiUrl}/static/components/styles/hero.css">
      <div class="hero-wrapper">
        <div id="skeleton" class="skeleton">
          <div class="sk-title"></div>
          <div class="sk-meta"></div>
          <div class="sk-gallery"></div>
        </div>
        <div id="content" style="display:none;">
          <h1 id="title"></h1>
          <div id="meta"></div>
          <div id="gallery"></div>
        </div>
      </div>
    `;
  }

  async loadData() {
    const slug = this.slug;
    const tour = await this.fetchTour(slug);
    
    if (tour) {
      this.updateContent(tour);
      this.broadcastData('tour-data-loaded', {
        slug,
        tour,
        client: this.client,
        source: 'tourism-hero'
      });
    } else {
      this.showError();
    }
  }

  updateContent(tour) {
    const skeleton = this.shadowRoot.getElementById('skeleton');
    const content = this.shadowRoot.getElementById('content');
    
    skeleton.style.display = 'none';
    content.style.display = 'block';
    
    this.shadowRoot.getElementById('title').textContent = tour.name;
    this.shadowRoot.getElementById('meta').innerHTML = this.renderMeta(tour);
    this.shadowRoot.getElementById('gallery').innerHTML = this.renderGallery(tour);
  }

  renderMeta(tour) {
    return `
      <div class="meta-grid">
        ${tour.duration ? `<span>⏱ ${tour.duration}</span>` : ''}
        ${tour.location ? `<span>📍 ${tour.location}</span>` : ''}
        ${tour.type ? `<span>🏷 ${tour.type}</span>` : ''}
      </div>
    `;
  }

  renderGallery(tour) {
    const images = [tour.image, ...(tour.gallery || [])].filter(Boolean);
    return images.map((img, i) => `
      <img src="${img}" alt="${tour.name}" loading="${i === 0 ? 'eager' : 'lazy'}">
    `).join('');
  }

  showError() {
    this.shadowRoot.querySelector('.hero-wrapper').innerHTML = `
      <div class="error">Tour not found</div>
    `;
  }
}

customElements.define('tourism-hero', TourismHero);
```

---

### **Details Component (Block B):**
```javascript
class TourismDetails extends TourismComponent {
  connectedCallback() {
    this.render();
    
    // Try to receive data from Hero component
    this.listenForData('tour-data-loaded', (e) => {
      if (e.detail.slug === this.slug) {
        this.updateContent(e.detail.tour);
      }
    });
    
    // Fallback: fetch if no data received after 2 seconds
    setTimeout(() => {
      if (!this._data) {
        this.loadData();
      }
    }, 2000);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="${this.apiUrl}/static/components/styles/details.css">
      <div class="details-wrapper">
        <div id="skeleton" class="skeleton">
          <div class="sk-line"></div>
          <div class="sk-line"></div>
          <div class="sk-line"></div>
        </div>
        <div id="content" style="display:none;">
          <section id="overview"></section>
          <section id="highlights"></section>
          <section id="accordion"></section>
        </div>
      </div>
    `;
  }

  async loadData() {
    const tour = await this.fetchTour(this.slug);
    if (tour) {
      this.updateContent(tour);
    }
  }

  updateContent(tour) {
    this._data = tour;
    const skeleton = this.shadowRoot.getElementById('skeleton');
    const content = this.shadowRoot.getElementById('content');
    
    skeleton.style.display = 'none';
    content.style.display = 'block';
    
    this.shadowRoot.getElementById('overview').innerHTML = tour.descriptionHTML || '';
    this.shadowRoot.getElementById('highlights').innerHTML = this.renderHighlights(tour);
    this.shadowRoot.getElementById('accordion').innerHTML = this.renderAccordion(tour);
  }

  renderHighlights(tour) {
    if (!tour.highlights || !tour.highlights.length) return '';
    return `
      <h3>Highlights</h3>
      <div class="chips">
        ${tour.highlights.map(h => `<span class="chip">${h}</span>`).join('')}
      </div>
    `;
  }

  renderAccordion(tour) {
    // Render itinerary, inclusions, exclusions, FAQs
    // ... accordion logic
  }
}

customElements.define('tourism-details', TourismDetails);
```

---

### **Related Tours Component (Block C):**
```javascript
class TourismRelated extends TourismComponent {
  connectedCallback() {
    this.render();
    
    // Wait for current tour data
    this.listenForData('tour-data-loaded', async (e) => {
      if (e.detail.slug === this.slug) {
        this.currentTour = e.detail.tour;
        await this.loadRelated();
      }
    });
    
    // Fallback: load after timeout
    setTimeout(() => {
      if (!this.currentTour) {
        this.loadRelated();
      }
    }, 3000);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="${this.apiUrl}/static/components/styles/related.css">
      <div class="related-wrapper">
        <h2>Related Tours</h2>
        <h3>Discover more amazing experiences</h3>
        <div id="skeleton" class="skeleton-grid">
          <div class="sk-card"></div>
          <div class="sk-card"></div>
          <div class="sk-card"></div>
        </div>
        <div id="grid" class="tour-grid" style="display:none;"></div>
      </div>
    `;
  }

  async loadRelated() {
    const allTours = await this.fetchAllTours();
    const currentSlug = this.slug;
    
    // Filter out current tour and get related (same type)
    let related = allTours.filter(t => t.slug !== currentSlug);
    
    if (this.currentTour?.type) {
      related = related.filter(t => t.type === this.currentTour.type);
    }
    
    const limit = parseInt(this.getAttribute('limit') || '3');
    related = related.slice(0, limit);
    
    this.renderRelated(related);
  }

  renderRelated(tours) {
    const skeleton = this.shadowRoot.getElementById('skeleton');
    const grid = this.shadowRoot.getElementById('grid');
    
    skeleton.style.display = 'none';
    grid.style.display = 'grid';
    
    grid.innerHTML = tours.map(tour => this.renderCard(tour)).join('');
  }

  renderCard(tour) {
    return `
      <article class="tour-card">
        <a href="/${tour.slug}">
          <img src="${tour.image}" alt="${tour.name}" loading="lazy">
          <h4>${tour.name}</h4>
          <p>${tour.excerpt || ''}</p>
          <span class="price">From ${tour.fromPrice || 'TBD'}</span>
        </a>
      </article>
    `;
  }
}

customElements.define('tourism-related', TourismRelated);
```

---

## 📦 **File Structure**

```
cloudflare-api/
  static/
    components/
      tourism-components.js          # Bundled all components
      styles/
        hero.css                     # Block A styles
        details.css                  # Block B styles
        related.css                  # Block C styles
        tour-list.css                # Category page styles
        shared.css                   # Shared utilities
```

---

## ✅ **Benefits of This Approach**

1. **🎯 Flexible Layout**
   - Blocks are independent
   - GHL form can go anywhere
   - Users control positioning

2. **🚀 Efficient Data Loading**
   - Hero fetches once
   - Other blocks listen for data
   - No duplicate API calls

3. **📦 Single Script Load**
   - All components in one file
   - Lazy load styles per component
   - ~50KB total (gzipped)

4. **🎨 No Style Conflicts**
   - Shadow DOM encapsulation
   - GHL styles can't interfere
   - Each component isolated

5. **♻️ Reusable**
   - Mix and match components
   - Use individually or together
   - Future-proof architecture

---

## 🚀 **Implementation Plan**

### **Phase 1: Base Infrastructure**
1. Create `TourismComponent` base class
2. Set up Shadow DOM
3. Implement event communication system
4. Add error handling

### **Phase 2: Individual Components**
1. Build `<tourism-hero>` (Block A)
2. Build `<tourism-details>` (Block B)
3. Build `<tourism-related>` (Block C)
4. Build `<tourism-tour-list>` (Category pages)

### **Phase 3: Styling**
1. Convert existing CSS to component styles
2. Optimize for Shadow DOM
3. Add responsive breakpoints

### **Phase 4: Bundle & Deploy**
1. Bundle all components into `tourism-components.js`
2. Minify & optimize
3. Deploy to Cloudflare Workers
4. Test on real GHL pages

### **Phase 5: Migration**
1. Create migration guide
2. Update FunTrip Tours
3. Document troubleshooting

---

## 🎯 **Next Steps**

Ready to build? Let's start with:
1. ✅ Base `TourismComponent` class
2. ✅ `<tourism-hero>` component (Block A)
3. ✅ Test on a real page

**Say "Let's build it" and I'll start coding!** 🚀

