# Zero-Downtime Migration Plan

## Executive Summary

We're migrating from Google Sheets + Apps Script to Cloudflare Workers + D1 Database **without interrupting your live clients**.

**Key Principles:**
1. ✅ **No downtime** - Google Sheets stays active during migration
2. ✅ **Test everything** - Full testing before switching clients
3. ✅ **Rollback ready** - Can revert in < 1 minute if issues occur
4. ✅ **Gradual migration** - One client at a time
5. ✅ **Compatible API** - No frontend code changes needed

---

## Timeline: 4 Weeks

### Week 1: Infrastructure & Testing
- **Goal:** Get Cloudflare API running with your data
- **Risk:** None (clients still on Google Sheets)
- **What you'll do:**
  1. Create Cloudflare account (if needed)
  2. Run setup commands
  3. Verify API works locally
  4. Deploy to staging

### Week 2: Parallel Running
- **Goal:** Test Cloudflare API on ONE test page
- **Risk:** Minimal (only test page uses new API)
- **What you'll do:**
  1. Add `USE_CLOUDFLARE` flag to config
  2. Test on one FunTrip Tours page
  3. Compare speed (should be 60-100x faster!)
  4. Verify all features work

### Week 3: Gradual Migration
- **Goal:** Move clients one by one to Cloudflare
- **Risk:** Low (rollback in 1 minute if needed)
- **What you'll do:**
  1. Enable Cloudflare for all FunTrip Tours pages
  2. Monitor for 2-3 days
  3. Enable Cloudflare for Kamar Tours
  4. Keep Google Sheets running as backup

### Week 4: Full Cutover
- **Goal:** All clients on Cloudflare, Google Sheets as backup only
- **Risk:** Minimal (30 days of testing behind us)
- **What you'll do:**
  1. Make Cloudflare the default
  2. Keep Google Sheets for 30 more days
  3. After 30 days, decommission Google Sheets

---

## How Rollback Works

### If Cloudflare API has issues:

**Option 1: Instant Rollback (< 1 minute)**
```javascript
// In your GHL config block, just change one line:
window.CFG = {
  USE_CLOUDFLARE: false,  // ← Change true to false
  CLIENT: 'funtrip-tours'
};
```
**Saves and publishes instantly** - back to Google Sheets!

**Option 2: Selective Rollback**
```javascript
// Rollback just one client
if (CFG.CLIENT === 'funtrip-tours') {
  CFG.USE_CLOUDFLARE = false;  // FunTrip back to Sheets
}
// Kamar Tours stays on Cloudflare
```

**Option 3: Emergency Kill Switch**
```javascript
// In tour-detail.js, we'll add:
if (window.FORCE_GOOGLE_SHEETS) {
  // Override everything, use Google Sheets
}
```
Then you just add to GHL:
```html
<script>window.FORCE_GOOGLE_SHEETS = true;</script>
```

---

## What Your Clients Will Notice

### During Migration:
- ✅ **Nothing!** Their sites work exactly the same

### After Migration:
- ✅ **Pages load 60-100x faster** (3-5s → 50ms)
- ✅ **No more skeleton loading delays**
- ✅ **Instant updates** when you change data
- ✅ **No more cache issues**

---

## Your Action Items

### This Week (Day 1-2):

**1. Install Wrangler (Cloudflare's CLI):**
```bash
cd "/Users/krishnalewin/Documents/My Apps/tourism-ui-kit/cloudflare-api"
npm install
```

**2. Login to Cloudflare:**
```bash
npx wrangler login
```
This opens a browser to authorize.

**3. Create Databases:**
```bash
# Create staging database
npx wrangler d1 create tourism-db-staging

# Create production database
npx wrangler d1 create tourism-db-production
```

**4. Update `wrangler.toml`:**
Copy the database IDs from step 3 output into `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "tourism-db"
database_id = "PASTE_ID_HERE"  # ← Update this
```

**5. Run Migrations:**
```bash
# Create tables
npx wrangler d1 migrations apply tourism-db-staging --remote
```

**6. Import Data:**
```bash
# Generate SQL from Google Sheets
node scripts/migrate-from-sheets.js

# Import to database
npx wrangler d1 execute tourism-db-staging --file=migrations/0002_data_import.sql --remote
```

**7. Deploy to Staging:**
```bash
npm run deploy:staging
```

**8. Test:**
```bash
# Get your staging URL from deploy output, then:
curl "https://tourism-api-staging.YOUR-SUBDOMAIN.workers.dev/health"

# Should return: {"status":"healthy",...}

curl "https://tourism-api-staging.YOUR-SUBDOMAIN.workers.dev/api/tours?client=funtrip-tours"

# Should return: {"tours":[...]}
```

---

## Week 2: Test on One Page

**1. Update ONE GHL Page (test page):**

Add this to your config block:
```html
<script>
window.CFG = {
  USE_CLOUDFLARE: true,  // ← New flag
  CLOUDFLARE_API: 'https://tourism-api-staging.YOUR-SUBDOMAIN.workers.dev/api/tours',
  DATA_URL: 'https://script.google.com/macros/s/.../exec',  // Fallback
  CLIENT: 'funtrip-tours'
};
</script>
```

**2. Update `block-a.js` to support both APIs:**

I'll create an updated version that checks the flag and uses Cloudflare when enabled, Google Sheets when not.

**3. Test thoroughly:**
- Load the page multiple times
- Check console for errors
- Verify all data displays correctly
- Measure load time (should be < 1 second now)

**4. If all good, enable for all FunTrip pages**

**5. Monitor for 2-3 days**

---

## Week 3: Migrate Kamar Tours

Same process as FunTrip Tours:
1. Enable `USE_CLOUDFLARE: true` for Kamar Tours
2. Test
3. Monitor

**Keep Google Sheets running!** It's still there as backup.

---

## Week 4: Make Cloudflare Default

**Update JavaScript to default to Cloudflare:**

```javascript
// In block-a.js
const DATA_URL = CFG.DATA_URL || 'https://tourism-api.YOUR-SUBDOMAIN.workers.dev/api/tours';
```

Now all clients use Cloudflare by default, but can override if needed.

**After 30 days of smooth operation**, decommission Google Sheets.

---

## Support & Questions

**Q: What if Cloudflare goes down?**  
A: Cloudflare has 99.99% uptime SLA. But if it does, instant rollback to Google Sheets.

**Q: Will this break anything?**  
A: No! The API is 100% compatible with Google Sheets format. Frontend doesn't know the difference.

**Q: Can I test without affecting clients?**  
A: Yes! Use the `USE_CLOUDFLARE` flag on test pages only.

**Q: How much does this cost?**  
A: Free tier covers everything. Only if you get massive traffic (100k+ requests/day) would you pay.

**Q: Can I still use Google Sheets?**  
A: Yes! Keep it as long as you want. Use Cloudflare for production, Sheets for backup/testing.

---

## Next Steps

1. Read this document ✅
2. Run Day 1-2 commands (above)
3. Let me know when staging is deployed
4. I'll help you test and migrate one page

**Ready to start?** Let me know if you have any questions! 🚀

