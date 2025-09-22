/*!
 * Quote Calc Enhanced (Distance → Price) — results page widget with default total
 * - Always shows total price (defaults to 1 passenger if none specified)
 * - Reads lead params (URL first, then sessionStorage fallback)
 * - Loads Google Maps JS (if not already present)
 * - Draws route map (DirectionsService/Renderer)
 * - Calculates price from distance bands + remote surcharge + minimum
 *
 * Mount:   <div id="quote-calc"></div>
 * Depends: window.CFG.GMAPS_KEY (or a <script> with Maps already loaded)
 */
(function(){
  const MOUNT_ID = "quote-calc";

  /* ===== 0) CONFIG (edit to taste) =================================== */
  const CONFIG = {
    // GMAPS key: use window.CFG.GMAPS_KEY if present; or set here
    googleApiKey: (window.CFG && (window.CFG.GMAPS_KEY || window.CFG.PLACES_API_KEY)) || "",

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

  // URL params to keep & forward
  const ALLOW = [
    "pickup_location","dropoff_location","pickup_date","pickup_time","passengers",
    "first_name","last_name","email","phone"
  ];

  /* ===== 1) Utilities ================================================= */
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

  /* ===== UI builders ================================================== */
  function buildCardHTML(state){
    const { pickup, dropoff, miles, seconds, pp, total, pax } = state;

    return `
      <div class="qc-row">
        <div>
          <div id="qc-map" class="qc-map qc-shimmer" aria-label="Route map"></div>
        </div>

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
      <div class="qc-row">
        <div class="qc-shimmer" style="height:400px;border-radius:12px;"></div>
        <div class="qc-shimmer" style="height:400px;border-radius:12px;"></div>
      </div>
    `;
  }

  /* ===== 2) Google Maps Loader ======================================= */
  function loadMaps(cb){
    if (window.google && google.maps && google.maps.DirectionsService) return cb();
    const key = CONFIG.googleApiKey;
    if (!key) { console.error("[quote-calc] Missing Google Maps API key"); cb("no-key"); return; }
    if (document.querySelector("script[data-qc-gmaps]")){
      const check = () => window.google?.maps?.DirectionsService ? cb() : setTimeout(check, 100);
      check(); return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.setAttribute("data-qc-gmaps", "1");
    script.onload = () => cb();
    script.onerror = () => { console.error("[quote-calc] Failed to load Google Maps"); cb("load-error"); };
    document.head.appendChild(script);
  }

  /* ===== 3) Main Calculator Engine ==================================== */
  function calculate(){
    const mount = document.getElementById(MOUNT_ID);
    if (!mount) { console.warn(`[quote-calc] No element #${MOUNT_ID} found`); return; }

    const pickup = getParam("pickup_location");
    const dropoff = getParam("dropoff_location");
    if (!pickup || !dropoff) {
      mount.innerHTML = `<div class="qc-error">Missing pickup or dropoff location</div>`;
      return;
    }

    mount.innerHTML = skeletonHTML();

    loadMaps((err) => {
      if (err) {
        mount.innerHTML = `<div class="qc-error">Could not load Google Maps: ${err}</div>`;
        return;
      }

      const ds = new google.maps.DirectionsService();
      ds.route({
        origin: pickup,
        destination: dropoff,
        travelMode: google.maps.TravelMode.DRIVING
      }, (res, status) => {
        if (status !== "OK") {
          mount.innerHTML = `<div class="qc-error">Couldn't calculate the route right now. Please try again.</div>`;
          console.error("[quote-calc] Directions failed:", status);
          return;
        }

        const leg = res.routes[0].legs[0];
        const meters  = leg.distance?.value || 0;
        const miles   = meters / 1609.344;
        const seconds = leg.duration?.value || 0;

        // Enhanced pricing with default passengers
        const rawPax = getParam("passengers");
        const pax = rawPax && parseInt(rawPax) > 0 ? parseInt(rawPax) : CONFIG.defaultPassengers;
        
        const basePP   = pickBandPrice(miles);
        const rsPP     = remoteSurchargePP(pickup, dropoff);
        const pp       = Math.max(CONFIG.minPricePP, basePP + rsPP);
        const total    = Math.round(pp * pax);

        // Paint UI (fresh container with map + metrics + price)
        const outer = document.createElement("div");
        outer.id = MOUNT_ID;
        outer.innerHTML = buildCardHTML({
          pickup, dropoff,
          miles: Math.round(miles*10)/10,
          seconds, pax,
          pp, total
        });

        // Replace mount contents
        mount.replaceWith(outer);

        // Instantiate the map inside the new container
        const mapNode = document.getElementById("qc-map");
        const map2 = new google.maps.Map(mapNode, { zoom: CONFIG.map.zoom || 9 });
        const dr2 = new google.maps.DirectionsRenderer({ map: map2 });
        dr2.setDirections(res);
        
        // Remove shimmer effect once map is loaded
        mapNode.classList.remove("qc-shimmer");
      });
    });
  }

  /* ===== 4) Auto-run on page load ===================================== */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", calculate);
  } else {
    calculate();
  }

  /* ===== 5) Button Handlers =========================================== */
  window.handlePayNow = function() {
    // Get current trip details
    const pickup = getParam("pickup_location");
    const dropoff = getParam("dropoff_location");
    const pickupDate = getParam("pickup_date");
    const pickupTime = getParam("pickup_time");
    const passengers = getParam("passengers") || CONFIG.defaultPassengers;
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

    // Redirect to booking page (customize this URL for each client)
    const bookingUrl = `https://tourdriver.com/book?${bookingParams.toString()}`;
    window.location.href = bookingUrl;
  };

  window.handleContactUs = function() {
    // Get trip details for contact form
    const pickup = getParam("pickup_location");
    const dropoff = getParam("dropoff_location");
    const passengers = getParam("passengers") || CONFIG.defaultPassengers;
    
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
})();