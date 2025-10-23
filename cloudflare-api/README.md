# Tourism Platform API - Admin Backend

## Overview

This is the Cloudflare Workers API backend for the Tourism Platform, now with **full admin capabilities** to manage clients and tours directly via API or web dashboard.

## Features

✅ **Public API** - Serve tour data to websites (same as before)  
✅ **Admin API** - CRUD operations for clients and tours  
✅ **Google Sheets Sync** - One-time migration tool  
✅ **Admin Dashboard** - Web UI to manage everything  
✅ **Authentication** - API key-based auth for admin endpoints  

---

## 🚀 Quick Start

### 1. Deploy to Cloudflare

```bash
cd cloudflare-api

# Get your database ID
npx wrangler d1 list

# Update wrangler.toml with your database_id

# Deploy the worker
npx wrangler deploy
```

### 2. Set Admin API Key

```bash
npx wrangler secret put ADMIN_API_KEY
# Enter a strong password when prompted
```

### 3. Open Admin Dashboard

1. Open `admin-ui/index.html` in your browser (or host it on Cloudflare Pages)
2. Enter:
   - **API URL**: `https://tourism-api-production.krishna-0a3.workers.dev`
   - **API Key**: The key you set in step 2
3. Click "Save Configuration"

---

## 📚 API Endpoints

### Public Endpoints (No Auth Required)

```
GET  /api/tours?client={name}          # List all tours for a client
GET  /api/tours/{slug}?client={name}   # Get single tour by slug
GET  /health                           # Health check
```

### Admin Endpoints (Require Authorization Header)

#### Client Management
```
GET    /admin/clients           # List all clients
GET    /admin/clients/:id       # Get single client
POST   /admin/clients           # Create client
PUT    /admin/clients/:id       # Update client
DELETE /admin/clients/:id       # Delete client
```

#### Tour Management
```
GET    /admin/tours?client_id={id}  # List tours (optional filter)
GET    /admin/tours/:id              # Get single tour
POST   /admin/tours                  # Create tour
PUT    /admin/tours/:id              # Update tour
DELETE /admin/tours/:id              # Delete tour
```

#### Sync Tools
```
GET    /admin/sync/status            # Get database stats
POST   /admin/sync/from-sheets       # Import from Google Sheets
```

---

## 🔐 Authentication

All `/admin/*` endpoints require an `Authorization` header:

```bash
curl -H "Authorization: YOUR_API_KEY" \
  https://your-worker.workers.dev/admin/clients
```

Or with Bearer token format:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://your-worker.workers.dev/admin/clients
```

---

## 🔄 Migrating from Google Sheets

### One-Time Migration via API

```bash
curl -X POST https://your-worker.workers.dev/admin/sync/from-sheets \
  -H "Authorization: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "kamar-tours",
    "sheets_url": "https://script.google.com/macros/s/.../exec?client=kamar-tours"
  }'
```

This will:
1. Create the client if it doesn't exist
2. Fetch all tours from Google Sheets
3. Import/update tours in D1
4. Return a summary of imported/updated tours

### Manual Migration via Script

```bash
cd cloudflare-api/scripts
node migrate-from-sheets.js > migration.sql

# Apply to staging
npx wrangler d1 execute tourism-db-staging --file=migration.sql

# Apply to production
npx wrangler d1 execute tourism-db-production --file=migration.sql
```

---

## 🎨 Admin Dashboard

The admin dashboard is a single-page application in `admin-ui/`:

- **index.html** - Dashboard UI
- **admin.js** - Dashboard logic

### Hosting Options

1. **Local**: Open `index.html` directly in browser
2. **Cloudflare Pages**: 
   ```bash
   cd admin-ui
   npx wrangler pages deploy . --project-name=tourism-admin
   ```
3. **Any static host**: Upload the `admin-ui` folder

---

## 📊 Database Schema

### Clients Table
```sql
- id (INTEGER PRIMARY KEY)
- name (TEXT UNIQUE) - e.g., "kamar-tours"
- display_name (TEXT) - e.g., "Kamar Tours Jamaica"
- status (TEXT) - "active" or "inactive"
- created_at, updated_at (DATETIME)
```

### Tours Table
```sql
- id (INTEGER PRIMARY KEY)
- client_id (INTEGER FOREIGN KEY)
- slug (TEXT) - e.g., "blue-hole-adventure"
- name, excerpt, description_html (TEXT)
- image, gallery (TEXT/JSON)
- location, type, duration (TEXT)
- duration_minutes (INTEGER)
- pricing_type (TEXT)
- from_price (REAL)
- highlights, itinerary, inclusions, exclusions, faqs, tags (JSON)
- status (TEXT) - "active" or "inactive"
- created_at, updated_at (DATETIME)
```

---

## 🔧 Development

### Local Development

```bash
npm run dev
```

This starts a local server at `http://localhost:8787`

### Tail Logs

```bash
npm run tail
```

### Test Endpoints

```bash
# Health check
curl http://localhost:8787/health

# List clients (requires auth)
curl -H "Authorization: admin-key-change-me-in-production" \
  http://localhost:8787/admin/clients
```

---

## 🚨 Security Notes

1. **Change the default API key** immediately after deployment
2. **Use environment-specific keys** (staging vs production)
3. **Admin dashboard should be hosted on HTTPS** (not `file://`)
4. **Consider adding rate limiting** for production
5. **Backup your D1 database regularly**

---

## 📝 Next Steps

### Phase 2: Client Portal
- [ ] Client login system
- [ ] Each client manages their own tours
- [ ] Image uploads to R2
- [ ] Analytics dashboard

### Future Enhancements
- [ ] Batch operations
- [ ] Audit logs
- [ ] Webhooks for tour updates
- [ ] GraphQL API
- [ ] Booking system integration

---

## 🐛 Troubleshooting

### "Missing Authorization header"
- Make sure you're sending the `Authorization` header
- Check that you're using the correct API key

### "Client not found"
- Verify the client exists: `GET /admin/clients`
- Create client first before adding tours

### Database errors
- Check your database_id in `wrangler.toml`
- Verify the schema is applied: `npx wrangler d1 execute DB --command "SELECT * FROM clients"`

---

## 📞 Support

For issues or questions, check the main project README or contact the development team.
