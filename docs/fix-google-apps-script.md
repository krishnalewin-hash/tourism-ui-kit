# Fix Google Apps Script for FunTrip Tours

## The Problem

Your Google Sheets has properly formatted JSON arrays:
```
["Adventure seekers", "Couples", "Nature lovers"]
```

But your Google Apps Script is converting them to **strings** when returning the API response:
```json
"highlights": "[\"Adventure seekers\", \"Couples\", \"Nature lovers\"],"
```

## The Solution

Update your Google Apps Script to properly parse JSON fields. Here's the complete updated code:

```javascript
function doGet(e) {
  const client = e.parameter.client || 'funtrip-tours';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(client);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'Client not found',
      client: client
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  // Fields that should be parsed as JSON
  const JSON_FIELDS = ['highlights', 'inclusions', 'exclusions', 'gallery', 'tags', 'itinerary', 'faqs'];
  
  const tours = rows.map(row => {
    const tour = {};
    
    headers.forEach((header, index) => {
      const fieldName = header.toLowerCase().replace(/\s+/g, '_');
      let value = row[index];
      
      // Skip empty rows
      if (index === 0 && !value) return;
      
      // Parse JSON fields
      if (JSON_FIELDS.includes(fieldName)) {
        if (typeof value === 'string' && value.trim()) {
          try {
            // Remove trailing comma and parse
            const cleaned = value.trim().replace(/,\s*$/, '');
            value = JSON.parse(cleaned);
          } catch (err) {
            Logger.log('Failed to parse ' + fieldName + ': ' + value);
            value = null;
          }
        } else {
          value = null;
        }
      }
      
      tour[fieldName] = value;
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

## Key Changes:

1. **Define JSON fields** - List all fields that should be parsed as JSON arrays
2. **Parse JSON strings** - Use `JSON.parse()` to convert strings to proper arrays
3. **Remove trailing commas** - Clean the string before parsing
4. **Error handling** - Log parsing errors and set value to null if parsing fails

## How to Update:

1. Go to your Google Apps Script editor
2. Replace your existing `doGet` function with the code above
3. Save the script
4. Deploy → Manage deployments → Edit → New version
5. Click "Deploy"
6. Test the API to verify arrays are returned properly

## Verify It Works:

After updating, test the API:

```bash
curl "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?client=funtrip-tours" | python3 -m json.tool
```

Look for:
```json
"highlights": ["Adventure seekers", "Couples", "Nature lovers"]
```

NOT:
```json
"highlights": "[\"Adventure seekers\", \"Couples\", \"Nature lovers\"],"
```

## Note About Trailing Commas

Make sure your spreadsheet cells don't have trailing commas:

❌ BAD: `["Adventure seekers", "Couples", "Nature lovers"],`  
✅ GOOD: `["Adventure seekers", "Couples", "Nature lovers"]`

The script will clean trailing commas, but it's better to remove them from the source data.

