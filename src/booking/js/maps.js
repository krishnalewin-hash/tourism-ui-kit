// Load Google Maps JS + provide a bounds function from config

// Global namespace for booking form
window.BookingForm = window.BookingForm || {};

window.BookingForm.loadGoogleMaps = function(callback) {
  const CONFIG = window.BookingForm.getConfig();
  const googleApiKey = CONFIG.googleApiKey;
  const timeoutMs = CONFIG.mapsLoadTimeoutMs || 10000;
  
  return new Promise((resolve, reject)=>{
    if (window.google?.maps?.places) {
      if (callback) callback();
      return resolve();
    }

    if (document.querySelector('script[data-gmaps-loader]')){
      const t=setInterval(()=>{ 
        if(window.google?.maps?.places){ 
          clearInterval(t); 
          if (callback) callback();
          resolve(); 
        } 
      },150);
      setTimeout(()=>{ clearInterval(t); reject(new Error('timeout')); }, timeoutMs);
      return;
    }
    const s=document.createElement('script');
    s.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(googleApiKey)}&libraries=places`;
    s.async=true; s.defer=true; s.setAttribute('data-gmaps-loader','1');
    s.onerror=()=>reject(new Error('load-failed'));
    document.head.appendChild(s);
    const t=setInterval(()=>{ 
      if(window.google?.maps?.places){ 
        clearInterval(t); 
        if (callback) callback();
        resolve(); 
      } 
    },150);
    setTimeout(()=>{ clearInterval(t); reject(new Error('timeout')); }, timeoutMs);
  });
};

window.BookingForm.makeBiasBoundsSupplier = function(CONFIG){
  const g = window.google?.maps;
  if (!g) return () => null;

  if (CONFIG.places.boundsRect){
    const { sw, ne } = CONFIG.places.boundsRect;
    const rect = new g.LatLngBounds(new g.LatLng(sw.lat, sw.lng), new g.LatLng(ne.lat, ne.lng));
    return () => rect;
  }
  if (CONFIG.places.biasCircle && Number(CONFIG.places.biasCircle.radiusMeters) > 0){
    const { lat, lng, radiusMeters } = CONFIG.places.biasCircle;
    return () => {
      const circle = new g.Circle({ center:new g.LatLng(lat, lng), radius:Number(radiusMeters) });
      return circle.getBounds();
    };
  }
  return () => null;
};

// Placeholder functions for missing wireAutocomplete and setupPredictionFilters
window.BookingForm.wireAutocomplete = function(root = document) {
  // TODO: Implement autocomplete wiring logic
  console.log('wireAutocomplete called - needs implementation');
};

window.BookingForm.setupPredictionFilters = function() {
  // TODO: Implement prediction filters logic
  console.log('setupPredictionFilters called - needs implementation');
};