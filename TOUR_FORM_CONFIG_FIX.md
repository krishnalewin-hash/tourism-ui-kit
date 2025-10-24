# Tour Form Configuration Fix

## Issue
Drop-off location is not auto-filling with the page title and is not being hidden on tour detail pages.

## Root Cause
The form JavaScript is checking for `window.CFG.formType === 'tour'` but this configuration is not set on your page.

## Solution: Add Configuration Block

You need to add a **CONFIG block** to your tour detail pages **BEFORE** the form styling JavaScript loads.

### Correct Page Structure (Updated)

Your tour detail page should have these custom code blocks in this exact order:

#### Block 1: Hero Component
```html
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/components.js"></script>
<tourism-hero client="funtrip-tours"></tourism-hero>
```

#### Block 2: Configuration (NEW - ADD THIS!)
```html
<script>
window.CFG = window.CFG || {};
window.CFG.formType = 'tour';  // This is critical for tour pages!
window.CFG.client = 'funtrip-tours';
</script>
```

#### Block 3: [Your GHL Form Block - No code needed]

#### Block 4: Form Styling (AFTER form and config)
```html
<link rel="stylesheet" href="https://tourism-api-production.krishna-0a3.workers.dev/static/css/tour-detail-form.css">
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/tour-detail-form.js"></script>
```

#### Block 5: Details Component
```html
<tourism-details client="funtrip-tours"></tourism-details>
```

#### Block 6: Related Tours Component
```html
<tourism-related client="funtrip-tours" limit="3"></tourism-related>
```

---

## What the Configuration Does

### `formType: 'tour'`
When set to `'tour'`, the JavaScript will:
1. ✅ Auto-fill the drop-off location with the page title
2. ✅ Hide the drop-off field wrapper (sets `aria-hidden="true"`)
3. ✅ Trigger the CSS rule to hide the outer wrapper

### Without `formType: 'tour'`
- ❌ Drop-off field is visible
- ❌ Drop-off field is not auto-filled
- ❌ User has to manually enter drop-off location

---

## Verification Steps

### 1. Add the Config Block
Place it **BEFORE** the form styling JavaScript in your GHL page structure.

### 2. Refresh the Page
Do a hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### 3. Check Browser Console
Open Console (right-click → Inspect → Console) and you should see:
```
[TourForm] Auto-filled drop-off field with title: [Your Tour Name]
[TourForm] Hidden drop-off field wrapper
```

If you see this, it's working!

### 4. Verify Visually
- ✅ Drop-off location field should be completely hidden
- ✅ No empty space where the field was
- ✅ If you inspect the page, the field should have `aria-hidden="true"`

---

## Alternative: Combined Config Block

If you want to keep all configuration in one place, you can combine it with other settings:

```html
<script>
// Global configuration for all components
window.CFG = {
  // Client identification
  client: 'funtrip-tours',
  
  // Form configuration
  formType: 'tour',  // Set to 'tour' for tour pages, 'transfer' for transfer pages
  
  // Optional: Google Maps API key (if not using embed script)
  // GMAPS_KEY: 'YOUR_API_KEY_HERE',
  
  // Optional: Geographic restrictions for autocomplete
  // COUNTRIES: ['jm'],
  // REGION: 'jm'
};

console.log('[Config] Loaded configuration for', window.CFG.client, 'form type:', window.CFG.formType);
</script>
```

---

## For Transfer Pages (Airport Transfers)

If you have airport transfer pages where you want the drop-off field visible, use:

```html
<script>
window.CFG = window.CFG || {};
window.CFG.formType = 'transfer';  // Shows drop-off field
window.CFG.client = 'funtrip-tours';
</script>
```

Or simply omit the `formType` property entirely (defaults to showing the field).

---

## Debugging

If it's still not working after adding the config:

### Check 1: Config is Loaded Before Form JS
In the console, type:
```javascript
window.CFG
```

You should see:
```javascript
{
  formType: "tour",
  client: "funtrip-tours"
}
```

If you see `undefined` or `formType` is missing, the config block is not loading or is in the wrong order.

### Check 2: Form JavaScript is Running
In the console, look for:
```
[TourForm] Auto-filled drop-off field with title: ...
```

If you don't see this, the JavaScript might not be loading or is encountering an error.

### Check 3: Page Title is Correct
The auto-fill uses `document.title`. In the console, type:
```javascript
document.title
```

This should return your tour name (e.g., "Blue Hole Secret Falls Adventure"). If it returns something generic like "Tours" or "Loading...", the page title might not be set correctly.

### Check 4: Drop-off Field Exists
In the console, type:
```javascript
document.querySelector('input[data-q="drop-off_location"]')
```

This should return the input element. If it returns `null`, the field doesn't have the correct `data-q` attribute.

---

## CSS Hiding Mechanism

The JavaScript sets `aria-hidden="true"` on the `.form-builder--item` wrapper, which triggers this CSS rule:

```css
.col-12.form-field-wrapper:has(.form-builder--item[aria-hidden="true"]) {
  display: none !important;
}
```

This hides the entire field wrapper, including labels, icons, and any spacing.

---

## Quick Copy-Paste Solution

**Add this block to your tour detail pages, placed BEFORE the form styling JavaScript:**

```html
<!-- Configuration for Tour Form -->
<script>
window.CFG = window.CFG || {};
window.CFG.formType = 'tour';
window.CFG.client = 'funtrip-tours';
</script>
```

That's it! This single addition should restore the auto-fill and hide functionality.

---

## Why This Happened

When you switched from the old embed structure to Web Components, you might have removed or lost the configuration block that was setting `formType: 'tour'`. The Web Components don't need this config (they have their own `client` attribute), but the **form JavaScript still needs it** to determine the form type and enable tour-specific behavior.

---

## Summary

✅ **Add** a config block with `formType: 'tour'`  
✅ **Place** it before the form styling JavaScript  
✅ **Refresh** the page with a hard refresh  
✅ **Verify** in console that auto-fill is working  

This should completely resolve the issue!

