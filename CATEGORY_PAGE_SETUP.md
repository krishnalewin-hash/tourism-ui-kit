# Category Page Setup Guide

## Overview
Category pages display a list/grid of tour cards, optionally filtered by type, tag, or keyword. The existing `cards.js` and `cards.css` files are already deployed to Cloudflare and ready to use.

## Basic Setup

### Option 1: Show All Tours (No Filter)

```html
<!-- Category Page: All Tours -->
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">

<script>
window.CFG = {
  DATA_URL: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
  CLIENT: 'funtrip-tours',
  USE_CLOUDFLARE: true,
  CLOUDFLARE_API: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
  LIST_SELECTOR: '#tour-list'
};
</script>

<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/cards.css">

<div id="skeleton" class="skeleton-list" aria-hidden="true"></div>
<div id="tour-list" class="tour-list" hidden aria-live="polite"></div>

<script defer src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/cards.js"></script>
```

---

### Option 2: Filter by Tour Type

```html
<!-- Category Page: Adventure Tours -->
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">

<script>
window.CFG = {
  DATA_URL: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
  CLIENT: 'funtrip-tours',
  USE_CLOUDFLARE: true,
  CLOUDFLARE_API: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
  FILTER: {
    mode: 'type',
    value: 'Adventure'  // Must match exact type from your database
  },
  LIST_SELECTOR: '#tour-list'
};
</script>

<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/cards.css">

<div id="skeleton" class="skeleton-list" aria-hidden="true"></div>
<div id="tour-list" class="tour-list" hidden aria-live="polite"></div>

<script defer src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/cards.js"></script>
```

**Common Tour Types for FunTrip Tours:**
- `Adventure`
- `Water Sports`
- `Culture, Wellness & Lifestyle`
- `Nature & Wildlife`
- `Relaxation & Wellness`

---

### Option 3: Filter by Tag

```html
<!-- Category Page: Family-Friendly Tours -->
<script>
window.CFG = {
  DATA_URL: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
  CLIENT: 'funtrip-tours',
  USE_CLOUDFLARE: true,
  CLOUDFLARE_API: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
  FILTER: {
    mode: 'tag',
    value: 'Families'  // Must match exact tag from your database
  },
  LIST_SELECTOR: '#tour-list'
};
</script>

<!-- ... rest of HTML ... -->
```

**Common Tags:**
- `Families`
- `Couples`
- `Groups`
- `Adventure seekers`
- `Nature lovers`
- `Relaxation seekers`

---

### Option 4: Filter by Keyword (Search)

```html
<!-- Category Page: Search Results -->
<script>
window.CFG = {
  DATA_URL: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
  CLIENT: 'funtrip-tours',
  USE_CLOUDFLARE: true,
  CLOUDFLARE_API: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
  FILTER: {
    mode: 'keyword',
    value: 'waterfall'  // Searches in name, excerpt, and tags
  },
  LIST_SELECTOR: '#tour-list'
};
</script>

<!-- ... rest of HTML ... -->
```

---

## Tour Card Layout

Each tour card displays:
- **Image** (4:3 aspect ratio on desktop, 16:9 on mobile)
- **Title** (clickable, links to tour detail page)
- **Meta info** (⏱ Duration, 📍 Location, 🏷 Type)
- **Description** (excerpt)
- **Price** ("From $XX" or "Price on request")
- **CTA Button** ("View Details")

### Example Card Output:
```
┌──────────────────────────────────────────────────────────┐
│  [Image]      │  Title                      │ From $135  │
│               │  ⏱ 6-8 hours               │            │
│               │  📍 Ocho Rios              │ [View      │
│               │  🏷 Adventure              │  Details]  │
│               │  Experience the...          │            │
└──────────────────────────────────────────────────────────┘
```

---

## Configuration Options

### Required Settings

| Property | Description | Example |
|----------|-------------|---------|
| `DATA_URL` | API endpoint (fallback) | `'https://tourism-api-production.krishna-0a3.workers.dev/api/tours'` |
| `CLIENT` | Your client name | `'funtrip-tours'` |
| `CLOUDFLARE_API` | Cloudflare API endpoint | `'https://tourism-api-production.krishna-0a3.workers.dev/api/tours'` |
| `USE_CLOUDFLARE` | Use Cloudflare API (not Google Sheets) | `true` |

### Optional Settings

| Property | Description | Example |
|----------|-------------|---------|
| `FILTER.mode` | Filter type: `'type'`, `'tag'`, `'keyword'`, or `'all'` | `'type'` |
| `FILTER.value` | Filter value (must match database exactly) | `'Adventure'` |
| `LIST_SELECTOR` | CSS selector for mount point | `'#tour-list'` |

---

## Creating Multiple Category Pages

### 1. Adventure Tours Page
**URL:** `/adventures` or `/category/adventure`

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
```

### 2. Water Sports Page
**URL:** `/water-sports` or `/category/water-sports`

```html
<script>
window.CFG = {
  // ... same config ...
  FILTER: { mode: 'type', value: 'Water Sports' },
};
</script>
```

### 3. Culture & Wellness Page
**URL:** `/culture-wellness` or `/category/culture-wellness`

```html
<script>
window.CFG = {
  // ... same config ...
  FILTER: { mode: 'type', value: 'Culture, Wellness & Lifestyle' },
};
</script>
```

### 4. Family Tours Page
**URL:** `/family-tours` or `/tours-for-families`

```html
<script>
window.CFG = {
  // ... same config ...
  FILTER: { mode: 'tag', value: 'Families' },
};
</script>
```

---

## Complete Template

Use this as your base template for all category pages:

```html
<!-- Category Page Template -->

<!-- Load Poppins font -->
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">

<!-- Configuration -->
<script>
window.CFG = {
  DATA_URL: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
  CLIENT: 'funtrip-tours',
  USE_CLOUDFLARE: true,
  CLOUDFLARE_API: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
  
  // Optional: Add filter for specific categories
  // FILTER: { mode: 'type', value: 'Adventure' },
  // FILTER: { mode: 'tag', value: 'Families' },
  // FILTER: { mode: 'keyword', value: 'waterfall' },
  
  LIST_SELECTOR: '#tour-list'
};
</script>

<!-- Load Styles -->
<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/cards.css">

<!-- Skeleton (shows while loading) -->
<div id="skeleton" class="skeleton-list" aria-hidden="true"></div>

<!-- Tour List (populated by JavaScript) -->
<div id="tour-list" class="tour-list" hidden aria-live="polite"></div>

<!-- Load Script -->
<script defer src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/cards.js"></script>
```

---

## Styling Customization

If you want to customize the look, add your own CSS **after** the cards.css:

```html
<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/cards.css">

<style>
/* Custom overrides */
.tour-card {
  /* Your custom styles */
}

.btn-primary {
  background: #your-brand-color !important;
}
</style>
```

---

## Troubleshooting

### No Tours Showing

**Check Console for errors:**
```javascript
// Open Console, type:
window.CFG
```

Should return your config object.

**Common Issues:**
1. **Wrong filter value** - Must match database exactly (case-sensitive)
2. **Wrong CLIENT** - Should be `'funtrip-tours'`
3. **API not responding** - Test: https://tourism-api-production.krishna-0a3.workers.dev/api/tours?client=funtrip-tours

### Tours Load But Filter Doesn't Work

**Verify your filter value:**
```javascript
// In console:
fetch('https://tourism-api-production.krishna-0a3.workers.dev/api/tours?client=funtrip-tours')
  .then(r => r.json())
  .then(d => {
    // See all tour types:
    console.log('Types:', [...new Set(d.tours.map(t => t.type))]);
    // See all tags:
    console.log('Tags:', [...new Set(d.tours.flatMap(t => t.tags || []))]);
  });
```

Use the **exact** string from the output.

### Skeleton Doesn't Hide

The skeleton should automatically hide once tours load. If it doesn't:
1. Check if JavaScript loaded: look for errors in Console
2. Verify `#tour-list` element exists in your HTML
3. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

---

## SEO & Accessibility

The script automatically adds:
- ✅ **JSON-LD structured data** (ItemList schema)
- ✅ **ARIA attributes** (`aria-hidden`, `aria-live`)
- ✅ **Semantic HTML** (proper headings, links)
- ✅ **Screen reader support** (sr-only labels)

---

## Performance

- ✅ **Skeleton loading** - Shows immediately while data fetches
- ✅ **Cloudflare edge cache** - Fast API responses
- ✅ **Lazy load images** - Only visible images load first
- ✅ **Server-side filtering** - Only requested tours are returned

---

## Next Steps

1. **Create your first category page** (use template above)
2. **Test with different filters** (type, tag, keyword)
3. **Add custom styling** if needed
4. **Create navigation menu** linking to category pages

Let me know which category pages you want to set up first!

