# SEO Meta Tags Auto-Update Script

## Issue
The meta tags script isn't updating the page title because it's loading before the Web Components.

## Solution: Improved Script

Use this **improved version** that waits for the data to be ready:

```html
<!-- SEO Auto-Update Script - Add to Header Code -->
<script>
(function() {
  console.log('[SEO] Script loaded, waiting for tour data...');
  
  let tourDataProcessed = false;
  let currentTour = null;
  let titleWatcher = null;
  
  function updateSEOTags(tour) {
    if (!tour) return;
    
    currentTour = tour;
    const siteName = 'FunTrip Tours Jamaica';
    const correctTitle = `${tour.name} | ${siteName}`;
    
    console.log('[SEO] Updating meta tags for:', tour.name);
    
    // Update page title
    document.title = correctTitle;
    console.log('[SEO] Title updated to:', document.title);
    
    // Update or create meta description
    const excerpt = tour.excerpt || `Book ${tour.name} with FunTrip Tours.`;
    const metaInfo = excerpt.substring(0, 160); // Google likes ~155-160 chars
    updateMetaTag('name', 'description', metaInfo);
    
    // Update Open Graph tags for social sharing
    updateMetaTag('property', 'og:title', `${tour.name} - ${siteName}`);
    updateMetaTag('property', 'og:description', excerpt.substring(0, 200));
    updateMetaTag('property', 'og:image', tour.image);
    updateMetaTag('property', 'og:url', window.location.href);
    updateMetaTag('property', 'og:type', 'website');
    updateMetaTag('property', 'og:site_name', siteName);
    
    // Twitter Card tags
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', tour.name);
    updateMetaTag('name', 'twitter:description', excerpt.substring(0, 200));
    updateMetaTag('name', 'twitter:image', tour.image);
    
    console.log('[SEO] All meta tags updated successfully');
    
    // Start title watcher to prevent overrides
    startTitleWatcher(correctTitle);
  }
  
  function updateMetaTag(attrName, attrValue, content) {
    if (!content) return;
    
    let tag = document.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attrName, attrValue);
      document.head.appendChild(tag);
    }
    tag.content = content;
  }
  
  // Title watcher to prevent GHL from overriding
  function startTitleWatcher(correctTitle) {
    if (titleWatcher) return; // Already running
    
    console.log('[SEO] Starting title watcher to prevent overrides');
    
    titleWatcher = setInterval(function() {
      if (document.title !== correctTitle) {
        console.log('[SEO] Title was overridden, restoring:', correctTitle);
        document.title = correctTitle;
      }
    }, 1000); // Check every second
  }
  
  // Method 1: Listen for the tour-data-loaded event
  window.addEventListener('tour-data-loaded', function(e) {
    console.log('[SEO] Received tour-data-loaded event');
    if (e.detail && e.detail.tour) {
      updateSEOTags(e.detail.tour);
    }
  });
  
  // Method 2: Check global tour data (fallback)
  function checkGlobalData() {
    if (window.__TOUR_DATA__) {
      const slugs = Object.keys(window.__TOUR_DATA__);
      if (slugs.length > 0) {
        const tour = window.__TOUR_DATA__[slugs[0]];
        console.log('[SEO] Found tour data in global variable:', tour.name);
        updateSEOTags(tour);
        return true;
      }
    }
    return false;
  }
  
  // Method 3: Poll for data (aggressive fallback)
  let attempts = 0;
  const maxAttempts = 30; // 3 seconds max
  
  const pollInterval = setInterval(function() {
    attempts++;
    
    if (tourDataProcessed) {
      clearInterval(pollInterval);
      return;
    }
    
    if (checkGlobalData()) {
      tourDataProcessed = true;
      clearInterval(pollInterval);
      return;
    }
    
    if (attempts >= maxAttempts) {
      console.warn('[SEO] Timeout: Could not find tour data after 3 seconds');
      clearInterval(pollInterval);
    }
  }, 100);
  
  // Method 4: Try immediately after DOM loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkGlobalData);
  } else {
    checkGlobalData();
  }
})();
</script>
```

## Why This Version is Better

### 🛡️ **Title Override Protection:**
- **Title Watcher** - Continuously monitors and restores the correct title every second
- **Prevents GHL Override** - Stops GoHighLevel from changing the title back
- **Persistent** - Keeps working even if other scripts try to override

### Multiple Detection Methods:
1. **Event Listener** - Waits for `tour-data-loaded` event
2. **Global Variable Check** - Checks `window.__TOUR_DATA__`
3. **Polling** - Checks every 100ms for up to 3 seconds
4. **Immediate Check** - Tries right away if data already loaded

### Debug Logging:
You'll see in console:
```
[SEO] Script loaded, waiting for tour data...
[SEO] Found tour data in global variable: Blue Hole Adventure
[SEO] Updating meta tags for: Blue Hole Adventure
[SEO] Title updated to: Blue Hole Adventure | FunTrip Tours Jamaica
[SEO] All meta tags updated successfully
[SEO] Starting title watcher to prevent overrides
[SEO] Title was overridden, restoring: Blue Hole Adventure | FunTrip Tours Jamaica
```

## Installation

### Replace your current script with this one:

1. Go to GHL page settings
2. Find **Header Code** or **Custom Code** section
3. **Replace** the old script with the new one above
4. Save and publish

## Testing

After updating:

1. **Refresh the page** (hard refresh: `Cmd+Shift+R` or `Ctrl+Shift+R`)
2. **Open Console** (right-click → Inspect → Console)
3. **Look for logs** starting with `[SEO]`
4. **Check browser tab** - should show tour name

### Expected Console Output:
```
[SEO] Script loaded, waiting for tour data...
[SEO] Found tour data in global variable: Bamboo Rafting & Beach Day
[SEO] Updating meta tags for: Bamboo Rafting & Beach Day
[SEO] Title updated to: Bamboo Rafting & Beach Day | FunTrip Tours Jamaica
[SEO] All meta tags updated successfully
[SEO] Starting title watcher to prevent overrides
[SEO] Title was overridden, restoring: Bamboo Rafting & Beach Day | FunTrip Tours Jamaica
```

## If Still Not Working

### Check 1: Script Placement
Make sure the script is in **Header Code**, not **Footer Code**.

### Check 2: Web Components Loading
Make sure you see in console:
```
✅ Tourism UI Kit Web Components loaded successfully!
[TOURISM-HERO] Fetched tour: [Tour Name]
```

### Check 3: Event Order
The SEO script must load **before** the Web Components bundle. Order should be:

```html
<!-- 1. SEO Script (in Header Code) -->
<script>
  (function() {
    // SEO script here
  })();
</script>

<!-- 2. Web Components (in page body) -->
<script src="https://tourism-api-production.krishna-0a3.workers.dev/static/js/components.js"></script>
```

## Alternative: Add to Web Components Bundle

If the separate script isn't working, I can **build the SEO updater directly into the Web Components bundle**. This would ensure it always runs at the right time.

Would you like me to do that instead?

## Troubleshooting

### Title Updates But Then Reverts?
**✅ FIXED!** The new script includes a **Title Watcher** that:
- Monitors the title every second
- Automatically restores the correct title if overridden
- Prevents GHL and other scripts from changing it back

You should see in console: `[SEO] Title was overridden, restoring: [Tour Name]`

### Title Never Updates?
Check console for errors. Most likely:
- Script loaded after components
- Tour data not available in `window.__TOUR_DATA__`
- Event not firing

### Social Sharing Shows Wrong Info?
Social crawlers cache previews. To clear:
- **Facebook:** Use [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- **LinkedIn:** Use [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- **WhatsApp:** Clear cache by sharing a different URL first, then share again

## Quick Fix Command

**Share your console output** after refreshing, and I'll tell you exactly what's wrong!

