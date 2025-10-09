// Global configuration for the booking form
window.BookingForm = window.BookingForm || {};

// Function to initialize/update configuration
function initializeConfig() {
  window.BookingForm.CONFIG = {
    googleApiKey:
      (window.CFG && (window.CFG.GMAPS_KEY || window.CFG.PLACES_API_KEY)) || '',
    countries: (() => {
      const c = window.CFG?.COUNTRIES ?? window.CFG?.COUNTRY ?? null;
      if (!c) return null;
      const arr = Array.isArray(c) ? c : [c];
      return arr.map(x => String(x).toUpperCase());
    })(),
    places: {
      fields: window.CFG?.PLACES?.FIELDS || ['place_id','formatted_address','geometry','name','types'],
      types:  window.CFG?.PLACES?.TYPES ?? null,
      boundsRect: (() => {
        const b = window.CFG?.PLACES?.BOUNDS;
        if (!b?.sw || !b?.ne) return null;
        return { sw: b.sw, ne: b.ne };
      })(),
      biasCircle: window.CFG?.PLACES?.BIAS_CENTER || null,
      airportCodes: window.CFG?.PLACES?.AIRPORT_CODES || {},
      priorityKeywords: window.CFG?.PLACES?.PRIORITY_KEYWORDS || null,
      filter: {
        minKeep: 3,
        addressMustHaveNumber: true,
        /** Extra keywords to allow (beyond airports/hotels). */
        allowKeywords: (window.CFG?.PLACES?.FILTER?.ALLOW_KEYWORDS || [])
          .map(s => String(s).toLowerCase())
      }
    },
    geolocationTimeoutMs: 8000,   // kept for parity (we don't call geolocation)
    mapsLoadTimeoutMs: 10000,
    time: { start: '00:00', end: '23:59', stepMinutes: 15, format12: true }
  };
}

// Initialize config immediately (might have empty API key initially)
initializeConfig();

// Export function for re-initialization after config loads
window.BookingForm.initializeConfig = initializeConfig;

// --- Autocomplete type from config (default: establishments) ---
window.BookingForm.ALLOWED_TYPES = ['geocode','address','establishment','(regions)','(cities)'];
window.BookingForm.getAutocompleteTypesFromConfig = function() {
  const raw = window.CFG?.PLACES?.TYPES;

  // If explicitly null/[] -> no type restriction
  if (raw === null || (Array.isArray(raw) && raw.length === 0)) return undefined;

  // Default when unset
  if (raw === undefined) return ['establishment'];

  const arr = Array.isArray(raw) ? raw : [raw];
  const filtered = arr.filter(t => window.BookingForm.ALLOWED_TYPES.includes(t));
  if (filtered.length === 0) return ['establishment'];

  if (filtered.includes('establishment')) return ['establishment'];
  return [filtered[0]];
};