export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 0) Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Accept",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // 1) Your Multi-Client Apps Script URL (UPDATED)
    const ORIGIN = "https://script.google.com/macros/s/AKfycbxtcbjKbR5RdeDg9nKbqm1UoXnYOShUuKkhIVoFeA2KzvWVlrMcJ35bQU8LeNc6IrKGgw/exec";


    // 2) Read filter params from the incoming request (UPDATED to include client)
    const client = url.searchParams.get("client") || "demo";  // NEW: client parameter
    const mode   = url.searchParams.get("mode")   || "all";
    const value  = url.searchParams.get("value")  || "";
    const debug  = url.searchParams.get("debug")  || "";
    const nocache = url.searchParams.get("nocache") || "";
    const v      = url.searchParams.get("v")      || ""; // optional version-buster

    // 3) Build a cache key per filter (UPDATED to include client)
    const cacheKey = new Request(`${url.origin}${url.pathname}?client=${client}&mode=${mode}&value=${encodeURIComponent(value)}&v=${v}`, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });

    const cache = caches.default;
    
    // Skip cache if nocache=1 or debug=1
    const skipCache = nocache === "1" || debug === "1";
    
    if (!skipCache) {
      const cached = await cache.match(cacheKey);
      if (cached) {
        const hit = new Response(cached.body, cached);
        hit.headers.set("Access-Control-Allow-Origin", "*");
        hit.headers.set("X-Cache", "HIT");
        return hit;
      }
    }

    // 4) Fetch from Apps Script (UPDATED to include client parameter)
    const originUrl = new URL(ORIGIN);
    originUrl.searchParams.set("client", client);  // NEW: pass client to Apps Script
    originUrl.searchParams.set("mode", mode);
    originUrl.searchParams.set("value", value);
    if (debug) originUrl.searchParams.set("debug", debug);
    if (nocache) originUrl.searchParams.set("nocache", nocache);

    let originResp;
    try {
      originResp = await fetch(originUrl.toString(), { 
        headers: { "Accept": "application/json" } 
      });
    } catch (e) {
      // Network error → return safe empty payload with CORS so page doesn't break
      return new Response(JSON.stringify({ 
        version: null, 
        tours: [], 
        client: client,
        error: "Network error"
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
          "X-Cache": "ERROR",
        },
      });
    }

    // After the fetch:
    let originJson = null;
    let bodyBuf = await originResp.arrayBuffer();
    try {
      originJson = JSON.parse(new TextDecoder().decode(bodyBuf));
    } catch (_) { /* non-JSON or large payloads – ignore */ }

    // Build response
    const resp = new Response(bodyBuf, {
      status: originResp.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300, s-maxage=1800, stale-while-revalidate=60",
        "X-Cache": "MISS",
      },
    });

    // Only cache successful, non-error payloads
    const isOk = originResp.ok;
    const hasError = originJson && originJson.error;
    if (isOk && !skipCache && !hasError) {
      ctx.waitUntil(cache.put(cacheKey, resp.clone()));
    }
    
    return resp;
  }
}