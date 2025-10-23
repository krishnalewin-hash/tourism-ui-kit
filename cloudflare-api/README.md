# Tourism UI Kit - Cloudflare API

Fast, scalable API for tour management built on Cloudflare Workers + D1.

## 🚀 Zero-Downtime Migration Plan

### Phase 1: Setup & Testing (Week 1)

**Day 1-2: Infrastructure**
```bash
# Install dependencies
npm install

# Login to Cloudflare (if not already)
npx wrangler login

# Create D1 databases
npx wrangler d1 create tourism-db-staging
npx wrangler d1 create tourism-db-production

# Update wrangler.toml with database IDs (printed above)

# Run migrations
npx wrangler d1 migrations apply tourism-db-staging
```

**Day 3-4: Data Migration**
```bash
# Generate migration SQL from Google Sheets
node scripts/migrate-from-sheets.js

# Review generated SQL
cat migrations/0002_data_import.sql

# Import data to staging
npx wrangler d1 execute tourism-db-staging --file=migrations/0002_data_import.sql

# Verify data
npx wrangler d1 execute tourism-db-staging --command="SELECT COUNT(*) FROM tours"
```

**Day 5-7: Testing**
```bash
# Deploy to staging
npm run deploy:staging

# Test endpoints
curl https://tourism-api-staging.your-subdomain.workers.dev/health
curl "https://tourism-api-staging.your-subdomain.workers.dev/api/tours?client=funtrip-tours"
```

### Phase 2: Parallel Running (Week 2)

**Frontend supports BOTH APIs:**

```javascript
// In block-a.js
const DATA_URL = CFG.USE_CLOUDFLARE 
  ? 'https://tourism-api.your-subdomain.workers.dev/api/tours'
  : 'https://script.google.com/macros/s/.../exec';
```

**Test on a single page:**
```html
<script>
window.CFG = {
  USE_CLOUDFLARE: true,  // ← Enable Cloudflare API for testing
  CLIENT: 'funtrip-tours'
};
</script>
```

**Google Sheets stays active as fallback!**

### Phase 3: Gradual Migration (Week 3)

**Migrate clients one by one:**

1. **FunTrip Tours** (Day 1-2)
   - Enable Cloudflare on test page
   - Verify all data loads correctly
   - Check performance (should be 50ms vs 3-5s)
   - Enable for all pages

2. **Kamar Tours** (Day 3-4)
   - Same process
   - Monitor for issues

3. **Keep Google Sheets running** for 2 more weeks as backup

### Phase 4: Full Cutover (Week 4)

```javascript
// Default to Cloudflare for all clients
const DATA_URL = CFG.DATA_URL || 'https://tourism-api.your-subdomain.workers.dev/api/tours';
```

**Decommission Google Sheets after 30 days of successful operation.**

## 📊 API Endpoints

### Health Check
```bash
GET /health

Response:
{
  "status": "healthy",
  "timestamp": "2025-01-23T12:00:00Z",
  "version": "1.0.0",
  "database": "connected"
}
```

### Get All Tours
```bash
GET /api/tours?client=funtrip-tours

Response:
{
  "version": "2025-01-23T12:00:00Z",
  "client": "funtrip-tours",
  "tours": [...]
}
```

### Get Tour by Slug
```bash
GET /api/tours/blue-hole-adventure?client=funtrip-tours

Response:
{
  "version": "2025-01-23T12:00:00Z",
  "client": "funtrip-tours",
  "tours": [{...}]
}
```

**API is 100% compatible with Google Sheets format!** No frontend changes needed.

## 🔧 Development

```bash
# Install
npm install

# Run locally
npm run dev

# Test locally
curl http://localhost:8787/health

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

## 📦 Database Schema

See `migrations/0001_initial_schema.sql` for full schema.

**Key tables:**
- `clients` - Client accounts (funtrip-tours, kamar-tours, etc.)
- `tours` - Tour listings

## 🎯 Performance

**Current (Google Sheets):**
- Response time: 3-5 seconds
- Cold start: 5-10 seconds
- Cache: 7 days (jsDelivr)

**New (Cloudflare):**
- Response time: 30-50ms (60-100x faster!)
- No cold starts
- Cache: 5 minutes (configurable)
- Global edge network

## 🔒 Security

- CORS enabled for allowed domains
- Row-level security (clients only see their data)
- API keys for admin access (coming in Phase 2)

## 📝 Rollback Plan

If anything goes wrong:

1. **Immediate rollback** (< 1 minute):
   ```javascript
   window.CFG.USE_CLOUDFLARE = false;  // Back to Google Sheets
   ```

2. **No data loss** - Google Sheets stays active during migration

3. **Cloudflare stays available** for future attempts

## 🆘 Support

Questions? Issues? Contact Krishna.

## 📋 Next Steps

After API is stable:
1. Build admin panel (Phase 2)
2. Add booking management (Phase 3)
3. Migrate WiPay integration (Phase 4)
