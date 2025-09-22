// Global namespace for booking form
window.BookingForm = window.BookingForm || {};

// Reads window.CFG and produces a normalized CONFIG used across modules.
window.BookingForm.getConfig = function() {
  const CFG = window.CFG || {};

  const countries = (() => {
    const c = CFG.COUNTRIES ?? CFG.COUNTRY ?? null;
    if (!c) return null;
    const arr = Array.isArray(c) ? c : [c];
    return arr.map(x => String(x).toUpperCase());
  })();

  const places = CFG.PLACES || {};
  const boundsRect = places.BOUNDS?.sw && places.BOUNDS?.ne
    ? { sw: places.BOUNDS.sw, ne: places.BOUNDS.ne }
    : null;

  return {
    googleApiKey: CFG.GMAPS_KEY || CFG.PLACES_API_KEY || "",
    countries,
    places: {
      fields: places.FIELDS || ['place_id','formatted_address','geometry','name','types'],
      types:  places.TYPES ?? undefined, // undefined lets Google default
      boundsRect,
      biasCircle: places.BIAS_CENTER || null,
      airportCodes: places.AIRPORT_CODES || {},
      priorityKeywords: places.PRIORITY_KEYWORDS || null,
      filter: {
        minKeep: 3,
        addressMustHaveNumber: true,
        allowKeywords: (places?.FILTER?.ALLOW_KEYWORDS || []).map(s => String(s).toLowerCase())
      }
    },
    mapsLoadTimeoutMs: 10000,
    time: { start:'00:00', end:'23:59', stepMinutes:15, format12:true },
    serviceTypes: [
      { id: 'pickup', label: 'Pickup' },
      { id: 'dropoff', label: 'Drop-off' }
    ]
  };
};