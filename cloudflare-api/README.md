# Tourism API - Cloudflare Workers

Modern, fast API backend for tourism data using Cloudflare Workers + D1 database.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd cloudflare-api
npm install
```

### 2. Create D1 Databases
```bash
# Create staging database
wrangler d1 create tourism-db-staging

# Create production database
wrangler d1 create tourism-db-production
```

Copy the database IDs from the output and update `wrangler.toml`.

### 3. Run Migrations
```bash
# Run schema migration on staging
wrangler d1 execute tourism-db-staging --file=migrations/0001_initial_schema.sql

# Generate seed data from Google Sheets
npm run migrate

# Import seed data
wrangler d1 execute tourism-db-staging --file=migrations/0002_seed_data.sql
```

### 4. Test Locally
```bash
npm run dev
```

Visit `http://localhost:8787/health` to verify.

### 5. Deploy
```bash
# Deploy to staging
npm run deploy:staging

# Test staging
curl https://tourism-api-staging.YOUR-SUBDOMAIN.workers.dev/health

# Deploy to production
npm run deploy:prod
```

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Get All Tours
```
GET /api/tours?client=kamar-tours
```

### Get Single Tour
```
GET /api/tours/blue-hole-secret-falls-adventure?client=kamar-tours
```

## 🔄 Data Migration

The migration script pulls data from Google Sheets and generates SQL:

```bash
npm run migrate
```

This creates `migrations/0002_seed_data.sql` which you can execute against D1.

## 🏗️ Project Structure

```
cloudflare-api/
├── src/
│   ├── index.js           # Worker entry point
│   ├── router.js          # Request routing
│   ├── cors.js            # CORS handling
│   └── handlers/
│       ├── health.js      # Health check
│       └── tours.js       # Tours API
├── migrations/
│   ├── 0001_initial_schema.sql
│   └── 0002_seed_data.sql (generated)
├── scripts/
│   └── migrate-from-sheets.js
├── package.json
└── wrangler.toml
```

## 🔧 Configuration

Edit `wrangler.toml` to configure your Worker:
- Database bindings
- Environment variables
- Custom domains

## 📊 Performance

- **Global edge network**: Sub-50ms responses worldwide
- **D1 caching**: Built-in SQLite performance
- **CDN caching**: 5-minute cache + stale-while-revalidate
- **Zero cold starts**: Always-on Workers

## 🔐 Security

- CORS enabled for all origins
- SQL injection protection via prepared statements
- Client-based data isolation
- Rate limiting (via Cloudflare dashboard)

## 📝 Notes

- D1 is SQLite-compatible
- Max 25MB database size (free tier)
- 5GB database size (paid tier)
- See [D1 docs](https://developers.cloudflare.com/d1/) for limits
