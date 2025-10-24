# 🧩 Web Components - Migration Plan

## 🎯 **Vision: Simple, Powerful Embeds**

Transform complex embed codes into simple HTML tags:

### **Before (Current):**
```html
<!-- 100+ lines of HTML + config + scripts -->
<script>
  window.CFG = { DATA_URL: '...', CLIENT: 'funtrip-tours', SLUG: 'tour-slug', ... };
</script>
<link rel="stylesheet" href="https://...block-a.css">
<div class="tdp-wrap" id="tdp-top">
  <!-- 50 lines of HTML structure -->
</div>
<script src="https://...block-a.js"></script>
<!-- Repeat for Block B, Block C, Form -->
```

### **After (Web Components):**
```html
<!-- Single line! -->
<script src="https://tourism-api-production.krishna-0a3.workers.dev/components.js"></script>
<tourism-tour-detail slug="blue-hole-secret-falls" client="funtrip-tours"></tourism-tour-detail>
```

---

## 🎨 **Proposed Components**

### **1. Tour Detail Page Component**
```html
<tourism-tour-detail 
  slug="blue-hole-secret-falls" 
  client="funtrip-tours"
  api-url="https://tourism-api-production.krishna-0a3.workers.dev">
</tourism-tour-detail>
```

**Renders:**
- Hero section (Block A)
- Details section (Block B)
- Related tours (Block C)
- Booking form

**Features:**
- ✅ Self-contained (includes all CSS/HTML)
- ✅ Auto-fetches data from API
- ✅ Shadow DOM (no style conflicts)
- ✅ Automatic slug detection from URL
- ✅ Responsive & accessible

---

### **2. Tour Category Component**
```html
<tourism-tour-list 
  client="funtrip-tours"
  filter-type="Adventure"
  api-url="https://tourism-api-production.krishna-0a3.workers.dev">
</tourism-tour-list>
```

**Renders:**
- Filtered tour cards
- Loading skeleton
- SEO-friendly markup

**Features:**
- ✅ Filter by type, tag, or keyword
- ✅ Automatic card grid layout
- ✅ Lazy loading images
- ✅ Click-to-navigate

---

### **3. Tour Booking Form Component**
```html
<tourism-booking-form 
  client="funtrip-tours"
  form-type="tour"
  tour-name="Blue Hole Secret Falls"
  api-url="https://tourism-api-production.krishna-0a3.workers.dev">
</tourism-booking-form>
```

**Renders:**
- Google Places autocomplete
- Date/time pickers
- Passenger selector
- Form validation

**Features:**
- ✅ Auto-fills drop-off for tours
- ✅ Google Maps integration
- ✅ Real-time validation
- ✅ Custom styling support

---

### **4. Related Tours Component**
```html
<tourism-related-tours 
  current-slug="blue-hole-secret-falls"
  client="funtrip-tours"
  limit="3"
  api-url="https://tourism-api-production.krishna-0a3.workers.dev">
</tourism-related-tours>
```

**Renders:**
- Related tour cards
- "Discover more" section

---

## 🏗️ **Architecture**

### **File Structure:**
```
cloudflare-api/
  static/
    components/
      tourism-components.js       # Main Web Components bundle
      styles/
        tour-detail.css           # Component-specific styles
        tour-list.css
        booking-form.css
```

### **Component Classes:**
```javascript
// Base component with shared utilities
class TourismComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  get apiUrl() {
    return this.getAttribute('api-url') || 
           'https://tourism-api-production.krishna-0a3.workers.dev';
  }
  
  get client() {
    return this.getAttribute('client') || 'funtrip-tours';
  }
  
  async fetchTours(params) {
    const url = new URL(`${this.apiUrl}/api/tours`);
    url.searchParams.set('client', this.client);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    
    const res = await fetch(url);
    return res.json();
  }
}

// Tour Detail Component
class TourismTourDetail extends TourismComponent {
  connectedCallback() {
    this.render();
    this.loadTour();
  }
  
  async loadTour() {
    const slug = this.getAttribute('slug') || this.detectSlug();
    const data = await this.fetchTours({ slug });
    this.updateWithData(data);
  }
  
  detectSlug() {
    // Auto-detect from URL
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1];
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="${this.apiUrl}/static/components/styles/tour-detail.css">
      <div class="tour-detail-wrapper">
        <!-- Hero Section -->
        <div class="hero-section" id="hero"></div>
        
        <!-- Details Section -->
        <div class="details-section" id="details"></div>
        
        <!-- Related Tours -->
        <div class="related-section" id="related"></div>
      </div>
    `;
  }
}

// Register components
customElements.define('tourism-tour-detail', TourismTourDetail);
customElements.define('tourism-tour-list', TourismTourList);
customElements.define('tourism-booking-form', TourismBookingForm);
customElements.define('tourism-related-tours', TourismRelatedTours);
```

---

## ✅ **Benefits**

### **1. Dramatically Simpler Embeds**
**Before:** 100+ lines of HTML/config  
**After:** 2 lines

### **2. No Style Conflicts**
Shadow DOM encapsulation prevents CSS leaks

### **3. Automatic Updates**
Change components.js → all sites update instantly

### **4. Better DX**
- Auto-complete in IDE
- Clear API (attributes)
- Easy to understand

### **5. Better UX**
- Faster initial load (single script)
- Progressive enhancement
- Fallback support

---

## 🚀 **Implementation Plan**

### **Phase 1: Core Infrastructure**
1. ✅ Create base `TourismComponent` class
2. ✅ Set up Shadow DOM with style injection
3. ✅ Implement shared utilities (fetch, cache, render)
4. ✅ Add error handling & loading states

### **Phase 2: Tour Detail Component**
1. ✅ Convert Block A logic → component method
2. ✅ Convert Block B logic → component method
3. ✅ Convert Block C logic → component method
4. ✅ Bundle CSS into Shadow DOM
5. ✅ Test with real data

### **Phase 3: Tour List Component**
1. ✅ Convert cards.js → component
2. ✅ Add filtering logic
3. ✅ Add skeleton loader
4. ✅ Test all filter modes

### **Phase 4: Booking Form Component**
1. ✅ Convert tour-detail-form.js → component
2. ✅ Add Google Maps integration
3. ✅ Add date/time pickers
4. ✅ Add validation

### **Phase 5: Deployment & Testing**
1. ✅ Bundle all components
2. ✅ Deploy to Cloudflare Workers
3. ✅ Test on real GHL pages
4. ✅ Create migration guide

---

## 📝 **Migration Guide (for later)**

### **Tour Detail Page:**
**Old:**
```html
<!-- 100+ lines of config + blocks -->
```

**New:**
```html
<script src="https://tourism-api-production.krishna-0a3.workers.dev/components.js"></script>
<tourism-tour-detail client="funtrip-tours"></tourism-tour-detail>
```

### **Category Page:**
**Old:**
```html
<!-- 50+ lines of config + skeleton + scripts -->
```

**New:**
```html
<script src="https://tourism-api-production.krishna-0a3.workers.dev/components.js"></script>
<tourism-tour-list client="funtrip-tours" filter-type="Adventure"></tourism-tour-list>
```

---

## 🎯 **Attributes API**

### **`<tourism-tour-detail>`**
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `client` | string | required | Client name (e.g., `funtrip-tours`) |
| `slug` | string | auto-detect | Tour slug (auto-detects from URL if omitted) |
| `api-url` | string | production URL | Override API endpoint |
| `show-form` | boolean | `true` | Show/hide booking form |
| `show-related` | boolean | `true` | Show/hide related tours |

### **`<tourism-tour-list>`**
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `client` | string | required | Client name |
| `filter-type` | string | none | Filter by tour type |
| `filter-tag` | string | none | Filter by tag |
| `filter-keyword` | string | none | Filter by keyword search |
| `api-url` | string | production URL | Override API endpoint |
| `columns` | number | auto | Number of columns (responsive) |
| `limit` | number | unlimited | Max tours to show |

### **`<tourism-booking-form>`**
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `client` | string | required | Client name |
| `form-type` | string | `tour` | Form type (`tour` or `transfer`) |
| `tour-name` | string | auto-detect | Tour name for drop-off auto-fill |
| `api-url` | string | production URL | Override API endpoint |
| `google-maps-key` | string | auto-fetch | Google Maps API key |

---

## 🔧 **Technical Considerations**

### **1. Shadow DOM vs Light DOM**
**Decision:** Use Shadow DOM for style encapsulation
- ✅ No CSS conflicts with GHL
- ✅ Clean component boundaries
- ⚠️ Slightly more complex for global styles

### **2. Polyfills**
**Support:** Modern browsers (2018+)
- Chrome 67+
- Firefox 63+
- Safari 10.1+
- Edge 79+

**Fallback:** Provide legacy bundle for older browsers

### **3. Bundle Size**
**Target:** < 50KB gzipped
- Minify + tree-shake
- Lazy load heavy features (Google Maps)
- Code split by component

### **4. State Management**
**Approach:** Component-level state
- Each component manages its own data
- Shared state via attributes/events
- No external dependencies (React, Vue, etc.)

### **5. SEO**
**Strategy:** Server-side rendering for SEO-critical content
- Cloudflare Worker can pre-render HTML
- Client-side hydration for interactivity
- Fallback to static content if JS disabled

---

## 📊 **Comparison: Current vs Web Components**

| Feature | Current | Web Components |
|---------|---------|----------------|
| **Embed Code** | 100+ lines | 2 lines |
| **Complexity** | High | Low |
| **Style Conflicts** | Possible | Impossible |
| **Updates** | Manual hash change | Automatic |
| **Browser Support** | All | Modern (95%+) |
| **Bundle Size** | 3 separate files | 1 file |
| **Learning Curve** | Medium | Low |
| **Maintainability** | Medium | High |

---

## 🎉 **Next Steps**

1. **Build Phase 1:** Base component infrastructure
2. **Build Phase 2:** Tour detail component
3. **Test:** Deploy to staging, test on real page
4. **Iterate:** Refine based on testing
5. **Build Phase 3-4:** Other components
6. **Migrate:** Update FunTrip Tours to use components
7. **Document:** Create user-facing guide

---

**Ready to start building?** Let's begin with Phase 1! 🚀

