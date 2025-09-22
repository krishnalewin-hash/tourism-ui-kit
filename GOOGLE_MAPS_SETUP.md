# Google Maps API Setup for Quote Calculator

## Quick Setup (For Testing)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create/Select Project**
   - Create new project or select existing one

3. **Enable APIs**
   - Go to "APIs & Services" → "Library"
   - Enable these APIs:
     - Maps JavaScript API
     - Directions API
     - Places API (if using form enhancer)

4. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"

5. **Configure API Key (Choose ONE method)**

### Method A: No Restrictions (Easiest for testing)
- Click on your API key
- Under "API restrictions" → "Don't restrict key"
- Under "Application restrictions" → "None"
- **⚠️ Important**: This is for testing only - restrict in production!

### Method B: Domain Restrictions (Production)
- Under "Application restrictions" → "HTTP referrers (web sites)"
- Add your domains:
  ```
  yoursite.com/*
  *.yoursite.com/*
  localhost:*/*
  ```

### Method C: CDN Embedding (Best for widgets)
- Use the CDN approach - loads from jsdelivr.net
- Add these referrers:
  ```
  yoursite.com/*
  *.yoursite.com/*
  cdn.jsdelivr.net/*
  ```

## Embedding Methods

### Method 1: Direct CDN Embed
```html
<div id="quote-calc"></div>
<script>
window.CFG = { GMAPS_KEY: "YOUR_API_KEY" };
window.LEAD_DATA = {
    pickup_location: "MBJ Airport",
    dropoff_location: "Negril",
    passengers: "3"
};
</script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@main/dist/quote-calc.css">
<script src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@main/dist/quote-calc.js"></script>
```

### Method 2: URL Parameters
Redirect users to: `yoursite.com/quote?pickup_location=MBJ&dropoff_location=Negril&passengers=3`

### Method 3: SessionStorage (Form Integration)
```javascript
// After form submission, set data and redirect:
sessionStorage.setItem('lead:pickup_location', pickupValue);
sessionStorage.setItem('lead:dropoff_location', dropoffValue);
sessionStorage.setItem('lead:passengers', passengersValue);
window.location.href = '/quote';
```

## Troubleshooting

### White Screen Issues:
1. **Check browser console** for specific errors
2. **Verify API key** has correct permissions
3. **Check billing** is enabled on Google Cloud
4. **Test with unrestricted key** first

### Domain Restriction Errors:
- Error: "This API key is not authorized for this domain"
- Solution: Add your domain to API key restrictions

### Billing Issues:
- Error: "This API project is not authorized to use this API"
- Solution: Enable billing account in Google Cloud

## Testing Your Setup

Use this test URL to verify everything works:
`https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@main/demo/embed-demo.html`

Replace the API key in the demo with yours to test.