# 📊 Complete Database Fields Guide

## What's Actually Stored in D1

**ALL tour data is stored in the database!** The simple dashboard form only shows basic fields for quick creation, but you can access/edit all fields via the API.

---

## 🗃️ Tours Table - Complete Schema

### **Basic Information**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | INTEGER | Auto | Unique tour ID |
| `client_id` | INTEGER | ✅ Yes | Link to client (1=Kamar, 2=FunTrip, etc.) |
| `slug` | TEXT | ✅ Yes | URL-friendly identifier (e.g., "blue-hole-adventure") |
| `name` | TEXT | ✅ Yes | Tour name (e.g., "Blue Hole Adventure") |
| `status` | TEXT | No | "active" or "inactive" (default: "active") |

### **Content Fields**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `excerpt` | TEXT | No | Short description (1-2 sentences) |
| `description_html` | TEXT | No | Full HTML description with formatting |
| `image` | TEXT | No | Main tour image URL |

### **Location & Duration**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `location` | TEXT | No | Location (e.g., "Ocho Rios, Jamaica") |
| `type` | TEXT | No | Tour type (e.g., "Adventure", "River", "Beach") |
| `duration` | TEXT | No | Human-readable duration (e.g., "3-4 Hours") |
| `duration_minutes` | INTEGER | No | Duration in minutes for calculations |

### **Pricing**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pricing_type` | TEXT | No | Pricing model (e.g., "per-person", "per-group") |
| `from_price` | REAL | No | Starting price (e.g., 95.00) |

### **Array/JSON Fields** (stored as JSON strings)
| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `gallery` | JSON | No | Array of image URLs | `["url1.jpg", "url2.jpg"]` |
| `highlights` | JSON | No | Array of highlight strings | `["Adventure", "Scenic", "Fun"]` |
| `itinerary` | JSON | No | Array of itinerary steps | `["Step 1", "Step 2", "Step 3"]` |
| `inclusions` | JSON | No | Array of what's included | `["Lunch", "Transport", "Guide"]` |
| `exclusions` | JSON | No | Array of what's excluded | `["Drinks", "Souvenirs"]` |
| `faqs` | JSON | No | Array of Q&A objects | `[{"q":"Question?","a":"Answer"}]` |
| `tags` | JSON | No | Array of tags | `["beach", "family-friendly", "popular"]` |

### **Timestamps** (Auto-generated)
| Field | Type | Description |
|-------|------|-------------|
| `created_at` | DATETIME | When tour was created |
| `updated_at` | DATETIME | When tour was last modified |

---

## 🎯 What's in the Simple Dashboard Form?

The basic form in `admin-ui/index.html` only includes these fields for **quick tour creation**:

✅ **Client** (dropdown)  
✅ **Slug**  
✅ **Name**  
✅ **Excerpt**  
✅ **From Price**  
✅ **Status**  

**Why only these?** For simplicity! Most users want to quickly create a tour and add details later.

---

## 📝 How to Set All Fields

### **Option 1: Via API (Full Control)**

Create a tour with **ALL fields**:

```bash
curl -X POST https://tourism-api-production.krishna-0a3.workers.dev/admin/tours \
  -H "Authorization: TourismAdmin2024!SecureKey" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "slug": "complete-tour-example",
    "name": "Complete Tour Example",
    "excerpt": "A fully detailed tour with all fields",
    "description_html": "<p>This is the <strong>full description</strong> with HTML formatting.</p>",
    "image": "https://example.com/main-image.jpg",
    "gallery": [
      "https://example.com/gallery1.jpg",
      "https://example.com/gallery2.jpg",
      "https://example.com/gallery3.jpg"
    ],
    "location": "Montego Bay, Jamaica",
    "type": "Adventure",
    "duration": "4-5 Hours",
    "duration_minutes": 270,
    "pricing_type": "per-person",
    "from_price": 120.00,
    "highlights": [
      "Professional guide",
      "All equipment included",
      "Scenic viewpoints",
      "Complimentary photos"
    ],
    "itinerary": [
      "Hotel pickup at 9:00 AM",
      "Safety briefing and equipment fitting",
      "Begin adventure tour",
      "Lunch break (included)",
      "Continue tour activities",
      "Return to hotel by 2:00 PM"
    ],
    "inclusions": [
      "Round-trip transportation",
      "Professional guide",
      "All equipment and gear",
      "Lunch and refreshments",
      "Entrance fees"
    ],
    "exclusions": [
      "Alcoholic beverages",
      "Gratuities",
      "Souvenirs",
      "Travel insurance"
    ],
    "faqs": [
      {
        "q": "Is this tour suitable for beginners?",
        "a": "Yes! No prior experience needed. Our guides provide full instruction."
      },
      {
        "q": "What should I bring?",
        "a": "Wear comfortable clothes, closed-toe shoes, sunscreen, and bring a camera."
      },
      {
        "q": "What is the cancellation policy?",
        "a": "Free cancellation up to 24 hours before the tour."
      }
    ],
    "tags": ["adventure", "outdoor", "family-friendly", "popular"],
    "status": "active"
  }'
```

### **Option 2: Dashboard then API**

1. **Create basic tour in dashboard** (quick!)
2. **Get the tour ID** from the response or list
3. **Update with full details via API:**

```bash
curl -X PUT https://tourism-api-production.krishna-0a3.workers.dev/admin/tours/40 \
  -H "Authorization: TourismAdmin2024!SecureKey" \
  -H "Content-Type: application/json" \
  -d '{
    "description_html": "<p>Full description...</p>",
    "gallery": ["url1.jpg", "url2.jpg"],
    "highlights": ["Highlight 1", "Highlight 2"],
    "itinerary": ["Step 1", "Step 2"],
    "inclusions": ["Inc 1", "Inc 2"],
    "exclusions": ["Exc 1", "Exc 2"],
    "faqs": [{"q": "Question?", "a": "Answer"}]
  }'
```

### **Option 3: Import from Google Sheets**

All your existing tours from Google Sheets **already have all fields populated**!

Check it:
```bash
curl -H "Authorization: TourismAdmin2024!SecureKey" \
  "https://tourism-api-production.krishna-0a3.workers.dev/admin/tours/1"
```

You'll see highlights, itinerary, inclusions, etc. are all there! ✅

---

## 🔍 Verify Your Data

### **Check a Full Tour Record**

```bash
# Get tour #1 (ATV Adventure from Kamar Tours)
curl -H "Authorization: TourismAdmin2024!SecureKey" \
  "https://tourism-api-production.krishna-0a3.workers.dev/admin/tours/3" | python3 -m json.tool
```

You'll see output like:
```json
{
  "success": true,
  "tour": {
    "id": 3,
    "client_id": 1,
    "slug": "atv-adventure",
    "name": "ATV Adventure",
    "excerpt": "Ride through rugged off‑road trails...",
    "description_html": "<p>The ATV Adventure takes you deep into Jamaica's hills...</p>",
    "image": "https://storage.googleapis.com/.../image.jpeg",
    "gallery": ["https://storage.googleapis.com/.../gallery1.jpeg"],
    "location": "Ocho Rios, Jamaica",
    "type": "River",
    "duration": "2 - 3 Hours (approx.)",
    "duration_minutes": 240,
    "pricing_type": null,
    "from_price": 195,
    "highlights": [
      "Guided off‑road ATV ride",
      "River splashes & scenic trails",
      "Safety briefing & gear provided",
      "Sightseeing & shopping add‑on"
    ],
    "itinerary": [
      "Pickup & safety briefing",
      "Guided ATV ride on country trails",
      "Photo/viewpoint stops",
      "Shopping stop (time permitting)",
      "Return transfer"
    ],
    "inclusions": [
      "Round‑trip transportation",
      "ATV, helmet & safety gear",
      "Professional guide"
    ],
    "exclusions": [
      "Food & drinks",
      "Gratuities",
      "Photos/video"
    ],
    "faqs": [
      {
        "q": "Do I need prior ATV experience?",
        "a": "No. Basic instruction is provided; guides set a comfortable pace."
      }
    ],
    "tags": ["atv", "adventure", "ocho rios", "off-road"],
    "status": "active",
    "created_at": "2025-10-23 19:45:52",
    "updated_at": "2025-10-23 19:45:52"
  }
}
```

**ALL fields are there!** ✅

---

## 🎨 Future Enhancement: Advanced Dashboard

The current dashboard is **intentionally simple** for Phase 1A. In Phase 1B or 2, we can add:

### **Enhanced Form Features**
- ✨ Rich text editor for `description_html`
- 📸 Image upload interface for `gallery`
- ➕ Dynamic form fields for arrays (highlights, itinerary, etc.)
- 📝 FAQ builder with add/remove buttons
- 🏷️ Tag selector/creator
- 🌐 WYSIWYG preview

### **For Now**
Use the dashboard for quick creation, then use the API or a tool like Postman for full field editing.

---

## 💡 Pro Workflow

**Best practice for now:**

1. **Dashboard:** Create basic tour (client, name, slug, price)
2. **API:** Add full details (highlights, itinerary, FAQs, etc.)
3. **Dashboard:** Quick edits (price changes, status toggle)
4. **API:** Complex updates (reordering itinerary, adding FAQs)

This gives you the best of both worlds! 🚀

---

## 📞 Quick Command Reference

```bash
# Create simple tour (dashboard-style)
POST /admin/tours
{
  "client_id": 1,
  "slug": "tour-slug",
  "name": "Tour Name",
  "excerpt": "Short description",
  "from_price": 99.00,
  "status": "active"
}

# Update with full details
PUT /admin/tours/:id
{
  "description_html": "<p>Full description</p>",
  "gallery": ["img1.jpg", "img2.jpg"],
  "highlights": ["Point 1", "Point 2"],
  "itinerary": ["Step 1", "Step 2"],
  "inclusions": ["Inc 1", "Inc 2"],
  "exclusions": ["Exc 1", "Exc 2"],
  "faqs": [{"q": "Q?", "a": "A!"}],
  "tags": ["tag1", "tag2"]
}

# View complete tour
GET /admin/tours/:id
```

---

## ✅ Summary

**Q: Are all fields stored in the database?**  
**A: YES!** All 20+ fields are stored in D1.

**Q: Why doesn't the dashboard show them all?**  
**A:** Simplicity for Phase 1A. Use the API for full control.

**Q: Are my migrated tours complete?**  
**A:** YES! Check them with `GET /admin/tours/:id` - they have highlights, itinerary, FAQs, everything!

**Q: Can I edit all fields?**  
**A:** YES! Use `PUT /admin/tours/:id` with any fields you want to change.

Your data is safe, complete, and fully accessible! 🎉

