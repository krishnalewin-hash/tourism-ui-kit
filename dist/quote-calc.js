/*!
 * Quote Calc (Distance → Price) — results page widget
 * - Reads lead params (URL first, then sessionStorage fallback)
 * - Loads Google Maps JS (if not already present)
 * - Draws route map (DirectionsService/Renderer)
 * - Calculates price from distance bands + remote surcharge + minimum
 * - Writes Per-Person and Total (if passengers provided)
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
  const cacheIncoming = () => {
    ALLOW.forEach(k => { if (qs.has(k)) { try { sessionStorage.setItem("lead:"+k, qs.get(k)||""); } catch {} } });
  };
  const int = (x, d=0) => {
    const n = Number(x);
    return Number.isFinite(n) ? n : d;
  };
  const fmtMi = (m) => `${m.toFixed(1)} mi`;
  const fmtMin = (sec) => `${Math.round(sec/60)} min`;
  const esc = (s) => String(s ?? "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");

  function pickBandPrice(miles){
    for (const b of CONFIG.bands){
      if (miles < b.maxMi) return b.pricePP;
    }
    return CONFIG.bands[CONFIG.bands.length - 1].pricePP;
  }
  function remoteSurchargePP(txtA="", txtB=""){
    const hay = (txtA + " " + txtB).toLowerCase();
    return CONFIG.remote.keywords.some(k => hay.includes(k.toLowerCase()))
      ? CONFIG.remote.surchargePP
      : 0;
  }

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
            <div class="qc-pill"><b>Passengers</b><span>${pax || "—"}</span></div>
          </div>
        </div>

        <aside class="qc-price">
          <p class="qc-pp">From <b>$${pp}</b> per person</p>
          ${pax ? `<div class="qc-total">$${total} total</div>` : ""}
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
      const h = setInterval(()=>{ if (window.google?.maps?.DirectionsService){ clearInterval(h); cb(); } }, 120);
      setTimeout(()=> clearInterval(h), 12000);
      return;
    }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
    s.async = true; s.defer = true; s.setAttribute("data-qc-gmaps","1");
    s.onerror = () => cb("load-fail");
    document.head.appendChild(s);
    const h = setInterval(()=>{ if (window.google?.maps?.DirectionsService){ clearInterval(h); cb(); } }, 120);
    setTimeout(()=> clearInterval(h), 12000);
  }

  /* ===== 3) Core: route → distance → price ============================ */
  function calcAndRender(){
    const mount = document.getElementById(MOUNT_ID);
    if (!mount) return;

    // Cache newest incoming params first
    cacheIncoming();

    const pickup  = getParam("pickup_location");
    const dropoff = getParam("dropoff_location");
    const paxStr  = getParam("passengers");
    const pax     = int(paxStr) || null;

    if (!pickup || !dropoff){
      mount.innerHTML = `<div class="qc-err">Missing pickup or dropoff. Please go back and fill the form.</div>`;
      return;
    }

    // Show skeleton while we fetch route
    mount.innerHTML = skeletonHTML();

    loadMaps((err)=>{
      if (err){
        mount.innerHTML = `<div class="qc-err">Map failed to load (${esc(err)}). We’ll still show prices on the product page.</div>`;
        return;
      }

      const mapEl = document.createElement("div");
      mapEl.id = "qc-map";
      mapEl.className = "qc-map";
      // We will overwrite skeleton entirely after getting route; so no need to insert map yet.

      const ds = new google.maps.DirectionsService();
      const map = new google.maps.Map(document.getElementById(MOUNT_ID), { zoom: CONFIG.map.zoom || 9 });
      const dr = new google.maps.DirectionsRenderer({ map });

      ds.route({
        origin:   { query: pickup },
        destination: { query: dropoff },
        travelMode: google.maps.TravelMode.DRIVING
      }, (res, status) => {
        if (status !== "OK" || !res?.routes?.[0]?.legs?.[0]){
          mount.innerHTML = `<div class="qc-err">Couldn’t calculate the route right now. Please try again.</div>`;
          return;
        }
        dr.setDirections(res);

        const leg = res.routes[0].legs[0];
        const meters  = leg.distance?.value || 0;
        const miles   = meters / 1609.344;
        const seconds = leg.duration?.value || 0;

        // Pricing
        const basePP   = pickBandPrice(miles);
        const rsPP     = remoteSurchargePP(pickup, dropoff);
        const pp       = Math.max(CONFIG.minPricePP, basePP + rsPP);
        const total    = pax ? Math.round(pp * pax) : null;

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

  /* ===== 4) Auto-run on DOM ready ==================================== */
  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", calcAndRender, { once:true });
  } else {
    calcAndRender();
  }

  // Expose for debugging
  window.QuoteCalc = { _config: CONFIG, run: calcAndRender };
})();