/*!
 * Quote Calc Enhanced (Distance → Price) — results page widget with client-specific pricing
 * - Always shows total price (defaults to 1 passenger if none specified)
 * - Reads lead params (URL first, then sessionStorage fallback)
 * - Loads Google Maps JS (if not already present)
 * - Uses Distance Matrix API for reliable distance calculation
 * - Shows interactive route map when Directions API is available (fallback gracefully)
 * - Calculates price from client-specific distance bands + remote surcharge + minimum
 * - Supports client-specific pricing configuration from /clients/{client}.json
 *
 * Mount:   <div id="quote-calc"></div>
 * Depends: window.CFG.GMAPS_KEY (or a <script> with Maps already loaded)
 */

const MOUNT_ID = "quote-calc";

// Inline CSS styles for the component
const QUOTE_RESULTS_CSS = `:root{--card-bg:#fff;--card-border:#ececec;--muted:#6b7280;--accent:#D65130;--accent-600:#b54224;--shadow:0 8px 24px rgba(0,0,0,.06);--radius:12px;--font:"Poppins",system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}html,body{margin:0;padding:0}body{font-family:var(--font);color:#111827;background:#fff}.btn{display:inline-flex;align-items:center;justify-content:center;padding:12px 16px;border-radius:5px;font-weight:700;text-decoration:none}.btn-primary{background:var(--accent);color:#fff}.btn-primary:hover,.btn-primary:focus{background:var(--accent-600)}.btn:focus{outline:2px solid #000;outline-offset:2px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}#quote-calc{box-sizing:border-box;max-width:1100px;margin:24px auto;padding:24px;border:1px solid #ececec;border-radius:12px;background:#fff;box-shadow:0 8px 24px rgba(0,0,0,.06);font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}.qc-row{display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:start}@media (max-width:900px){.qc-row{grid-template-columns:1fr;gap:24px}#quote-calc{padding:16px}}.qc-map{width:100%;height:400px;border-radius:12px;background:#f3f4f6;overflow:hidden;border:1px solid #e5e7eb}.qc-details{display:flex;flex-direction:column;gap:0px}.qc-detail-item{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f3f4f6}.qc-detail-item:last-of-type{border-bottom:none}.qc-detail-label{font-weight:800;color:#374151;font-size:18px}.qc-detail-value{font-weight:400;color:#111827;font-size:18px}.qc-detail-value.highlight{font-size:18px;font-weight:800;color:#059669}.qc-buttons{display:flex;gap:12px;margin-top:24px;flex-wrap:wrap}.qc-btn{flex:1;min-width:140px;padding:14px 20px;border-radius:8px;font-weight:600;font-size:18px;text-align:center;text-decoration:none;cursor:pointer;border:none;transition:all 0.2s ease}.qc-btn-primary{background:#059669;color:white;border:2px solid #059669}.qc-btn-primary:hover{background:#047857;border-color:#047857}.qc-btn-secondary{background:white;color:#374151;border:2px solid #d1d5db}.qc-btn-secondary:hover{background:#f9fafb;border-color:#9ca3af}.qc-error{padding:16px;border:1px solid #f3d2d2;background:#fff6f6;color:#9b1c1c;border-radius:10px;text-align:center}.qc-shimmer{position:relative;border-radius:10px;background:#eef0f3;overflow:hidden}.qc-shimmer:after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,rgba(255,255,255,0) 0,rgba(255,255,255,.6) 50%,rgba(255,255,255,0) 100%);animation:qc-shimmer 1.4s infinite}@keyframes qc-shimmer{100%{transform:translateX(100%)}}`;

// Function to inject CSS styles into the document
function injectStyles() {
  // Check if styles are already injected
  if (document.getElementById('quote-results-styles')) {
    return;
  }
  
  const styleElement = document.createElement('style');
  styleElement.id = 'quote-results-styles';
  styleElement.textContent = QUOTE_RESULTS_CSS;
  document.head.appendChild(styleElement);
}

  /* ===== 0) DEFAULT CONFIG (fallback if no client config) =========== */
  const DEFAULT_CONFIG = {
    // GMAPS key: use window.CFG.GMAPS_KEY if present; client must provide their own key
    googleApiKey: (window.CFG && (window.CFG.GMAPS_KEY || window.CFG.PLACES_API_KEY)) || "",

    // Payment URL for transfers
    transferPaymentUrl: "https://tourdriver.com/book",

    // Pricing bands (miles are inclusive of lower bound, exclusive of upper)
    bands: [
      { maxMi: 10,  pricePP: 30 },  // 0–<10mi → $30 pp
      { maxMi: 20,  pricePP: 40 },  // 10–<20mi → $40 pp
      { maxMi: 40,  pricePP: 55 },  // 20–<40mi → $55 pp
      { maxMi: 999, pricePP: 70 }   // 40mi+     → $70 pp
    ],
    minPricePP: 30,                // absolute minimum per-person
    defaultPassengers: 1,          // default passengers if none specified
    remote: {                      // keyword → surcharge per person
      keywords: [
        "tryall","round hill","dublin castle","anchovy","greenwood",
        "bluefields","sheffield","orange bay","rhodes hall"
      ],
      surchargePP: 5
    },
    map: { zoom: 9 }               // default map zoom (will auto-fit route)
  };

  // Global config that will be populated from client or defaults
  let CONFIG = { ...DEFAULT_CONFIG };

  // URL params to keep & forward
  const ALLOW = [
    "pickup_location","dropoff_location","pickup_date","pickup_time","passengers","number_of_passengers",
    "first_name","last_name","email","phone"
  ];

  /* ===== 1) CLIENT CONFIG LOADER ===================================== */
  async function loadClientConfig() {
    try {
      // Determine client from various sources
  const client = window.CFG?.client || 
                new URLSearchParams(location.search).get('client') || 
                sessionStorage.getItem('client') || 
                'tour-driver';      // Determine base URL for client configs
      const base = window.CFG?.base || 'krishnalewin-hash/tourism-ui-kit@main';
      
      console.log(`[quote-calc] Loading client config: ${client}`);
      console.log(`[quote-calc] Base URL: ${base}`);

      // Load directly from core configuration (single source of truth)
      try {
        let configUrl;
        if (base.startsWith('../') || base.startsWith('./') || base.startsWith('/')) {
          configUrl = `${base}/clients/${client}/core/config.json`;
        } else {
          configUrl = `https://cdn.jsdelivr.net/gh/${base}/clients/${client}/core/config.json`;
        }

        console.log(`[quote-calc] Fetching core config: ${configUrl}`);
        
        const response = await fetch(configUrl, { cache: 'no-store' });
        if (response.ok) {
          const clientConfig = await response.json();
          
          // Update CONFIG with client-specific settings from core config
          if (clientConfig.QUOTE_RESULTS_CONFIG) {
            CONFIG = { ...CONFIG, ...clientConfig.QUOTE_RESULTS_CONFIG };
          } else if (clientConfig.PRICING_RATES) {
            convertPricingRatesToConfig(clientConfig.PRICING_RATES);
          }
          
          // Set transfer payment URL if present
          if (clientConfig.TRANSFER_PAYMENT_URL) {
            CONFIG.transferPaymentUrl = clientConfig.TRANSFER_PAYMENT_URL;
          }
          
          // Override Google Maps key if present in client config
          // Check SHARED_CONFIG first, then fallback to FORM_CONFIG for backward compatibility
          if (clientConfig.SHARED_CONFIG?.GMAPS_KEY) {
            CONFIG.googleApiKey = clientConfig.SHARED_CONFIG.GMAPS_KEY;
          } else if (clientConfig.FORM_CONFIG?.GMAPS_KEY) {
            CONFIG.googleApiKey = clientConfig.FORM_CONFIG.GMAPS_KEY;
          }
          
          console.log(`[quote-calc] Successfully loaded ${client} core configuration`);
          return CONFIG;
        } else {
          console.warn(`[quote-calc] Core config not found (${response.status})`);
        }
      } catch (error) {
        console.warn(`[quote-calc] Failed to load core config:`, error);
      }

      // Core config not found - this shouldn't happen with properly configured clients
      console.warn(`[quote-calc] Core config not available for client: ${client}`);

      // Final fallback: Use defaults
      console.warn(`[quote-calc] No configuration found for ${client}, using defaults`);
      return CONFIG;
      
    } catch (error) {
      console.error('[quote-calc] Error loading client config:', error);
      return CONFIG; // Return default config on error
    }
  }

  /* ===== 2) PRICING CONVERTER ======================================== */
  function convertPricingRatesToConfig(pricingRates) {
    // Convert legacy pricing rates to new format
    if (pricingRates.DISTANCE_BANDS && pricingRates.BASE_RATES) {
      // Convert tour-driver style config
      const basePrice = pricingRates.BASE_RATES.SEDAN || 120;
      CONFIG.bands = pricingRates.DISTANCE_BANDS.map(band => ({
        maxMi: Math.round(band.maxKm * 0.621371), // Convert km to miles
        pricePP: Math.round(basePrice * band.multiplier)
      }));
      
      if (pricingRates.REMOTE_AREAS) {
        CONFIG.remote.surchargePP = pricingRates.REMOTE_AREAS.SURCHARGE_USD || 5;
      }
    } else if (pricingRates.zones) {
      // Convert demo/kamar-tours style zone-based config to distance bands
      // For now, use default bands but could be enhanced to convert zones
      console.log('[quote-calc] Zone-based pricing detected, using default distance bands');
    }
  }

  /* ===== 3) Utilities ================================================= */
  const qs = new URLSearchParams(location.search);
  const getParam = (k) => {
    const v = qs.get(k);
    if (v && String(v).trim()) return v;
    try { return sessionStorage.getItem("lead:"+k) || ""; } catch { return ""; }
    if (window.LEAD_DATA && window.LEAD_DATA[k]) return window.LEAD_DATA[k];
    return "";
  };

  const esc = s => String(s||"").replace(/[<>&"']/g, m => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'})[m]);
  const fmtMi = n => (n||0).toFixed(1) + " miles";
  const fmtMin = secs => Math.round((secs||0)/60) + " minutes";

  function pickBandPrice(miles){
    for (const b of CONFIG.bands) {
      if (miles < b.maxMi) return b.pricePP;
    }
    return CONFIG.bands[CONFIG.bands.length - 1].pricePP;
  }

  function remoteSurchargePP(pickup, dropoff){
    const text = (pickup + " " + dropoff).toLowerCase();
    for (const kw of CONFIG.remote.keywords) {
      if (text.includes(kw)) return CONFIG.remote.surchargePP;
    }
    return 0;
  }

  /* ===== 4) UI builders ================================================== */
  function buildCardHTML(state){
    const { pickup, dropoff, miles, seconds, pp, total, pax, showMap = true } = state;

    return `
      <div class="qc-row">
        ${showMap ? `
        <div>
          <div id="qc-map" class="qc-map qc-shimmer" aria-label="Route map"></div>
        </div>
        ` : ''}

        <div class="qc-details">
          <div class="qc-detail-item">
            <span class="qc-detail-label">From:</span>
            <span class="qc-detail-value">${esc(pickup)}</span>
          </div>
          <div class="qc-detail-item">
            <span class="qc-detail-label">To:</span>
            <span class="qc-detail-value">${esc(dropoff)}</span>
          </div>
          <div class="qc-detail-item">
            <span class="qc-detail-label">Distance:</span>
            <span class="qc-detail-value">${fmtMi(miles)}</span>
          </div>
          <div class="qc-detail-item">
            <span class="qc-detail-label">Est. Duration:</span>
            <span class="qc-detail-value">${fmtMin(seconds)}</span>
          </div>
          <div class="qc-detail-item">
            <span class="qc-detail-label">Number of Passengers:</span>
            <span class="qc-detail-value">${pax || CONFIG.defaultPassengers}</span>
          </div>
          <div class="qc-detail-item">
            <span class="qc-detail-label">Cost per person:</span>
            <span class="qc-detail-value">$${pp}</span>
          </div>
          <div class="qc-detail-item">
            <span class="qc-detail-label">Total Cost:</span>
            <span class="qc-detail-value highlight">$${total}</span>
          </div>
          
          <div class="qc-buttons">
            <button class="qc-btn qc-btn-primary" onclick="handlePayNow()">Pay Now</button>
            <button class="qc-btn qc-btn-secondary" onclick="handleContactUs()">Contact Us</button>
          </div>
        </div>
      </div>
    `;
  }

  function skeletonHTML(){
    return `
      <div class="qc-details">
        <div class="qc-shimmer" style="height:20px;margin-bottom:16px;border-radius:4px;"></div>
        <div class="qc-shimmer" style="height:20px;margin-bottom:16px;border-radius:4px;"></div>
        <div class="qc-shimmer" style="height:20px;margin-bottom:16px;border-radius:4px;"></div>
        <div class="qc-shimmer" style="height:20px;margin-bottom:16px;border-radius:4px;"></div>
        <div class="qc-shimmer" style="height:20px;margin-bottom:16px;border-radius:4px;"></div>
        <div class="qc-shimmer" style="height:20px;margin-bottom:16px;border-radius:4px;"></div>
        <div class="qc-shimmer" style="height:24px;margin-bottom:24px;border-radius:4px;"></div>
        <div style="display:flex;gap:12px;">
          <div class="qc-shimmer" style="height:48px;flex:1;border-radius:8px;"></div>
          <div class="qc-shimmer" style="height:48px;flex:1;border-radius:8px;"></div>
        </div>
      </div>
    `;
  }

  /* ===== 5) Google Maps Loader ======================================= */
  function loadMaps(cb){
    console.log(`[quote-calc] Loading Google Maps...`);
    if (window.google && google.maps && google.maps.DistanceMatrixService) {
      console.log(`[quote-calc] Google Maps already loaded`);
      return cb();
    }
    
    const key = CONFIG.googleApiKey;
    console.log(`[quote-calc] Using API key: ${key?.substring(0, 15)}...`);
    
    if (!key) { 
      console.error("[quote-calc] Missing Google Maps API key"); 
      cb("no-key"); 
      return; 
    }
    
    if (document.querySelector("script[data-qc-gmaps]")){
      console.log(`[quote-calc] Google Maps script already exists, waiting for load...`);
      const check = () => window.google?.maps?.DistanceMatrixService ? cb() : setTimeout(check, 100);
      check(); 
      return;
    }
    
    console.log(`[quote-calc] Creating Google Maps script tag`);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=geometry`;
    script.setAttribute("data-qc-gmaps", "1");
    script.onload = () => {
      console.log(`[quote-calc] Google Maps script loaded successfully`);
      cb();
    };
    script.onerror = () => { 
      console.error("[quote-calc] Failed to load Google Maps"); 
      cb("load-error"); 
    };
    document.head.appendChild(script);
  }

  /* ===== 6) Main Calculator Engine ==================================== */
  async function calculate(){
    // Inject CSS styles first
    injectStyles();
    
    const mount = document.getElementById(MOUNT_ID);
    if (!mount) { console.warn(`[quote-calc] No element #${MOUNT_ID} found`); return; }

    const pickup = getParam("pickup_location");
    const dropoff = getParam("dropoff_location");
    
    console.log(`[quote-calc] Starting calculation with pickup: ${pickup}, dropoff: ${dropoff}`);
    console.log(`[quote-calc] Initial CONFIG.googleApiKey: ${CONFIG.googleApiKey?.substring(0, 15)}...`);
    
    if (!pickup || !dropoff) {
      mount.innerHTML = `<div class="qc-error">Missing pickup or dropoff location</div>`;
      return;
    }

    mount.innerHTML = skeletonHTML();

    // Load client-specific config first
    try {
      await loadClientConfig();
      console.log(`[quote-calc] After config loading, CONFIG.googleApiKey: ${CONFIG.googleApiKey?.substring(0, 15)}...`);
    } catch (error) {
      console.warn('[quote-calc] Failed to load client config, using defaults:', error);
    }

    loadMaps((err) => {
      if (err) {
        mount.innerHTML = `<div class="qc-error">Could not load Google Maps: ${err}</div>`;
        return;
      }

      // Primary calculation using Distance Matrix API (more reliable)
      const service = new google.maps.DistanceMatrixService();
      console.log(`[quote-calc] Using Distance Matrix API for calculation`);
      
      service.getDistanceMatrix({
        origins: [pickup],
        destinations: [dropoff],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      }, (response, status) => {
        if (status !== "OK") {
          mount.innerHTML = `<div class="qc-error">Couldn't calculate the distance right now. Please try again.</div>`;
          console.error("[quote-calc] Distance Matrix failed:", status);
          return;
        }

        const element = response.rows[0].elements[0];
        if (element.status !== "OK") {
          mount.innerHTML = `<div class="qc-error">Could not find a route between these locations. Please check the addresses.</div>`;
          console.error("[quote-calc] Distance Matrix element failed:", element.status);
          return;
        }

        const meters = element.distance?.value || 0;
        const miles = meters / 1609.344;
        const seconds = element.duration?.value || 0;

        // Enhanced pricing with default passengers
        const rawPax = getParam("passengers") || getParam("number_of_passengers");
        const pax = rawPax && parseInt(rawPax) > 0 ? parseInt(rawPax) : CONFIG.defaultPassengers;
        
        const basePP = pickBandPrice(miles);
        const rsPP = remoteSurchargePP(pickup, dropoff);
        const pp = Math.max(CONFIG.minPricePP, basePP + rsPP);
        const total = Math.round(pp * pax);

        console.log(`[quote-calc] Distance Matrix calculation successful: ${miles.toFixed(1)} miles, $${total} total`);

        // Render initial UI with calculated quote (show map placeholder)
        const outer = document.createElement("div");
        outer.id = MOUNT_ID;
        outer.innerHTML = buildCardHTML({
          pickup, dropoff,
          miles: Math.round(miles*10)/10,
          seconds, pax,
          pp, total,
          showMap: true
        });

        // Replace mount contents
        mount.replaceWith(outer);

        // Try to enhance with interactive route map (optional)
        const mapNode = document.getElementById("qc-map");
        if (mapNode && google.maps.DirectionsService) {
          console.log(`[quote-calc] Attempting to add interactive route map`);
          console.log(`[quote-calc] Map container:`, mapNode);
          console.log(`[quote-calc] Pickup: "${pickup}", Dropoff: "${dropoff}"`);
          
          const ds = new google.maps.DirectionsService();
          ds.route({
            origin: pickup,
            destination: dropoff,
            travelMode: google.maps.TravelMode.DRIVING
          }, (res, directionsStatus) => {
            console.log(`[quote-calc] Directions API response:`, directionsStatus);
            
            if (directionsStatus === "OK") {
              // Success! Show the interactive route
              console.log(`[quote-calc] Directions API successful, rendering map`);
              const map = new google.maps.Map(mapNode, { 
                zoom: CONFIG.map.zoom || 9,
                center: res.routes[0].legs[0].start_location
              });
              const directionsRenderer = new google.maps.DirectionsRenderer({ 
                map: map,
                draggable: false
              });
              directionsRenderer.setDirections(res);
              mapNode.classList.remove("qc-shimmer");
              console.log(`[quote-calc] Interactive route map displayed successfully`);
            } else {
              // Directions failed, but we still have the quote! Show a simple message
              console.warn(`[quote-calc] Directions API failed (${directionsStatus}), but quote is still available`);
              console.warn(`[quote-calc] This is likely due to API permissions. Check Google Cloud Console.`);
              mapNode.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f9fafb;color:#6b7280;text-align:center;padding:20px;">
                  <div>
                    <p style="margin:0;font-size:16px;margin-bottom:8px;">📍 Route Map Unavailable</p>
                    <p style="margin:0;font-size:14px;">Distance calculated: ${Math.round(miles*10)/10} miles</p>
                    <p style="margin:0;font-size:12px;margin-top:8px;color:#9ca3af;">Directions API: ${directionsStatus}</p>
                  </div>
                </div>
              `;
              mapNode.classList.remove("qc-shimmer");
            }
          });
        } else {
          // No Directions API available, show simple placeholder
          console.log(`[quote-calc] Directions API not available, showing distance only`);
          console.log(`[quote-calc] MapNode exists:`, !!mapNode);
          console.log(`[quote-calc] DirectionsService exists:`, !!google.maps.DirectionsService);
          
          if (mapNode) {
            mapNode.innerHTML = `
              <div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f9fafb;color:#6b7280;text-align:center;padding:20px;">
                <div>
                  <p style="margin:0;font-size:18px;margin-bottom:8px;">📏 ${Math.round(miles*10)/10} miles</p>
                  <p style="margin:0;font-size:14px;">Estimated ${fmtMin(seconds)}</p>
                  <p style="margin:0;font-size:12px;margin-top:8px;color:#9ca3af;">Maps API not fully loaded</p>
                </div>
              </div>
            `;
            mapNode.classList.remove("qc-shimmer");
          }
        }
      });
    });
  }

  /* ===== 7) Auto-run on page load ===================================== */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", calculate);
  } else {
    calculate();
  }

  // Expose calculate function globally for debugging
  window.calculate = calculate;

  /* ===== 8) Button Handlers =========================================== */
  window.handlePayNow = function() {
    // Get current trip details
    const pickup = getParam("pickup_location");
    const dropoff = getParam("dropoff_location");
    const pickupDate = getParam("pickup_date");
    const pickupTime = getParam("pickup_time");
    const passengers = getParam("passengers") || getParam("number_of_passengers") || CONFIG.defaultPassengers;
    const firstName = getParam("first_name");
    const lastName = getParam("last_name");
    const email = getParam("email");
    const phone = getParam("phone");

    // Build booking URL with all parameters
    const bookingParams = new URLSearchParams();
    if (pickup) bookingParams.set('pickup_location', pickup);
    if (dropoff) bookingParams.set('dropoff_location', dropoff);
    if (pickupDate) bookingParams.set('pickup_date', pickupDate);
    if (pickupTime) bookingParams.set('pickup_time', pickupTime);
    if (passengers) bookingParams.set('passengers', passengers);
    if (firstName) bookingParams.set('first_name', firstName);
    if (lastName) bookingParams.set('last_name', lastName);
    if (email) bookingParams.set('email', email);
    if (phone) bookingParams.set('phone', phone);

    // Redirect to booking page using client-specific payment URL
    const bookingUrl = `${CONFIG.transferPaymentUrl}?${bookingParams.toString()}`;
    window.location.href = bookingUrl;
  };

  window.handleContactUs = function() {
    // Get trip details for contact form
    const pickup = getParam("pickup_location");
    const dropoff = getParam("dropoff_location");
    const passengers = getParam("passengers") || getParam("number_of_passengers") || CONFIG.defaultPassengers;
    
    // Create contact message
    const message = `Hi! I'd like to book a transfer from ${pickup} to ${dropoff} for ${passengers} passenger(s). Please contact me with more details.`;
    
    // Option 1: WhatsApp (customize phone number)
    const whatsappUrl = `https://wa.me/1876XXXXXXX?text=${encodeURIComponent(message)}`;
    
    // Option 2: Email (customize email)
    const emailUrl = `mailto:bookings@tourdriver.com?subject=Transfer Booking Request&body=${encodeURIComponent(message)}`;
    
    // Option 3: Phone call
    // window.location.href = 'tel:+1876XXXXXXX';
    
    // Use WhatsApp by default (change to emailUrl or phone as needed)
    window.open(whatsappUrl, '_blank');
  };