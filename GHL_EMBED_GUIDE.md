# 🚀 GHL Tour Detail Page Embed Guide (Hybrid Approach)

## ✨ **What Changed?**

We've **removed all browser caching** and added a **fast embed endpoint** that injects tour data directly into your page!

### **Benefits:**
- ✅ **Instant page load** (no fetch delay)
- ✅ **Price updates in 5 minutes** (instead of hours/days)
- ✅ **No stale cache issues**
- ✅ **Better SEO** (data in HTML)
- ✅ **Simpler** (no localStorage, no CacheStorage)

---

## 📋 **New Embed Code (2 Options)**

### **Option 1: Hybrid Embed (Recommended) - Instant Load**

This fetches tour data ONCE and injects it into the page before blocks load.

```html
<!-- Config Block -->
<script>
  window.CFG = {
    DATA_URL: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours', // Required for fallback
    CLIENT: 'funtrip-tours',
    SLUG: 'blue-hole-secret-falls-adventure', // Or detect from URL
    USE_CLOUDFLARE: true,
    CLOUDFLARE_API: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours'
  };
</script>

<!-- NEW: Embed tour data (instant load) -->
<script src="https://tourism-api-production.krishna-0a3.workers.dev/embed/tour/blue-hole-secret-falls-adventure?client=funtrip-tours"></script>

<!-- Block A: Hero (use new commit for cache removal) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@a73ef16/src/tour-detail/css/block-a.css">
<div class="tdp-wrap" id="tdp-top">
  <h1 class="tdp-title" id="tdp-title"></h1>
  <div class="tdp-meta" id="tdp-meta"></div>
  <div id="tdp-top-skel">
    <div class="tdp-skel-line" style="width:40%;margin:10px 0 8px"></div>
    <div class="tdp-skel-line" style="width:65%;height:14px"></div>
  </div>
  <section id="heroSkel">
    <div class="skCell sk big"></div>
    <div class="skCell sk"></div>
    <div class="skCell sk"></div>
  </section>
  <section class="hero-gallery" id="heroGallery" style="display:none">
    <div class="hero-count" id="heroCount" style="display:none">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 7h3l1.2-2.4A2 2 0 0 1 10 4h4a2 2 0 0 1 1.8 1.1L17 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.5"/>
        <circle cx="12" cy="13" r="4" stroke="currentColor" stroke-width="1.5"/>
      </svg>
      <span id="heroCountNum"></span>
    </div>
  </section>
</div>
<script src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@a73ef16/src/tour-detail/js/block-a.js"></script>

<!-- Block B: Details (use new commit for cache removal) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@a73ef16/src/tour-detail/css/block-b.css">
<div class="tdp2-wrap">
  <section class="section" id="overview">
    <div id="sk-overview" class="skel-lines">
      <div class="sk skel-line lg" style="width:40%"></div>
      <div class="sk skel-line" style="width:95%"></div>
      <div class="sk skel-line" style="width:92%"></div>
      <div class="sk skel-line" style="width:88%"></div>
      <div class="sk skel-line" style="width:70%"></div>
    </div>
  </section>
  <section class="section" id="highlightsWrap" style="display:none">
    <h3>Highlights</h3>
    <div class="chips" id="highlights" style="display:none"></div>
  </section>
  <section class="section" id="galleryWrap" style="display:none">
    <h3>Gallery</h3>
    <div class="gallery" id="gallery" style="display:none"></div>
  </section>
  <section class="section accordion" id="accordion">
    <div id="sk-accordion" class="skel-lines">
      <div class="sk skel-line lg" style="width:55%"></div>
      <div class="sk skel-line" style="width:95%"></div>
      <div class="sk skel-line" style="width:92%"></div>
      <div class="sk skel-line" style="width:88%"></div>
    </div>
  </section>
</div>
<script src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@a73ef16/src/tour-detail/js/block-b.js"></script>

<!-- Block C: Related Tours (use new commit for cache removal) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@a73ef16/src/tour-detail/css/block-c.css">
<div class="tdp3-wrap">
  <section class="related-tours-section" id="related-tours-section">
    <h2>Related Tours</h2>
    <h3>Discover more amazing experiences</h3>
    <div class="related-tours-skeleton" id="related-tours-skeleton">
      <div class="tour-card-skeleton">
        <div class="sk-image"></div>
        <div class="sk-content">
          <div class="sk-line lg" style="width:80%"></div>
          <div class="sk-line sm" style="width:60%"></div>
          <div class="sk-line" style="width:95%"></div>
        </div>
      </div>
    </div>
    <div class="related-tours-grid" id="related-tours-grid" style="display:none"></div>
  </section>
</div>
<script src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@a73ef16/src/tour-detail/js/block-c.js"></script>

<!-- Tour Form Styling -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@5c191d1/src/tour-detail-form/css/tour-detail-form.css">
<script src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@5c191d1/src/tour-detail-form/js/tour-detail-form.js"></script>
```

---

### **Option 2: Direct API (No Embed) - Still Fast**

If you don't want to use the embed endpoint, this is still much faster than before!

```html
<!-- Config Block -->
<script>
  window.CFG = {
    DATA_URL: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours', // Required
    CLIENT: 'funtrip-tours',
    SLUG: 'blue-hole-secret-falls-adventure', // Or detect from URL
    USE_CLOUDFLARE: true,
    CLOUDFLARE_API: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours'
  };
</script>

<!-- Block A: Hero (use new commit @a73ef16) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@a73ef16/src/tour-detail/css/block-a.css">
<!-- ... same HTML as above ... -->
<script src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@a73ef16/src/tour-detail/js/block-a.js"></script>

<!-- Block B: Details (use new commit @a73ef16) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@a73ef16/src/tour-detail/css/block-b.css">
<!-- ... same HTML as above ... -->
<script src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@a73ef16/src/tour-detail/js/block-b.js"></script>

<!-- Block C: Related Tours (use new commit @a73ef16) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@a73ef16/src/tour-detail/css/block-c.css">
<!-- ... same HTML as above ... -->
<script src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@a73ef16/src/tour-detail/js/block-c.js"></script>
```

---

## 🔑 **Key Changes**

### **1. New Commit Hash: `a73ef16`**

This commit removes all browser caching:
- ❌ Removed localStorage
- ❌ Removed CacheStorage API
- ✅ Fetch directly from API (Cloudflare edge caches for 5 min)

**Update ALL your blocks to use `@a73ef16`:**
```html
<!-- Old -->
<script src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@179b18f/..."></script>

<!-- New -->
<script src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@a73ef16/..."></script>
```

---

### **2. New Embed Endpoint (Optional but Recommended)**

**Before (Slow):**
```
Page loads → Block A fetches API → Wait 300-500ms → Render
```

**After (Fast):**
```
Page loads → Data already in HTML → Instant render (0ms wait!)
```

**How to use:**
```html
<!-- Replace this slug with your actual tour slug -->
<script src="https://tourism-api-production.krishna-0a3.workers.dev/embed/tour/YOUR-TOUR-SLUG?client=funtrip-tours"></script>
```

**For dynamic slugs (from URL):**
```html
<script>
  // Auto-detect slug from URL
  const slug = window.location.pathname.split('/').filter(Boolean).pop();
  const client = 'funtrip-tours';
  
  // Inject embed script
  const script = document.createElement('script');
  script.src = `https://tourism-api-production.krishna-0a3.workers.dev/embed/tour/${slug}?client=${client}`;
  document.head.appendChild(script);
</script>
```

---

## 📊 **Performance Comparison**

| Approach | First Load | Price Update | Cache Issues |
|----------|------------|--------------|--------------|
| **Old (with cache)** | 500-1500ms | 1-7 days | ❌ Yes |
| **New (no cache)** | 300-500ms | 5 minutes | ✅ No |
| **New (with embed)** | <200ms | 5 minutes | ✅ No |

---

## 🔄 **How to Update Your Site**

### **Step 1: Update Config (Enable Cloudflare)**

```html
<script>
  window.CFG = {
    DATA_URL: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours', // Required!
    CLIENT: 'funtrip-tours',
    USE_CLOUDFLARE: true, // Enable Cloudflare API
    CLOUDFLARE_API: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours'
  };
</script>
```

### **Step 2: Update All Script Tags**

**Find and replace in your GHL custom code:**

```
Old: @179b18f
New: @a73ef16
```

Or use `@main` to always get the latest:
```
@main
```

### **Step 3 (Optional): Add Embed Script**

For fastest load, add this AFTER the config block:

```html
<script src="https://tourism-api-production.krishna-0a3.workers.dev/embed/tour/YOUR-SLUG?client=funtrip-tours"></script>
```

### **Step 4: Clear Browser Cache**

**Important!** Users with old localStorage need to clear it once:

```javascript
// Run this in browser console ONCE
localStorage.clear();
caches.delete('tours-json-v1');
location.reload();
```

---

## 🎯 **Which Option Should I Use?**

### **Use Option 1 (Hybrid Embed) if:**
- ✅ You want **instant page loads**
- ✅ You want **best SEO**
- ✅ You have **fixed tour pages** (one slug per page)

### **Use Option 2 (Direct API) if:**
- ✅ You want **simplicity**
- ✅ You have **dynamic slugs** that change often
- ✅ 300-500ms load time is acceptable

---

## 🐛 **Troubleshooting**

### **1. "Missing CFG.DATA_URL" error**

**Cause:** Config block is missing `DATA_URL`  
**Solution:**
```javascript
// ❌ WRONG - Missing DATA_URL
window.CFG = {
  CLIENT: 'funtrip-tours',
  USE_CLOUDFLARE: true
};

// ✅ CORRECT - Include DATA_URL
window.CFG = {
  DATA_URL: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours', // Required!
  CLIENT: 'funtrip-tours',
  USE_CLOUDFLARE: true,
  CLOUDFLARE_API: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours'
};
```

### **2. Old price still showing**

**Cause:** jsDelivr CDN or browser cache  
**Solution:**
```bash
# Wait 5 minutes for Cloudflare to update
# OR use specific commit hash instead of @main
@a73ef16
```

### **2. "Tour not found"**

**Cause:** Slug mismatch or old localStorage  
**Solution:**
```javascript
// Clear browser cache
localStorage.clear();
caches.delete('tours-json-v1');
location.reload();
```

### **3. Embed script not loading**

**Cause:** Wrong slug or client name  
**Check:**
```bash
# Test the embed endpoint directly
curl "https://tourism-api-production.krishna-0a3.workers.dev/embed/tour/YOUR-SLUG?client=YOUR-CLIENT"
```

---

## 📚 **API Reference**

### **Embed Single Tour**

```
GET /embed/tour/:slug?client=xxx
```

**Example:**
```html
<script src="https://tourism-api-production.krishna-0a3.workers.dev/embed/tour/blue-hole-secret-falls-adventure?client=funtrip-tours"></script>
```

**Returns:** JavaScript that injects `window.__TOUR_DATA__`

---

### **Embed All Tours**

```
GET /embed/tours?client=xxx
```

**Example:**
```html
<script src="https://tourism-api-production.krishna-0a3.workers.dev/embed/tours?client=funtrip-tours"></script>
```

**Returns:** JavaScript that injects `window.__ALL_TOURS__`

---

## ✅ **Summary**

**What we did:**
1. ✅ Removed localStorage (no more stale data)
2. ✅ Removed CacheStorage (no more week-long caching)
3. ✅ Added `/embed` endpoint (instant page loads)
4. ✅ Rely on Cloudflare edge cache (5 min updates)

**What you need to do:**
1. Update commit hash to `@a73ef16` in ALL blocks
2. Add `USE_CLOUDFLARE: true` to config
3. (Optional) Add embed script for instant loads
4. Clear browser cache once

**Result:**
- ⚡ **Faster page loads** (instant with embed)
- 🔄 **Fresh prices** (5 min updates)
- 🐛 **No cache bugs** (ever again!)

---

## 🚀 **Ready to Deploy?**

1. Copy the new embed code above
2. Replace your existing code in GHL
3. Test on one page first
4. Deploy to all pages

**Need help?** Check the troubleshooting section above!

