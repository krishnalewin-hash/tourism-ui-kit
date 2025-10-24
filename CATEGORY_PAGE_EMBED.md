# 🎯 Category Page Embed - Self-Hosted Setup

## ✅ **For FunTrip Tours - Adventure Category**

Replace your current embed code with this updated version:

---

## 📝 **Complete Embed Code**

```html
<!-- FONT + STYLES + MARKUP + RENDERER -->
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">

<script>
window.CFG = {
  DATA_URL: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
  CLIENT: 'funtrip-tours',
  USE_CLOUDFLARE: true,
  CLOUDFLARE_API: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
  FILTER: { mode: 'type', value: 'Adventure' },
  LIST_SELECTOR: '#tour-list'
};
</script>

<!-- Tour Cards CSS (Self-hosted) -->
<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/cards.css">

<!-- Skeleton + Tour List Container -->
<div id="skeleton" class="skeleton-list" aria-hidden="true"></div>
<div id="tour-list" class="tour-list" hidden aria-live="polite"></div>

<!-- Tour Cards JS (Self-hosted) -->
<script defer src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/cards.js"></script>
```

---

## 🎨 **Filter Options**

### **By Tour Type:**
```javascript
FILTER: { mode: 'type', value: 'Adventure' }
```

**Available types:**
- `Adventure`
- `Cultural`
- `Nature`
- `Water`
- `Relaxation`
- etc. (whatever types you've set in your database)

### **By Tag:**
```javascript
FILTER: { mode: 'tag', value: 'Family Friendly' }
```

### **By Keyword:**
```javascript
FILTER: { mode: 'keyword', value: 'waterfall' }
```
*Searches tour name, excerpt, and tags*

### **Show All Tours:**
```javascript
FILTER: { mode: 'all', value: '' }
```

---

## 🌐 **Other Category Page Examples**

### **Cultural Tours Page:**
```html
<script>
window.CFG = {
  DATA_URL: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
  CLIENT: 'funtrip-tours',
  USE_CLOUDFLARE: true,
  CLOUDFLARE_API: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
  FILTER: { mode: 'type', value: 'Cultural' },
  LIST_SELECTOR: '#tour-list'
};
</script>

<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/cards.css">
<div id="skeleton" class="skeleton-list" aria-hidden="true"></div>
<div id="tour-list" class="tour-list" hidden aria-live="polite"></div>
<script defer src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/cards.js"></script>
```

### **Water Activities Page:**
```html
<script>
window.CFG = {
  DATA_URL: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
  CLIENT: 'funtrip-tours',
  USE_CLOUDFLARE: true,
  CLOUDFLARE_API: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
  FILTER: { mode: 'type', value: 'Water' },
  LIST_SELECTOR: '#tour-list'
};
</script>

<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/cards.css">
<div id="skeleton" class="skeleton-list" aria-hidden="true"></div>
<div id="tour-list" class="tour-list" hidden aria-live="polite"></div>
<script defer src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/cards.js"></script>
```

### **All Tours Page:**
```html
<script>
window.CFG = {
  DATA_URL: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
  CLIENT: 'funtrip-tours',
  USE_CLOUDFLARE: true,
  CLOUDFLARE_API: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
  FILTER: { mode: 'all', value: '' },
  LIST_SELECTOR: '#tour-list'
};
</script>

<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/cards.css">
<div id="skeleton" class="skeleton-list" aria-hidden="true"></div>
<div id="tour-list" class="tour-list" hidden aria-live="polite"></div>
<script defer src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/cards.js"></script>
```

---

## ✅ **Benefits of Self-Hosted Setup**

1. ⚡ **Instant Updates** - No more waiting for CDN cache
2. 🚀 **Faster Loading** - Cloudflare Workers are blazing fast
3. 🎯 **No Hash Changes** - URLs stay the same forever
4. 📊 **Better Control** - Deploy script updates everything
5. 🔒 **Consistent** - All clients use the same URLs

---

## 🔄 **Switching from Old to New**

### **Old Format (jsDelivr + Google Sheets):**
```html
<script>
window.CFG = {
  DATA_URL: 'https://script.google.com/macros/s/AKfycb.../exec',
  CLIENT: 'funtrip-tours',
  FILTER: { mode: 'type', value: 'Adventure' },
  LIST_SELECTOR: '#tour-list'
};
</script>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@4cca51b/src/tour-category/css/cards.css">
<script defer src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@4cca51b/src/tour-category/js/cards.js"></script>
```

### **New Format (Self-Hosted + Cloudflare API):**
```html
<script>
window.CFG = {
  DATA_URL: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
  CLIENT: 'funtrip-tours',
  USE_CLOUDFLARE: true,
  CLOUDFLARE_API: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
  FILTER: { mode: 'type', value: 'Adventure' },
  LIST_SELECTOR: '#tour-list'
};
</script>

<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/cards.css">
<script defer src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/cards.js"></script>
```

**Key changes:**
1. ✅ Updated `DATA_URL` to Cloudflare API
2. ✅ Added `USE_CLOUDFLARE: true`
3. ✅ Added `CLOUDFLARE_API` URL
4. ✅ Changed CSS/JS to self-hosted URLs
5. ✅ Removed commit hash from URLs

---

## 🔍 **Console Debugging**

When the page loads, you should see:

```
[Tours] Using Cloudflare API: https://tourism-api-production.krishna-0a3.workers.dev/api/tours?client=funtrip-tours&mode=type&value=Adventure&v=1234567890
[Tours] Fetched tours count: 15
[Tours] Filter config: {mode: 'type', value: 'Adventure'}
[Tours] Final filtered count: 15
```

---

## 🆘 **Troubleshooting**

### **Problem: No tours showing**
**Check:**
1. Console for error messages
2. Network tab for failed requests
3. Make sure `CLIENT: 'funtrip-tours'` matches your database client name

### **Problem: Wrong tours showing**
**Check:**
1. `FILTER.mode` is correct (`type`, `tag`, `keyword`, or `all`)
2. `FILTER.value` matches exactly (case-insensitive)
3. Console shows correct filter being applied

### **Problem: Old styling**
**Fix:**
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+F5` (Windows)
- The self-hosted files update instantly!

---

## 📋 **Quick Copy Template**

```html
<!-- Category Page Embed -->
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">

<script>
window.CFG = {
  DATA_URL: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
  CLIENT: 'funtrip-tours',
  USE_CLOUDFLARE: true,
  CLOUDFLARE_API: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
  FILTER: { mode: 'type', value: 'YOUR_CATEGORY_HERE' }, // ← Change this!
  LIST_SELECTOR: '#tour-list'
};
</script>

<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/cards.css">
<div id="skeleton" class="skeleton-list" aria-hidden="true"></div>
<div id="tour-list" class="tour-list" hidden aria-live="polite"></div>
<script defer src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/cards.js"></script>
```

**Just change:**
- `YOUR_CATEGORY_HERE` to your category name (e.g., `Adventure`, `Cultural`, `Water`, etc.)

---

## ✅ **Summary**

**Old way:**
- ❌ jsDelivr CDN (slow updates)
- ❌ Google Sheets API (slower)
- ❌ Hash in URL (changes every update)

**New way:**
- ✅ Self-hosted on Cloudflare (instant updates)
- ✅ Cloudflare D1 API (blazing fast)
- ✅ Stable URLs (never change)

---

**Copy the embed code above and replace your old code!** 🎉

