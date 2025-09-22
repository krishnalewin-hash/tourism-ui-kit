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
  const fmtMi = n => (n||0).toFixed(1) + " mi";
  const fmtMin = secs => Math.round((secs||0)/60) + " min";

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
      <h3 class="qc-h">Estimated Trip & Price</h3>
      <p class="qc-sub">From <b>${esc(pickup)}</b> to <b>${esc(dropoff)}</b></p>

      <div class="qc-row">
        <div>
          <div id="qc-map" class="qc-map qc-shimmer" aria-label="Route map"></div>
          <div class="qc-metrics">
            <div class="qc-pill"><b>Distance</b><span>${fmtMi(miles)}</span></div>
            <div class="qc-pill"><b>Duration</b><span>${fmtMin(seconds)}</span></div>
            <div class="qc-pill"><b>Passengers</b><span>${pax || CONFIG.defaultPassengers}</span></div>
          </div>
        </div>

        <aside class="qc-price">
          <p class="qc-pp">From <b>$${pp}</b> per person</p>
          <div class="qc-total">$${total} total</div>
          <p class="qc-note">Final price may vary with exact routing and vehicle availability.</p>
        </aside>
      </div>
    `;
  }

  function skeletonHTML(){
    return `
      <div class="qc-skeleton">
        <div class="qc-shimmer" style="height:280px"></div>
        <div class="qc-shimmer" style="height:140px"></div>
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
      });
    });
  }

  /* ===== 4) Auto-run on page load ===================================== */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", calculate);
  } else {
    calculate();
  }
})();