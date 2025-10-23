# FunTrip Tours Data Format Fix

## Problem
The Google Sheets data is returning highlights, inclusions, and other fields as **strings containing JSON** instead of actual arrays.

Current format:
```json
"highlights": "[\"Adventure seekers\", \"Couples\", \"Nature lovers\"],"
```

Should be:
```json
"highlights": ["Adventure seekers", "Couples", "Nature lovers"]
```

## Solution: Update Google Apps Script

Add this function to your Google Apps Script to parse JSON string fields:

```javascript
function parseJSONField(value) {
  if (!value || typeof value !== 'string') return value;
  
  // Remove trailing comma if present
  const cleaned = value.trim().replace(/,\s*$/, '');
  
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (e) {
    // If parsing fails, return original value
    return value;
  }
}

function doGet(e) {
  const client = e.parameter.client || 'funtrip-tours';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(client);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({error: 'Client not found'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const tours = rows.map(row => {
    const tour = {};
    headers.forEach((header, i) => {
      const value = row[i];
      const fieldName = header.toLowerCase().replace(/\s+/g, '_');
      
      // Parse JSON fields
      if (['highlights', 'inclusions', 'exclusions', 'itinerary', 'faqs', 'tags', 'gallery'].includes(fieldName)) {
        tour[fieldName] = parseJSONField(value);
      } else {
        tour[fieldName] = value;
      }
    });
    return tour;
  }).filter(tour => tour.slug); // Only include rows with slugs
  
  const response = {
    version: new Date().toISOString(),
    client: client,
    tours: tours
  };
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Fields to Fix

These fields should be JSON arrays in your spreadsheet:
- **highlights**: `["Highlight 1", "Highlight 2", "Highlight 3"]`
- **inclusions**: `["Inclusion 1", "Inclusion 2"]`
- **exclusions**: `["Exclusion 1", "Exclusion 2"]`
- **tags**: `["Tag1", "Tag2", "Tag3"]`
- **gallery**: `["url1.jpg", "url2.jpg"]`
- **itinerary**: `[{"title": "Step 1", "description": "..."}, ...]`
- **faqs**: `[{"question": "Q1?", "answer": "A1"}, ...]`

## How to Format in Google Sheets

In each cell, enter the data as a valid JSON array:

**For highlights (cell format):**
```
["Adventure seekers", "Couples", "Nature lovers"]
```

**For inclusions:**
```
["Private transportation", "entry fees", "licensed tour guide", "complimentary cold Red Stripe beer", "bottled water"]
```

**Important:**
- Use double quotes `"` for JSON strings
- No trailing comma
- Square brackets `[]` for arrays
- Curly braces `{}` for objects (itinerary, FAQs)

