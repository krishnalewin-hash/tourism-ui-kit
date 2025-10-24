# 🗺️ Google Maps API Key Setup Guide

## ✅ **What We Built**

You can now manage Google Maps API keys for each client through the admin dashboard!

**Benefits:**
- ✅ Each client can have their own API key (or share one)
- ✅ Stored securely in the database
- ✅ Automatically injected into `window.CFG.GMAPS_KEY`
- ✅ Enables form autofill with Google Places Autocomplete
- ✅ Manage through the admin UI (no code changes needed!)

---

## 📝 **How to Add Your Google Maps API Key**

### **Step 1: Go to Admin Dashboard**

Open: `https://tourism-api-production.krishna-0a3.workers.dev/admin/`

**Login with your API key** (same one you use for API requests)

---

### **Step 2: Edit Your Client**

1. Click on the **"Clients"** tab (👥)
2. Find your client (e.g., **FunTrip Tours**)
3. Click **"Edit"**

---

### **Step 3: Add Google Maps API Key**

You'll see a new field:

```
Google Maps API Key
[AIzaSy...]
For form autofill with Google Places. Leave empty if not using.
```

**Paste your Google Maps API key here** and click **"Save Client"**.

---

### **Step 4: Test It**

Reload your tour page and check the console:

```javascript
// You should see:
window.CFG.GMAPS_KEY // Your API key is here!
```

The form autofill should now work! 🎉

---

## 🔑 **How to Get a Google Maps API Key**

If you don't have one yet:

### **1. Go to Google Cloud Console**

https://console.cloud.google.com/

### **2. Create a New Project** (or select existing)

1. Click the project dropdown at the top
2. Click **"New Project"**
3. Name it (e.g., "Tourism Form Autofill")
4. Click **"Create"**

### **3. Enable the Places API**

1. Go to **"APIs & Services"** → **"Library"**
2. Search for **"Places API"**
3. Click on it
4. Click **"Enable"**

### **4. Create API Key**

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"API Key"**
3. Copy your API key (e.g., `AIzaSyC...`)

### **5. Restrict Your API Key (Recommended)**

1. Click on your API key to edit it
2. Under **"Application restrictions"**:
   - Select **"HTTP referrers (web sites)"**
   - Add your domains:
     ```
     https://funtriptoursinjamaica.com/*
     https://kamartoursjamaica.com/*
     ```

3. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Check **"Places API"**
   - Check **"Maps JavaScript API"** (if you want to show maps)

4. Click **"Save"**

---

## 🚀 **How It Works**

### **Before (Manual Config):**
```html
<script>
  window.CFG = {
    DATA_URL: '...',
    CLIENT: 'funtrip-tours',
    GMAPS_KEY: 'AIzaSy...' // ← Had to hardcode this!
  };
</script>
```

### **After (Automatic from Database):**
```html
<script>
  // Auto-detect slug and load config
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const detectedSlug = pathParts[pathParts.length - 1] || '';
  
  window.CFG = {
    DATA_URL: 'https://tourism-api-production.krishna-0a3.workers.dev/api/tours',
    CLIENT: 'funtrip-tours',
    SLUG: detectedSlug
    // No need to add GMAPS_KEY here anymore!
  };
  
  // Load embed script (this adds GMAPS_KEY automatically!)
  if (detectedSlug) {
    const embedScript = document.createElement('script');
    embedScript.src = `https://tourism-api-production.krishna-0a3.workers.dev/embed/tour/${detectedSlug}?client=funtrip-tours`;
    document.head.appendChild(embedScript);
  }
</script>
```

**The embed script automatically adds:**
```javascript
window.CFG.GMAPS_KEY = "YOUR_API_KEY_FROM_DATABASE";
```

---

## 📊 **What Gets Injected**

When you use the embed script, it automatically injects:

```javascript
// Embed script output
window.__TOUR_DATA__["tour-slug"] = { /* tour data */ };
window.__TOUR_VERSION__ = "1234567890";
window.CFG.GMAPS_KEY = "AIzaSy..."; // ← Your API key!
```

So the form can use it:
```javascript
// Form script checks for key
const apiKey = window.CFG.GMAPS_KEY || window.CFG.googleApiKey;
if (apiKey) {
  // Load Google Places Autocomplete
  loadGoogleMapsAPI(apiKey);
}
```

---

## 🎯 **Multiple Clients, Different Keys**

You can have different keys for each client:

| Client | API Key | Purpose |
|--------|---------|---------|
| FunTrip Tours | `AIzaSyA...` | Production key with daily limit |
| Kamar Tours | `AIzaSyB...` | Separate key for tracking/billing |
| Test Client | `AIzaSyC...` | Development/testing key |

**Or use the same key for all clients!** Just enter the same key in each client's settings.

---

## 🐛 **Troubleshooting**

### **1. Form autofill not working**

**Check console:**
```javascript
console.log(window.CFG.GMAPS_KEY);
```

**If `undefined`:**
- Make sure you added the key in the admin dashboard
- Make sure you saved the client
- Hard refresh the page (Ctrl+Shift+R / Cmd+Shift+R)

**If key is there but still not working:**
- Check that the API key is valid
- Check that Places API is enabled in Google Cloud Console
- Check that your domain is whitelisted in API restrictions

---

### **2. "RefererNotAllowedMapError"**

**This means your domain is not whitelisted.**

**Fix:**
1. Go to Google Cloud Console
2. Edit your API key
3. Add your domain to HTTP referrers:
   ```
   https://funtriptoursinjamaica.com/*
   ```

---

### **3. API key showing in HTML source**

**This is expected and safe!**

- API keys are meant to be public (restricted by domain)
- Your key is restricted to your domains only
- No one can use it on other websites

**To hide it:** Use server-side rendering (SSR) with Cloudflare Pages.

---

## ✅ **Summary**

**What you need to do:**
1. ✅ Get a Google Maps API key from Google Cloud Console
2. ✅ Enable Places API
3. ✅ Restrict key to your domains
4. ✅ Add key to client in admin dashboard
5. ✅ Save and test!

**What happens automatically:**
- ✅ Embed script fetches key from database
- ✅ Injects it into `window.CFG.GMAPS_KEY`
- ✅ Form uses it for autocomplete
- ✅ No code changes needed!

---

## 🚀 **Next Steps**

1. **Add your API key** to FunTrip Tours in the admin dashboard
2. **Test the form** on a tour page
3. **Verify autocomplete works** (type in pickup/dropoff fields)
4. **Update Kamar Tours** (if you have a different key for them)

**Ready to add your API key?** Go to the admin dashboard now! 🎉

