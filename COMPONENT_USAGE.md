# Tourism UI Kit - Component Usage Guide

This repository contains two main components for airport transfer booking systems:

## 1. Quote Request Form
**Purpose**: Collects customer information and transfer details to generate quote requests.

**Usage**:
```html
<!-- Quote Request Form -->
<script>
window.CFG = {
  GMAPS_KEY: 'YOUR_GOOGLE_MAPS_API_KEY',
  COUNTRIES: ['jm'],
  PLACES: {
    FIELDS: ['place_id','formatted_address','geometry','name','types'],
    TYPES: ['establishment'],
    PRIORITY_KEYWORDS: {
      airport: ['airport','international airport','terminal','mbj','kin','ocj','neg','ktp'],
      hotel: ['hotel','resort','inn','villa','guest house','guesthouse','lodgings','spa','apartments','suite','suites','bnb']
    }
  }
};
</script>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@main/dist/quote-request-form.min.css">
<script src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@main/dist/quote-request-form.min.js"></script>
```

**Features**:
- Google Maps Places autocomplete
- Date and time picker with validation
- Passenger count selection
- Field validation and error handling
- Loading states and visual feedback
- Multi-tenant client configuration support

## 2. Quote Results Page
**Purpose**: Displays calculated pricing and booking options based on distance and route.

**Usage**:
```html
<!-- Quote Results Page -->
<div id="quote-calc"></div>

<script>
window.CFG = {
  GMAPS_KEY: 'YOUR_GOOGLE_MAPS_API_KEY',
  COUNTRIES: ['jm'],
  PLACES: {
    FIELDS: ['place_id','formatted_address','geometry','name','types'],
    TYPES: ['establishment'],
    PRIORITY_KEYWORDS: {
      airport: ['airport','international airport','terminal','mbj','kin','ocj','neg','ktp'],
      hotel: ['hotel','resort','inn','villa','guest house','guesthouse','lodgings','spa','apartments','suite','suites','bnb']
    }
  }
};
</script>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@main/dist/quote-results-page.min.css">
<script src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@main/dist/quote-results-page.min.js"></script>
<!-- Quote Results JavaScript -->
<script src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@main/dist/quote-results-page.min.js"></script>
```

**Features**:
- Distance-based pricing calculation
- Interactive route mapping
- Multiple transport options (shuttle/private)
- Zone-based pricing overrides
- Responsive design

## Multi-Tenant Configuration

Both components support multi-tenant configuration through client-specific JSON files located in `/clients/`:

```javascript
// Load client-specific configuration
fetch('/clients/your-client.json')
  .then(r => r.json())
  .then(config => {
    window.CFG = config.WINDOW_CFG || config.FORM_CONFIG;
    // Components will automatically use this configuration
  });
```

## Build System

### Main Components
```bash
npm run build                    # Build both main components
npm run build:quote-request:js   # Build quote request form JS
npm run build:quote-request:css  # Build quote request form CSS
npm run build:quote-results:js   # Build quote results page JS
npm run build:quote-results:css  # Build quote results page CSS
```

### Legacy Components (if needed)
```bash
npm run build:legacy            # Build all legacy components
npm run build:all              # Build everything (main + legacy)
```

## Repository Structure

```
├── clients/                    # Client-specific configurations
│   ├── demo.json
│   ├── kamar-tours.json
│   └── your-client.json
├── src/
│   ├── quote-request-form/     # Quote request form component
│   ├── quote-results-page/     # Quote results/calculator component
│   ├── shared/                 # Common utilities and styles
│   └── legacy/                 # Previous structure (deprecated)
└── dist/                       # Built components ready for CDN
```

## Getting Started

1. **Choose your component(s)** based on your needs
2. **Configure your client settings** in `/clients/your-client.json`
3. **Include the CDN links** in your HTML
4. **Set up the window.CFG** configuration object
5. **Test and customize** as needed

For detailed setup instructions, see the individual component documentation and demo files.