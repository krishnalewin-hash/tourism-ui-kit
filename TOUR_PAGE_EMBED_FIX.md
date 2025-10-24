# 🔧 Tour Page Embed Fix - Drop-Off Field Issue

## ❌ **The Problem**

Drop-off location field is showing on tour pages instead of being hidden and auto-filled.

## ✅ **The Solution**

Add `formType: 'tour'` to your `window.CFG`!

---

## 📝 **Corrected Config Block**

```html
<script>
  // Auto-detect slug from URL pathname
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const detectedSlug = pathParts[pathParts.length - 1] || '';
  
  window.CFG = {
    DATA_URL: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
    CLIENT: 'funtrip-tours',
    SLUG: detectedSlug,
    formType: 'tour',  // ← ADD THIS! Tells form this is a tour page
    USE_CLOUDFLARE: true,
    CLOUDFLARE_API: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours'
  };
  
  // Load embed script dynamically (this includes Google Maps API key automatically!)
  if (detectedSlug) {
    const embedScript = document.createElement('script');
    embedScript.src = `https://tourism-api-production.krishna-0a3.workers.dev/embed/tour/${detectedSlug}?client=funtrip-tours`;
    document.head.appendChild(embedScript);
  }
</script>

<!-- Tour Form Styling -->
<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/tour-detail-form.css">
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/tour-detail-form.js"></script>
```

---

## 🔍 **What This Does**

When `formType: 'tour'` is set:

1. ✅ **Hides drop-off field** (via CSS from tour-detail-form.css)
2. ✅ **Auto-fills drop-off** with page title
3. ✅ **Logs to console:** `[TourForm] Auto-filled drop-off field with title: [Tour Name]`

**Without it:**
- ❌ Drop-off field stays visible
- ❌ Not auto-filled
- ❌ User has to type it manually

---

## 📋 **Complete Working Embed (Copy This)**

```html
<!-- Config + Embed -->
<script>
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const detectedSlug = pathParts[pathParts.length - 1] || '';
  
  window.CFG = {
    DATA_URL: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
    CLIENT: 'funtrip-tours',
    SLUG: detectedSlug,
    formType: 'tour',  // ✅ IMPORTANT!
    USE_CLOUDFLARE: true,
    CLOUDFLARE_API: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours'
  };
  
  if (detectedSlug) {
    const embedScript = document.createElement('script');
    embedScript.src = `https://tourism-api-production.krishna-0a3.workers.dev/embed/tour/${detectedSlug}?client=funtrip-tours`;
    document.head.appendChild(embedScript);
  }
</script>

<!-- Tour Form Styling -->
<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/tour-detail-form.css">
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/tour-detail-form.js"></script>

<!-- Block A: Hero -->
<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/block-a.css">
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
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/block-a.js"></script>

<!-- Block B: Details -->
<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/block-b.css">
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
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/block-b.js"></script>

<!-- Block C: Related Tours -->
<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/block-c.css">
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
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/css/block-c.css"></script>
```

---

## ✅ **After Adding `formType: 'tour'`**

**Check console, you should see:**
```
[TourForm] Auto-filled drop-off field with title: Blue Hole Secret Falls Adventure
```

**And the drop-off field should:**
- ✅ Be hidden from view
- ✅ Have the tour name as its value
- ✅ Submit with the form

---

## 🎯 **Quick Reference**

### **For Tour Pages:**
```javascript
window.CFG = {
  formType: 'tour',  // ← Hides & auto-fills drop-off
  CLIENT: 'funtrip-tours',
  // ... other config
};
```

### **For Transfer/Airport Pages:**
```javascript
window.CFG = {
  formType: 'transfer',  // ← Shows both pickup & drop-off
  CLIENT: 'funtrip-tours',
  // ... other config
};
```

### **For Other Forms:**
```javascript
window.CFG = {
  // Don't set formType - defaults to standard form
  CLIENT: 'funtrip-tours',
  // ... other config
};
```

---

## 🔍 **How It Works**

The form JavaScript checks:

```javascript
const isTourForm = window.CFG?.formType === 'tour';

if (isTourForm) {
  // 1. CSS hides the drop-off field
  // 2. Gets page title from <h1> or <title>
  // 3. Auto-fills hidden field with tour name
  // 4. Logs confirmation
}
```

---

## 📝 **Summary**

**Problem:** Drop-off field showing on tour pages  
**Cause:** Missing `formType: 'tour'` in config  
**Fix:** Add one line to window.CFG  
**Result:** Field hidden & auto-filled! ✅

---

**Update your GHL page now and it should work perfectly!** 🎉

