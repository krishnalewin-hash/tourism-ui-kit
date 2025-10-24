# 🎉 Web Components - Complete Tour Detail Page (NO CONFIG!)

## ✅ **ALL COMPONENTS BUILT & DEPLOYED!**

You now have a **complete config-free tour detail page** with just **5 lines of code!**

---

## 🚀 **Complete Embed Code**

### **Replace ALL your current blocks with this:**

```html
<!-- Load Web Components library once -->
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/components.js"></script>

<!-- Block A: Hero Section -->
<tourism-hero client="funtrip-tours"></tourism-hero>

<!-- Block B: Details Section -->
<tourism-details client="funtrip-tours"></tourism-details>

<!-- YOUR GHL FORM GOES HERE -->
<!-- (Keep your existing GHL form embed code) -->

<!-- Block C: Related Tours -->
<tourism-related client="funtrip-tours" limit="3"></tourism-related>
```

**That's it!** No more:
- ❌ Config blocks (`window.CFG = {...}`)
- ❌ Multiple CSS files
- ❌ Multiple JS files
- ❌ Commit hashes
- ❌ 100+ lines of HTML

---

## 📦 **What Each Component Does**

### **`<tourism-hero client="funtrip-tours">`**
**Renders:**
- Tour title
- Meta info (duration, location, type)
- Image gallery (3-photo grid)
- Photo count badge

**Features:**
- Auto-detects slug from URL
- Fetches tour data once
- Broadcasts data to other components
- Loading skeleton animation

---

### **`<tourism-details client="funtrip-tours">`**
**Renders:**
- Overview/description
- Highlights chips
- Gallery grid (6 photos)
- Accordion sections:
  - 📋 Itinerary
  - ✅ Inclusions
  - ❌ Exclusions
  - ❓ FAQs

**Features:**
- Listens for data from Hero (no duplicate fetch!)
- Fallback: fetches directly if needed
- Parses JSON arrays correctly
- Responsive grid layouts

---

### **`<tourism-related client="funtrip-tours" limit="3">`**
**Renders:**
- "Related Tours" section heading
- Tour cards (image, title, excerpt, price)
- Links to other tour pages

**Features:**
- Filters out current tour
- Shows tours from same category
- Configurable limit (default: 3)
- Responsive card grid
- Hover animations

---

## 🔄 **How They Work Together**

```
1. User visits: /tours/blue-hole-secret-falls-adventure

2. <tourism-hero>:
   ├─ Detects slug: "blue-hole-secret-falls-adventure"
   ├─ Fetches tour data from API
   ├─ Renders hero section
   └─ Broadcasts: CustomEvent('tour-data-loaded', {...})

3. <tourism-details>:
   ├─ Listens for 'tour-data-loaded' event
   ├─ Receives tour data (NO API CALL!)
   └─ Renders details section

4. <tourism-related>:
   ├─ Listens for 'tour-data-loaded' event
   ├─ Knows current tour type
   ├─ Fetches all tours (separate call)
   ├─ Filters by same type
   └─ Renders related tour cards

Result: Only 2 API calls total!
```

---

## 📊 **Before vs After**

### **Before (Old Method):**
```html
<!-- Config Block (~20 lines) -->
<script>
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const detectedSlug = pathParts[pathParts.length - 1] || '';
  window.CFG = {
    DATA_URL: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
    CLIENT: 'funtrip-tours',
    SLUG: detectedSlug,
    USE_CLOUDFLARE: true,
    CLOUDFLARE_API: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours'
  };
</script>

<!-- Block A (~40 lines) -->
<link rel="stylesheet" href="...@hash/block-a.css">
<div class="tdp-wrap" id="tdp-top">
  <h1 class="tdp-title" id="tdp-title"></h1>
  <!-- ... 30 more lines -->
</div>
<script src="...@hash/block-a.js"></script>

<!-- Block B (~50 lines) -->
<link rel="stylesheet" href="...@hash/block-b.css">
<div class="tdp2-wrap">
  <!-- ... 40 more lines -->
</div>
<script src="...@hash/block-b.js"></script>

<!-- Block C (~40 lines) -->
<link rel="stylesheet" href="...@hash/block-c.css">
<div class="tdp3-wrap">
  <!-- ... 30 more lines -->
</div>
<script src="...@hash/block-c.js"></script>

TOTAL: ~150+ lines, 7 files, manual hash updates
```

### **After (Web Components):**
```html
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/components.js"></script>
<tourism-hero client="funtrip-tours"></tourism-hero>
<tourism-details client="funtrip-tours"></tourism-details>
<!-- GHL form here -->
<tourism-related client="funtrip-tours"></tourism-related>

TOTAL: 5 lines, 1 file, instant updates!
```

**97% less code!** 🎉

---

## 🎯 **Component Attributes**

### **All Components:**
| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `client` | ✅ Yes | - | Client name (e.g., `funtrip-tours`) |
| `slug` | No | auto-detect | Tour slug (auto-detects from URL if omitted) |
| `api-url` | No | production | Override API endpoint |

### **`<tourism-related>` Only:**
| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `limit` | No | `3` | Maximum number of related tours to show |

---

## 📝 **Complete Examples**

### **Example 1: Full Tour Detail Page**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Blue Hole Secret Falls Adventure</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body>

  <!-- Load Web Components -->
  <script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/components.js"></script>

  <!-- Hero Section -->
  <tourism-hero client="funtrip-tours"></tourism-hero>

  <!-- Details Section -->
  <tourism-details client="funtrip-tours"></tourism-details>

  <!-- Your GHL Form -->
  <div id="ghl-form">
    <!-- Existing GHL form code -->
  </div>

  <!-- Related Tours -->
  <tourism-related client="funtrip-tours" limit="3"></tourism-related>

</body>
</html>
```

### **Example 2: Minimal Page (No Related Tours)**
```html
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/components.js"></script>
<tourism-hero client="funtrip-tours"></tourism-hero>
<tourism-details client="funtrip-tours"></tourism-details>
```

### **Example 3: Explicit Slug (Override Auto-Detection)**
```html
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/components.js"></script>
<tourism-hero client="funtrip-tours" slug="bamboo-rafting-with-limestone-foot-massage"></tourism-hero>
<tourism-details client="funtrip-tours" slug="bamboo-rafting-with-limestone-foot-massage"></tourism-details>
<tourism-related client="funtrip-tours" slug="bamboo-rafting-with-limestone-foot-massage" limit="4"></tourism-related>
```

### **Example 4: Multiple Clients on Same Page**
```html
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/components.js"></script>

<!-- FunTrip Tours -->
<tourism-hero client="funtrip-tours" slug="tour-one"></tourism-hero>

<!-- Kamar Tours -->
<tourism-hero client="kamar-tours" slug="tour-two"></tourism-hero>
```

---

## ✅ **What You Still Need**

### **GHL Form Styling (For Now)**
```html
<!-- Still need this between Block B and C -->
<script>
  window.CFG = {
    CLIENT: 'funtrip-tours',
    formType: 'tour'
  };
</script>
<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/tour-detail-form.css">
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/tour-detail-form.js"></script>
```

**Why?** The GHL form styling still uses the old approach. We can convert it to a Web Component later if needed!

---

## 🔍 **Debugging**

### **Check if components loaded:**
```javascript
console.log(customElements.get('tourism-hero'));      // Should output: class
console.log(customElements.get('tourism-details'));   // Should output: class
console.log(customElements.get('tourism-related'));   // Should output: class
```

### **Check component state:**
```javascript
const hero = document.querySelector('tourism-hero');
console.log('Client:', hero.client);
console.log('Slug:', hero.slug);
console.log('Data:', hero._data);
```

### **Console logs to watch for:**
```
✅ Tourism UI Kit Web Components loaded successfully!
📦 Available components: <tourism-hero>, <tourism-details>, <tourism-related>
[TOURISM-HERO] Fetching tour: https://...
[TOURISM-HERO] Fetched tour: Blue Hole Secret Falls Adventure
[TOURISM-HERO] Broadcasted event: tour-data-loaded {...}
[TOURISM-DETAILS] Received tour data from Hero
[TOURISM-RELATED] Received current tour data
```

---

## 🎨 **Styling**

### **Fonts:**
Include Poppins in your page:
```html
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
```

### **No Style Conflicts:**
- Shadow DOM isolates component styles
- Your GHL styles won't affect components
- Component styles won't affect your site

### **Responsive:**
- All components are mobile-friendly
- Breakpoints: 820px (Hero), 720px (Details), 768px (Related)

---

## 🚀 **Deployment**

**Production URL:**
```
https://tourism-api-production.krishna-0a3.workers.dev/static/js/components.js
```

**Updates:**
- We control the file
- Changes deploy instantly
- No cache issues
- No hash updates needed!

---

## 📱 **Browser Support**

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 67+ | ✅ Full support |
| Firefox | 63+ | ✅ Full support |
| Safari | 10.1+ | ✅ Full support |
| Edge | 79+ | ✅ Full support |

**Coverage:** ~95% of users

---

## 💡 **Tips**

1. **Load script once**
   - One `<script>` tag per page
   - Works for all components

2. **Auto-detect is smart**
   - Handles `/tours/slug`, `/slug`, `?slug=slug`
   - Case-insensitive
   - Trims whitespace

3. **Components communicate**
   - Hero fetches once
   - Details and Related listen for data
   - Only 2 API calls total

4. **Instant updates**
   - Edit components
   - Run `./deploy.sh`
   - All sites update immediately!

---

## 🎉 **Summary**

**What you built today:**
- ✅ `<tourism-hero>` - Hero section with gallery
- ✅ `<tourism-details>` - Overview, highlights, accordion
- ✅ `<tourism-related>` - Filtered related tour cards

**Benefits:**
- 🚀 97% less code (150+ lines → 5 lines)
- ⚡ Instant updates (no hash changes)
- 🎨 Zero style conflicts (Shadow DOM)
- 📦 Single file (components.js)
- 🔄 Smart data sharing (1 fetch for 2 components)
- 🎯 Simple API (just attributes)

---

## 📋 **Migration Checklist**

- [ ] Copy the complete embed code above
- [ ] Replace all existing Block A, B, C code
- [ ] Keep your GHL form code between blocks
- [ ] Add Poppins font if not already included
- [ ] Test on a tour detail page
- [ ] Hard refresh (Cmd+Shift+R)
- [ ] Check console for success messages
- [ ] Verify all sections render correctly

---

**You're done! Complete config-free tour pages!** 🎉

**Next step:** Update your GHL pages with the new embed code!

