# Quote Form Style - Modular Architecture

This directory contains the modular version of the quote form styling system, broken down into focused, maintainable modules.

## Architecture Overview

The modular system replaces the monolithic `quote-form-styling.js` (1369 lines) with focused, single-responsibility modules:

### Core Modules

- **`config.js`** - Configuration management and auto-loading
- **`maps-loader.js`** - Google Maps API loading and polling
- **`quote-form-styling.js`** - Main entry point and orchestrator

### Field Enhancement Modules

- **`date-guard.js`** - Date validation and formatting 
- **`date-picker.js`** - Custom calendar popup component
- **`time-picker.js`** - Custom time picker with 12/24h support
- **`passenger-select.js`** - Dropdown replacement for passenger count

### UI Enhancement Modules

- **`button-enhancer.js`** - NEXT/SUBMIT button styling and mobile adaptation

### Styling

- **`quote-form-styling.css`** - Modular CSS organized by component

## Usage

### Basic Implementation

```html
<!-- Include CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@main/src/quote-form-style/quote-form-styling.css">

<!-- Include main JS module -->
<script type="module" src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@main/src/quote-form-style/quote-form-styling.js"></script>

<!-- Set configuration -->
<script>
window.CFG = { CLIENT: "kamar-tours" };
</script>
```

### Configuration Options

```javascript
window.CFG = {
  CLIENT: "kamar-tours",                    // Auto-loads client config
  GMAPS_KEY: "AIzaSy...",                   // Optional: Override API key
  COUNTRIES: ["jm"],                        // Optional: Override countries
  REGION: "jm"                              // Optional: Override region
};
```

## Module Responsibilities

### config.js
- Centralizes all configuration management
- Handles auto-loading of client configurations
- Provides debug logging for troubleshooting
- Exposes CONFIG object to other modules

### maps-loader.js
- Dynamically loads Google Maps JavaScript API
- Handles script injection and polling for readiness
- Manages timeouts and error states
- Provides callback-based interface

### date-guard.js
- Prevents past date selection
- Parses various date input formats
- Formats dates into verbose display format
- Handles validation and user feedback

### date-picker.js
- Custom calendar popup component
- Month navigation and date selection
- Integrates with date-guard formatting
- Responsive positioning and styling

### time-picker.js
- Singleton time picker with popover UI
- 12/24 hour format support
- Step-based minute increments
- Keyboard and mouse interaction

### passenger-select.js
- Replaces number input with dropdown
- Options: 1-15, 16+
- Syncs with hidden input for form submission
- Maintains validation compatibility

### button-enhancer.js
- Mobile-responsive NEXT button labels
- Submit button CTA styling with icons
- Viewport change handling
- Dynamic button enhancement

## Benefits of Modular Architecture

### Maintainability
- Each module has a single, clear responsibility
- Easier to debug and update specific features
- Clear separation of concerns

### Performance
- Smaller individual files load faster
- Can lazy-load modules as needed
- Better browser caching

### Reusability
- Modules can be used independently
- Easy to include only needed functionality
- Shareable across different projects

### Development
- Team members can work on different modules simultaneously
- Easier unit testing of individual components
- Clear API boundaries between modules

### Extensibility
- Easy to add new modules without affecting existing code
- Plugin-like architecture for future enhancements
- Clear integration patterns

## Migration from Monolithic Version

The modular system maintains the same external API as the original quote-form-styling.js:

1. **Same Configuration**: Uses `window.CFG` in the same way
2. **Same CSS Classes**: All styling hooks remain unchanged
3. **Same Functionality**: All features work identically
4. **Same Integration**: Drop-in replacement for existing implementations

## Development Roadmap

### Phase 1 (Completed ✅)
- ✅ Core infrastructure modules (config, maps-loader)
- ✅ Field enhancement modules (date-guard, date-picker, time-picker, passenger-select)
- ✅ UI enhancement modules (button-enhancer, visuals)
- ✅ Validation modules (validation-step1, validation-step2)
- ✅ Advanced modules (autocomplete, prefill, observer)
- ✅ Main orchestrator and CSS
- ✅ Test page and documentation

### Phase 2 (Future Enhancements)
- [ ] Advanced analytics integration
- [ ] A/B testing framework
- [ ] Performance monitoring
- [ ] Advanced accessibility features

## File Structure

```
src/quote-form-style/
├── README.md                     # This file
├── quote-form-styling.js         # Main entry point
├── quote-form-styling.css        # Modular CSS
├── config.js                     # Configuration management
├── maps-loader.js                # Google Maps loading
├── date-guard.js                 # Date validation
├── date-picker.js                # Calendar component
├── time-picker.js                # Time picker component
├── passenger-select.js           # Passenger dropdown
├── button-enhancer.js            # Button enhancements
├── validation-step1.js           # Step 1 form validation
├── validation-step2.js           # Step 2 form validation
├── visuals.js                    # Icon injection & styling
├── autocomplete.js               # Google Places integration
├── prefill.js                    # Auto-population system
└── observer.js                   # Dynamic field monitoring
```

## API Reference

### Global Objects

- `window.QuoteFormConfig` - Main API namespace
- `window.QuoteFormConfig.CONFIG` - Configuration object
- `window.QuoteFormConfig.initialize()` - Manual initialization
- `window.QuoteFormConfig.version` - Version string

### Configuration Auto-Loading

The system automatically loads client configurations when `CLIENT` is specified:

```javascript
// This triggers auto-loading from:
// https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@main/clients/_build/kamar-tours.json
window.CFG = { CLIENT: "kamar-tours" };
```

### Debug Helpers

- `window.__tpOpenNow(selector)` - Open time picker for element
- Console logging with `[QuoteFormStyle]` prefix for debugging

## Browser Support

- Modern browsers with ES6 module support
- Graceful degradation for older browsers
- Mobile-responsive design
- Touch-friendly interactions

## Contributing

When adding new modules:

1. Follow the existing naming conventions
2. Export functions via both ES6 modules and window.QuoteFormConfig
3. Include proper error handling and logging
4. Update this README with new module documentation
5. Maintain backward compatibility with existing implementations