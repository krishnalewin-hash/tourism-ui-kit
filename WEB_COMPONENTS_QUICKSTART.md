# 🧩 Web Components - Quick Start Guide

## ✅ **Phase 1 Complete: Hero Component**

The `<tourism-hero>` Web Component is now **live** and ready to test!

---

## 🚀 **Try It Now**

### **Single Line Embed:**
```html
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/components.js"></script>
<tourism-hero client="funtrip-tours" slug="blue-hole-secret-falls-adventure"></tourism-hero>
```

That's it! The component will:
1. ✅ Load tour data from API
2. ✅ Render hero section with title, meta, gallery
3. ✅ Show loading skeleton
4. ✅ Broadcast tour data to other components

---

## 📝 **Component Attributes**

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `client` | ✅ Yes | - | Client name (e.g., `funtrip-tours`) |
| `slug` | No | auto-detect | Tour slug (detects from URL if omitted) |
| `api-url` | No | production | Override API endpoint |

---

## 🎯 **Examples**

### **Example 1: Auto-detect slug from URL**
```html
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/components.js"></script>
<tourism-hero client="funtrip-tours"></tourism-hero>
```
**Use when:** Page URL is `/tours/blue-hole-secret-falls-adventure` or `/blue-hole-secret-falls-adventure`

### **Example 2: Explicit slug**
```html
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/components.js"></script>
<tourism-hero client="funtrip-tours" slug="bamboo-rafting-with-limestone-foot-massage"></tourism-hero>
```
**Use when:** You want to override URL detection

### **Example 3: Multiple components on one page**
```html
<!-- Load components library once -->
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/components.js"></script>

<!-- Component 1 -->
<tourism-hero client="funtrip-tours" slug="tour-one"></tourism-hero>

<!-- Component 2 -->
<tourism-hero client="funtrip-tours" slug="tour-two"></tourism-hero>
```

---

## 🔄 **Event System**

### **Dispatched Event:**
```javascript
// The hero component dispatches this after loading data:
window.dispatchEvent(new CustomEvent('tour-data-loaded', {
  detail: {
    slug: 'blue-hole-secret-falls-adventure',
    tour: {
      name: 'Blue Hole Secret Falls Adventure',
      type: 'Adventure',
      // ... full tour object
    },
    client: 'funtrip-tours',
    source: 'tourism-hero',
    timestamp: 1234567890
  }
}));
```

### **Listen in Your Code:**
```html
<script>
  window.addEventListener('tour-data-loaded', (e) => {
    console.log('Tour loaded:', e.detail.tour.name);
    console.log('Tour type:', e.detail.tour.type);
    console.log('Tour slug:', e.detail.slug);
    
    // Use the data in your GHL form or other scripts
    document.getElementById('tour-name-field').value = e.detail.tour.name;
  });
</script>
```

---

## 🎨 **Styling**

### **Built-in Styles**
The component uses Shadow DOM, so styles are encapsulated and won't conflict with your site's CSS.

### **Fonts**
The component uses `Poppins` font. Include it in your page:
```html
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
```

### **Responsive**
The component is fully responsive:
- Desktop: 3-column gallery grid
- Mobile: Single-column stack

---

## 🧪 **Test Locally**

1. **Open test file:**
   ```bash
   cd web-components
   open test-hero.html
   ```

2. **Or serve it:**
   ```bash
   python3 -m http.server 8000
   # Then open: http://localhost:8000/test-hero.html
   ```

3. **Test different tours:**
   - Use the test controls to change client/slug
   - Watch the event log for data broadcasts
   - Check browser console for debug logs

---

## 📦 **What's Rendered**

```
┌─────────────────────────────────────────┐
│  Blue Hole Secret Falls Adventure      │ ← Title (H1)
│  ⏱ 4-5 hours  📍 Ocho Rios  🏷 Adventure  │ ← Meta info
│                                         │
│  ┌───────────┬─────────┐               │
│  │           │         │               │ ← Image gallery
│  │   Main    │  Img 2  │               │   (2fr 1fr 1fr grid)
│  │   Image   ├─────────┤               │
│  │           │  Img 3  │               │
│  │           │         │               │
│  └───────────┴─────────┘               │
│              [📷 5 Photos]              │ ← Count badge
└─────────────────────────────────────────┘
```

---

## ✅ **Browser Support**

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 67+ | ✅ Full support |
| Firefox | 63+ | ✅ Full support |
| Safari | 10.1+ | ✅ Full support |
| Edge | 79+ | ✅ Full support |

**Coverage:** ~95% of users

---

## 🔍 **Debugging**

### **Check if component loaded:**
```javascript
console.log(customElements.get('tourism-hero'));
// Should output: class TourismHero extends TourismComponent
```

### **Check component state:**
```javascript
const hero = document.querySelector('tourism-hero');
console.log('Client:', hero.client);
console.log('Slug:', hero.slug);
console.log('Data:', hero._data);
```

### **Console logs:**
The component logs helpful debug info:
```
[TOURISM-HERO] Fetching tour: https://...
[TOURISM-HERO] Fetched tour: Blue Hole Secret Falls Adventure
[TOURISM-HERO] Broadcasted event: tour-data-loaded {...}
```

---

## 🚧 **Next Steps**

### **Phase 2: Details Component (Block B)** - Coming next!
```html
<tourism-details client="funtrip-tours"></tourism-details>
```
Will render:
- Overview/description
- Highlights chips
- Gallery
- Accordion (itinerary, inclusions, exclusions, FAQs)

### **Phase 3: Related Tours (Block C)**
```html
<tourism-related client="funtrip-tours" limit="3"></tourism-related>
```

### **Phase 4: Tour List (Category Pages)**
```html
<tourism-tour-list client="funtrip-tours" filter-type="Adventure"></tourism-tour-list>
```

---

## 💡 **Tips**

1. **Load script once per page**
   - The components.js file registers all components
   - No need to load multiple times

2. **Auto-detect is smart**
   - Works with `/tours/slug`, `/slug`, or `?slug=slug`
   - Normalizes to lowercase, trims whitespace

3. **No style conflicts**
   - Shadow DOM isolates styles
   - Your GHL styles won't affect components
   - Component styles won't affect your site

4. **Instant updates**
   - We control the component file
   - Updates deploy instantly (no cache!)
   - No more hash changes

---

## 🎉 **Current Status**

✅ **Phase 1 Complete:**
- Base component class
- Hero component (Block A)
- Event system
- Error handling
- Loading states
- Deployed to production

**Production URL:**
```
https://tourism-api-production.krishna-0a3.workers.dev/static/js/components.js
```

---

## 📞 **Need Help?**

**Test URL:**
- Test page: `/web-components/test-hero.html`
- Production component: `https://tourism-api-production.krishna-0a3.workers.dev/static/js/components.js`

**Logs:**
- Open browser console (F12)
- Look for `[TOURISM-HERO]` logs
- Check Network tab for API calls

---

**Ready to test? Try adding the component to a test GHL page!** 🚀

