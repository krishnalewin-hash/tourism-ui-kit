# Web Components Testing Guide

## What Was Fixed
The `tour-detail-form.js` script was overriding the global `fetch` function too broadly, causing conflicts with the Web Components' API calls. This has been fixed.

## Files Deployed
✅ All static files have been deployed to Cloudflare Workers:
- `https://tourism-api-production.krishna-0a3.workers.dev/static/js/tour-detail-form.js` (FIXED)
- `https://tourism-api-production.krishna-0a3.workers.dev/static/js/components.js` (Web Components bundle)
- `https://tourism-api-production.krishna-0a3.workers.dev/static/css/tour-detail-form.css`

## Test Checklist

### 1. Check Console Errors (PRIORITY)
**Expected:** Clean console, no errors
- ❌ Should NOT see: `Unchecked runtime.lastError: The message port closed before a response was received`
- ❌ Should NOT see: `TypeError: url.includes is not a function`
- ✅ Should see: `✅ Tourism UI Kit Web Components loaded successfully!`

### 2. Test Hero Component (`<tourism-hero>`)
**Expected:** Title, meta info, and 3-image gallery display correctly
- ✅ Tour title appears
- ✅ Duration, location, and type appear in meta
- ✅ Main gallery with 3 images loads
- ✅ Photo count badge shows correct number

### 3. Test Details Component (`<tourism-details>`)
**Expected:** Overview, highlights, gallery, and accordion sections display
- ✅ Tour overview/description appears
- ✅ Highlights chips appear (if tour has highlights)
- ✅ Gallery grid appears (if tour has additional gallery images)
- ✅ Accordion items for itinerary, inclusions, exclusions, FAQs appear

### 4. Test Related Component (`<tourism-related>`)
**Expected:** Grid of 3 related tour cards
- ✅ Related tours section appears
- ✅ Correct number of tour cards (default 3, or custom limit)
- ✅ Cards link to correct tour pages
- ✅ Prices display correctly (From $X)

### 5. Test Form Integration (CRITICAL)
**Expected:** Form still works with autocomplete and submission
- ✅ Pickup location autocomplete works
- ✅ Drop-off location autocomplete works (or auto-fills and hides on tour pages)
- ✅ Date/time pickers open correctly
- ✅ Passenger dropdown works
- ✅ Form submission passes full place names (not just typed text)
- ✅ Form redirects to next page without 422 errors

### 6. Test Page Load Performance
**Expected:** Fast initial load with Web Components
- ✅ Hero component loads within ~500ms
- ✅ Details component populates shortly after
- ✅ Related tours populate within 2-3 seconds
- ✅ No long delays or timeouts

## Current Test URL
Test on your FunTrip Tours site:
- https://funtriptoursinjamaica.com/blue-hole-secret-falls-adventure
- https://funtriptoursinjamaica.com/bamboo-rafting-with-limestone-foot-massage

## Current Embed Code
Your GHL pages should use:

```html
<!-- Tour Detail Page Embed -->
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/components.js"></script>

<tourism-hero client="funtrip-tours"></tourism-hero>

<!-- Your GHL Form Block goes here -->

<tourism-details client="funtrip-tours"></tourism-details>

<tourism-related client="funtrip-tours" limit="3"></tourism-related>

<!-- Form Styling (separate block) -->
<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/tour-detail-form.css">
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/tour-detail-form.js"></script>
```

## What to Report
If you see any issues, please provide:
1. **URL** of the page where the issue occurs
2. **Console output** (screenshot or copy/paste)
3. **What's not working** (specific component or feature)
4. **Expected vs. actual behavior**

## Known Good State
- ✅ Fetch override now specific to GHL form submissions only
- ✅ Type checks prevent errors with Request objects
- ✅ All fetch arguments preserved for Web Components
- ✅ Form submission still intercepts and modifies place data

## Next Steps After Testing
Once you confirm everything works:
1. Update other tour detail pages with the new Web Component embed
2. Consider implementing Web Components for category pages
3. Explore additional Web Components for other page types (e.g., homepage hero)

