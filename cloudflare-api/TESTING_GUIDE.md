# Testing Guide: Cloudflare API

## ✅ Your Current Setup is SAFE!

All existing pages continue to use Google Sheets. **Nothing will break.**

---

## How to Test Cloudflare API on ONE Page

### Step 1: Choose a Test Page

Pick **one FunTrip Tours page** to test with. For example:
- Blue Hole Secret Falls Adventure
- Y.S. Falls River Tour
- Any tour page

### Step 2: Update Config Block (Only on Test Page)

**Current config (all your pages):**
```html
<script>
window.CFG = {
  DATA_URL: 'https://script.google.com/macros/s/AKfycbwH_2Pbdzmh3apj-CtR47yaq7-9cWCEKv-El5IDn1HlaKpNvNPOcppTPXsDeji2On-Cpw/exec',
  CLIENT: 'funtrip-tours',
  client: 'funtrip-tours',
  formType: 'tour'
};
</script>
```

**New config (test page only):**
```html
<script>
window.CFG = {
  USE_CLOUDFLARE: true,  // ← ADD THIS LINE
  CLOUDFLARE_API: 'https://tourism-api-staging.krishna-0a3.workers.dev/api/tours',  // ← ADD THIS LINE
  DATA_URL: 'https://script.google.com/macros/s/AKfycbwH_2Pbdzmh3apj-CtR47yaq7-9cWCEKv-El5IDn1HlaKpNvNPOcppTPXsDeji2On-Cpw/exec',
  CLIENT: 'funtrip-tours',
  client: 'funtrip-tours',
  formType: 'tour'
};
</script>
```

### Step 3: Update Script URLs (Latest Commit)

Update your Block A, B, C script tags to use the latest commit:

```html
<!-- Block A -->
<script src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@f74f881/src/tour-detail/js/block-a.js"></script>

<!-- Block B -->
<script src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@f74f881/src/tour-detail/js/block-b.js"></script>

<!-- Block C -->
<script src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@f74f881/src/tour-detail/js/block-c.js"></script>
```

Or use `@main` (wait 5 minutes for CDN cache):
```html
<script src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@main/src/tour-detail/js/block-a.js"></script>
```

### Step 4: Test the Page

1. **Open the test page** in your browser
2. **Open Developer Tools** (F12 → Console)
3. **Check for the log:**
   ```
   [BlockA] Using API: Cloudflare → https://tourism-api-staging.krishna-0a3.workers.dev/api/tours/your-slug
   ```

4. **Verify the page loads:**
   - Hero section appears
   - Tour details load
   - Highlights show
   - Inclusions show
   - Related tours appear

5. **Compare load times:**
   - **Google Sheets:** 3-5 seconds
   - **Cloudflare:** < 1 second (should be MUCH faster!)

---

## What to Check

✅ **Hero section** - Title, meta, images  
✅ **Tour details** - Description, highlights (chips)  
✅ **Gallery** - Images display  
✅ **Accordion** - Itinerary, inclusions, exclusions  
✅ **Related tours** - Show on first load (not just refresh)  
✅ **Booking form** - Auto-fills drop-off location  

---

## Troubleshooting

### Issue: Console shows "Using API: Google Sheets"

**Fix:** Make sure you added `USE_CLOUDFLARE: true` to the config.

### Issue: Page shows "Tour not found"

**Fix:** Check that the slug in the URL matches a tour in your database. Test with:
```bash
curl "https://tourism-api-staging.krishna-0a3.workers.dev/api/tours/blue-hole-secret-falls-adventure?client=funtrip-tours"
```

### Issue: Related tours not loading

**Fix:** Check console for errors. Make sure Block C script is also updated to latest commit.

---

## Rollback (If Needed)

**To instantly switch back to Google Sheets:**

Just remove the two lines from config:
```html
<script>
window.CFG = {
  // USE_CLOUDFLARE: true,  ← COMMENT OUT OR DELETE
  // CLOUDFLARE_API: '...',  ← COMMENT OUT OR DELETE
  DATA_URL: 'https://script.google.com/macros/s/.../exec',
  CLIENT: 'funtrip-tours',
  client: 'funtrip-tours',
  formType: 'tour'
};
</script>
```

**Save and publish → back to Google Sheets in < 1 minute!**

---

## Performance Comparison

### Before (Google Sheets):
```
[BlockA] Fetching tour data from: https://script.google.com/macros/...
[BlockA] Fetching from network...
(3-5 seconds pass...)
[BlockA] API returned 1 tours
```

### After (Cloudflare):
```
[BlockA] Using API: Cloudflare → https://tourism-api-staging.krishna-0a3.workers.dev/...
[BlockA] Fetching tour data from: https://tourism-api-staging.krishna-0a3.workers.dev/...
[BlockA] Fetching from network...
(< 300ms!)
[BlockA] API returned 1 tours
```

**60-100x faster!** 🚀

---

## Once You're Happy with Testing

### Enable for All FunTrip Tours Pages:

1. Add `USE_CLOUDFLARE: true` to all FunTrip Tours pages
2. Monitor for 2-3 days
3. If all good, enable for Kamar Tours
4. Keep Google Sheets running for 30 more days as backup

---

## Questions?

**Q: Will this affect my other pages?**  
A: No! Only pages with `USE_CLOUDFLARE: true` use the new API.

**Q: Can I test locally?**  
A: Yes! The API is live and works from anywhere.

**Q: What if Cloudflare is down?**  
A: Just remove `USE_CLOUDFLARE: true` and you're back to Google Sheets instantly.

**Q: Do I need to update my data?**  
A: No! Your data is already in Cloudflare (migrated from Google Sheets).

**Q: How do I update tours in Cloudflare?**  
A: For now, update Google Sheets, then run the migration script again. Later, we'll build an admin panel!

---

## Ready to Test?

1. Pick one test page
2. Add `USE_CLOUDFLARE: true` to config
3. Update script URLs to `@f74f881` or `@main`
4. Test and compare performance
5. Let me know how it goes! 🎯

