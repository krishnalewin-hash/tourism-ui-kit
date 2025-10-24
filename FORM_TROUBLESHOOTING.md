# Form Styling & Functionality Troubleshooting

## Issue
Form styling and functionality are not working after Web Components update.

## Quick Checklist

### 1. Check Your Current Embed Code
Your form embed should look like this:

```html
<!-- Form Styling Block (separate from Web Components) -->
<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/tour-detail-form.css">
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/tour-detail-form.js"></script>
```

**Important:** The form styling should be in a **SEPARATE** custom code block from the Web Components!

### 2. Verify File Availability
Test if the files are loading:
- CSS: https://tourism-api-production.krishna-0a3.workers.dev/static/css/tour-detail-form.css
- JS: https://tourism-api-production.krishna-0a3.workers.dev/static/js/tour-detail-form.js

Open these URLs in your browser - they should show the CSS/JS code, not a 404 error.

### 3. Check Browser Console
1. Right-click on your form page → Inspect → Console tab
2. Look for errors like:
   - ❌ `Failed to load resource: 404 Not Found`
   - ❌ `net::ERR_BLOCKED_BY_CLIENT` (ad blocker)
   - ❌ `Syntax error` or `Unexpected token`

### 4. Check Network Tab
1. Right-click → Inspect → Network tab
2. Refresh the page
3. Filter by "JS" and "CSS"
4. Look for `tour-detail-form.css` and `tour-detail-form.js`
5. Check:
   - ✅ Status should be `200 OK`
   - ❌ If `404 Not Found`: File path is wrong
   - ❌ If `blocked`: Ad blocker or CORS issue

### 5. Common Issues & Fixes

#### Issue: CSS not loading
**Symptoms:** Form looks unstyled, default browser styling
**Fix:**
```html
<!-- Make sure the CSS link is in a custom HTML block BEFORE your GHL form -->
<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/tour-detail-form.css">
```

#### Issue: JavaScript not loading
**Symptoms:** Autocomplete doesn't work, date picker doesn't work, no field icons
**Fix:**
```html
<!-- Make sure the JS script is in a custom HTML block AFTER your GHL form -->
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/tour-detail-form.js"></script>
```

#### Issue: Wrong file path
**Symptoms:** 404 errors in console
**Old paths (DON'T USE):**
```html
<!-- ❌ OLD - Don't use these -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@5c191d1/src/tour-detail-form/css/tour-detail-form.css">
<script src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@5c191d1/src/tour-detail-form/js/tour-detail-form.js"></script>
```

**New paths (USE THESE):**
```html
<!-- ✅ NEW - Use these instead -->
<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/tour-detail-form.css">
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/tour-detail-form.js"></script>
```

#### Issue: Script loading before form HTML
**Symptoms:** JavaScript features don't work
**Fix:** Ensure script order in GHL:
1. Block 1: Web Components (Hero)
2. Block 2: Your GHL Form
3. Block 3: Form Styling CSS + JS (AFTER the form)
4. Block 4: Web Components (Details)
5. Block 5: Web Components (Related)

### 6. Correct GHL Page Structure

Your tour detail page should have these custom code blocks in this order:

#### Block 1: Hero Component
```html
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/components.js"></script>
<tourism-hero client="funtrip-tours"></tourism-hero>
```

#### Block 2: [Your GHL Form Block - No code needed]

#### Block 3: Form Styling (AFTER form)
```html
<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/tour-detail-form.css">
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/tour-detail-form.js"></script>
```

#### Block 4: Details Component
```html
<tourism-details client="funtrip-tours"></tourism-details>
```

#### Block 5: Related Tours Component
```html
<tourism-related client="funtrip-tours" limit="3"></tourism-related>
```

### 7. Test Individual Features

Once the files are loading, test each feature:

| Feature | How to Test | Expected Result |
|---------|------------|-----------------|
| **CSS Styling** | Look at form fields | Should have rounded corners, borders, shadows |
| **Icons** | Check left side of fields | Should see icons (📍, 📅, ⏰, 👤, 📧, 📞) |
| **Autocomplete** | Click pickup location | Google Places dropdown should appear |
| **Date Picker** | Click pickup date | Custom calendar should appear |
| **Time Picker** | Click pickup time | Custom time dropdown should appear |
| **Passenger Select** | Click number of passengers | Custom dropdown (1-15, 16+) should appear |
| **Drop-off Hide** | On tour pages | Drop-off field should be hidden |
| **Validation** | Submit empty form | Inline error messages should appear |

### 8. If Still Not Working

**Provide these details:**
1. **URL** of the page with the issue
2. **Console output** (screenshot or copy/paste)
3. **Network tab** showing tour-detail-form.css and .js status
4. **Current embed code** you're using for the form
5. **What's working and what's not** (specific features)

### 9. Quick Test URLs
Test these directly in your browser to verify files are accessible:
- https://tourism-api-production.krishna-0a3.workers.dev/static/css/tour-detail-form.css
- https://tourism-api-production.krishna-0a3.workers.dev/static/js/tour-detail-form.js
- https://tourism-api-production.krishna-0a3.workers.dev/static/js/components.js

All three should load without errors.

### 10. Cache Busting
If you see old styling, force a hard refresh:
- **Chrome/Edge:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- **Firefox:** `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- **Safari:** `Cmd+Option+R` (Mac)

Or add a cache-busting parameter temporarily:
```html
<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/tour-detail-form.css?v=2">
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/tour-detail-form.js?v=2"></script>
```

---

## Most Likely Cause
Based on the Web Components update, the most likely issue is that your form embed code is still using the **OLD jsDelivr URLs** instead of the **NEW Cloudflare URLs**.

### Solution
Update your form styling block from:
```html
<!-- OLD -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@XXXXX/src/tour-detail-form/css/tour-detail-form.css">
<script src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@XXXXX/src/tour-detail-form/js/tour-detail-form.js"></script>
```

To:
```html
<!-- NEW -->
<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/tour-detail-form.css">
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/tour-detail-form.js"></script>
```

This ensures you're loading from the self-hosted Cloudflare files instead of the cached jsDelivr CDN.

