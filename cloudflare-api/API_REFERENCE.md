# Tourism Platform API Reference

**Base URL:** `https://tourism-api-production.krishna-0a3.workers.dev`

**Admin API Key:** Set via `wrangler secret put ADMIN_API_KEY`

---

## 📖 Table of Contents

1. [Public Endpoints](#public-endpoints)
2. [Admin Client Management](#admin-client-management)
3. [Admin Tour Management](#admin-tour-management)
4. [Admin Sync Tools](#admin-sync-tools)
5. [Authentication](#authentication)
6. [Error Responses](#error-responses)
7. [Examples](#examples)

---

## Public Endpoints

### Health Check
**GET** `/health`

Check API status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-23T20:37:58.002Z",
  "environment": "production"
}
```

---

### List All Tours
**GET** `/api/tours?client={clientName}`

Fetch all active tours for a specific client.

**Query Parameters:**
- `client` (required): Client name (e.g., `kamar-tours`)
- `v` (optional): Version timestamp for cache control

**Response:**
```json
{
  "version": "2025-10-23T20:00:00.000Z",
  "client": "kamar-tours",
  "tours": [
    {
      "id": 1,
      "slug": "blue-hole-adventure",
      "name": "Blue Hole Adventure",
      "excerpt": "Explore the famous Blue Hole...",
      "from_price": 95.00,
      "image": "https://...",
      "gallery": ["https://..."],
      "highlights": ["Adventure seekers", "Nature lovers"],
      "status": "active",
      ...
    }
  ]
}
```

---

### Get Single Tour by Slug
**GET** `/api/tours/{slug}?client={clientName}`

Fetch a specific tour by its slug.

**Path Parameters:**
- `slug`: Tour slug (e.g., `blue-hole-adventure`)

**Query Parameters:**
- `client` (required): Client name
- `v` (optional): Version timestamp

**Response:**
```json
{
  "version": "2025-10-23T20:00:00.000Z",
  "tour": {
    "id": 1,
    "slug": "blue-hole-adventure",
    "name": "Blue Hole Adventure",
    ...
  }
}
```

**Error (404):**
```json
{
  "error": "Tour not found"
}
```

---

## Admin Client Management

All admin endpoints require the `Authorization` header.

### List Clients
**GET** `/admin/clients`

Get all clients.

**Headers:**
```
Authorization: YOUR_API_KEY
```

**Response:**
```json
{
  "success": true,
  "clients": [
    {
      "id": 1,
      "name": "kamar-tours",
      "display_name": "Kamar Tours Jamaica",
      "status": "active",
      "created_at": "2025-10-23 19:45:52",
      "updated_at": "2025-10-23 19:45:52"
    }
  ]
}
```

---

### Get Single Client
**GET** `/admin/clients/{id}`

Get a specific client with tour count.

**Response:**
```json
{
  "success": true,
  "client": {
    "id": 1,
    "name": "kamar-tours",
    "display_name": "Kamar Tours Jamaica",
    "status": "active",
    "tour_count": 6,
    "created_at": "2025-10-23 19:45:52",
    "updated_at": "2025-10-23 19:45:52"
  }
}
```

---

### Create Client
**POST** `/admin/clients`

Create a new client.

**Request Body:**
```json
{
  "name": "new-client",           // Required, unique
  "display_name": "New Client Co", // Optional
  "status": "active"               // Optional, default: "active"
}
```

**Response (201):**
```json
{
  "success": true,
  "client": {
    "id": 3,
    "name": "new-client",
    "display_name": "New Client Co",
    "status": "active",
    "created_at": "2025-10-23 20:38:19",
    "updated_at": "2025-10-23 20:38:19"
  }
}
```

**Error (409) - Duplicate:**
```json
{
  "error": "Client already exists"
}
```

---

### Update Client
**PUT** `/admin/clients/{id}`

Update an existing client.

**Request Body:**
```json
{
  "name": "updated-name",          // Optional
  "display_name": "Updated Name",  // Optional
  "status": "inactive"             // Optional
}
```

**Response:**
```json
{
  "success": true,
  "client": {
    "id": 1,
    "name": "updated-name",
    "display_name": "Updated Name",
    "status": "inactive",
    "updated_at": "2025-10-23 20:40:00"
  }
}
```

---

### Delete Client
**DELETE** `/admin/clients/{id}`

Delete a client and all associated tours.

**Response:**
```json
{
  "success": true,
  "message": "Client \"kamar-tours\" and all associated tours deleted"
}
```

---

## Admin Tour Management

### List Tours
**GET** `/admin/tours?client_id={id}&status={status}&limit={limit}&offset={offset}`

List all tours with optional filters.

**Query Parameters:**
- `client_id` (optional): Filter by client ID
- `status` (optional): Filter by status (`active`, `inactive`, `all`). Default: `active`
- `limit` (optional): Results per page. Default: `100`
- `offset` (optional): Pagination offset. Default: `0`

**Response:**
```json
{
  "success": true,
  "tours": [
    {
      "id": 1,
      "client_id": 1,
      "slug": "blue-hole-adventure",
      "name": "Blue Hole Adventure",
      "excerpt": "Explore the famous Blue Hole...",
      "from_price": 95.00,
      "gallery": ["https://..."],
      "highlights": ["Adventure seekers"],
      "itinerary": [...],
      "inclusions": [...],
      "status": "active",
      ...
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "count": 6
  }
}
```

---

### Get Single Tour
**GET** `/admin/tours/{id}`

Get a specific tour with all details.

**Response:**
```json
{
  "success": true,
  "tour": {
    "id": 1,
    "client_id": 1,
    "slug": "blue-hole-adventure",
    "name": "Blue Hole Adventure",
    "gallery": ["https://..."],
    "highlights": ["Adventure seekers"],
    ...
  }
}
```

---

### Create Tour
**POST** `/admin/tours`

Create a new tour.

**Request Body:**
```json
{
  "client_id": 1,                      // Required
  "slug": "new-tour",                  // Required, unique per client
  "name": "New Tour",                  // Required
  "excerpt": "Short description",      // Optional
  "description_html": "<p>...</p>",    // Optional
  "image": "https://...",              // Optional
  "gallery": ["https://..."],          // Optional, array
  "location": "Ocho Rios, Jamaica",    // Optional
  "type": "Adventure",                 // Optional
  "duration": "3 Hours",               // Optional
  "duration_minutes": 180,             // Optional
  "pricing_type": "per-person",        // Optional
  "from_price": 95.00,                 // Optional
  "highlights": ["Item 1", "Item 2"],  // Optional, array
  "itinerary": ["Step 1", "Step 2"],   // Optional, array
  "inclusions": ["Inc 1", "Inc 2"],    // Optional, array
  "exclusions": ["Exc 1", "Exc 2"],    // Optional, array
  "faqs": [                            // Optional, array of objects
    {"q": "Question?", "a": "Answer"}
  ],
  "tags": ["tag1", "tag2"],            // Optional, array
  "status": "active"                   // Optional, default: "active"
}
```

**Response (201):**
```json
{
  "success": true,
  "tour": {
    "id": 40,
    "client_id": 1,
    "slug": "new-tour",
    "name": "New Tour",
    ...
  }
}
```

**Errors:**
- `400` - Missing required fields (`client_id`, `slug`, `name`)
- `404` - Client not found
- `409` - Tour with slug already exists for this client

---

### Update Tour
**PUT** `/admin/tours/{id}`

Update an existing tour. Only include fields you want to change.

**Request Body:**
```json
{
  "name": "Updated Tour Name",
  "from_price": 120.00,
  "status": "inactive"
}
```

**Response:**
```json
{
  "success": true,
  "tour": {
    "id": 1,
    "name": "Updated Tour Name",
    "from_price": 120.00,
    "updated_at": "2025-10-23 20:45:00",
    ...
  }
}
```

---

### Delete Tour
**DELETE** `/admin/tours/{id}`

Delete a tour.

**Response:**
```json
{
  "success": true,
  "message": "Tour \"Blue Hole Adventure\" deleted"
}
```

---

## Admin Sync Tools

### Get Sync Status
**GET** `/admin/sync/status`

Get database statistics.

**Response:**
```json
{
  "success": true,
  "totals": {
    "clients": 2,
    "tours": 39
  },
  "clients": [
    {
      "id": 1,
      "name": "kamar-tours",
      "display_name": "Kamar Tours Jamaica",
      "tour_count": 6
    }
  ]
}
```

---

### Sync from Google Sheets
**POST** `/admin/sync/from-sheets`

One-time migration to import data from Google Sheets into D1.

**Request Body:**
```json
{
  "client_name": "kamar-tours",
  "sheets_url": "https://script.google.com/macros/s/.../exec?client=kamar-tours"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sync completed",
  "stats": {
    "total": 10,
    "imported": 5,
    "updated": 5,
    "errors": 0
  }
}
```

**Process:**
1. Creates client if it doesn't exist
2. Fetches tours from Google Sheets
3. Inserts new tours or updates existing ones (matched by `slug`)
4. Returns summary statistics

---

## Authentication

All `/admin/*` endpoints require authentication.

### Header Format

**Option 1: Direct token**
```
Authorization: YOUR_API_KEY
```

**Option 2: Bearer token**
```
Authorization: Bearer YOUR_API_KEY
```

### Setting the API Key

```bash
npx wrangler secret put ADMIN_API_KEY
# Enter your secure API key when prompted
```

### Error Responses

**401 - Missing Authorization**
```json
{
  "error": "Missing Authorization header"
}
```

**403 - Invalid API Key**
```json
{
  "error": "Invalid API key"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error description",
  "message": "Optional detailed message"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (missing auth)
- `403` - Forbidden (invalid auth)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

## Examples

### cURL Examples

**Create a tour:**
```bash
curl -X POST https://tourism-api-production.krishna-0a3.workers.dev/admin/tours \
  -H "Authorization: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "slug": "sunset-cruise",
    "name": "Sunset Cruise",
    "excerpt": "Enjoy a beautiful sunset on the water",
    "from_price": 75.00,
    "highlights": ["Romantic", "Scenic views", "Drinks included"],
    "status": "active"
  }'
```

**Update a tour:**
```bash
curl -X PUT https://tourism-api-production.krishna-0a3.workers.dev/admin/tours/40 \
  -H "Authorization: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from_price": 85.00,
    "highlights": ["Romantic", "Scenic views", "Drinks & snacks included"]
  }'
```

**Fetch public tours:**
```bash
curl "https://tourism-api-production.krishna-0a3.workers.dev/api/tours?client=kamar-tours"
```

---

### JavaScript (Fetch API)

```javascript
const API_URL = 'https://tourism-api-production.krishna-0a3.workers.dev';
const API_KEY = 'YOUR_API_KEY';

// List clients
async function listClients() {
  const response = await fetch(`${API_URL}/admin/clients`, {
    headers: {
      'Authorization': API_KEY
    }
  });
  const data = await response.json();
  return data.clients;
}

// Create a tour
async function createTour(tourData) {
  const response = await fetch(`${API_URL}/admin/tours`, {
    method: 'POST',
    headers: {
      'Authorization': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(tourData)
  });
  return response.json();
}

// Get public tours
async function getPublicTours(clientName) {
  const response = await fetch(`${API_URL}/api/tours?client=${clientName}`);
  return response.json();
}
```

---

## Rate Limits

Currently, no rate limits are enforced. Consider implementing rate limiting for production use.

---

## Support

- **Production API:** `https://tourism-api-production.krishna-0a3.workers.dev`
- **Health Check:** `/health`
- **Admin Dashboard:** Use the web UI in `admin-ui/index.html`

For issues, check the Cloudflare Workers logs:
```bash
npx wrangler tail
```

