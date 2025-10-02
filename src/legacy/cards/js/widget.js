import { hydrateIcons } from "../../shared/js/icons-lucide.js";
import { readParams, hasRequired, buildUrl } from "../../shared/js/params.js";
import { makeCardsClickable } from "../../shared/js/utils.js";
import { classifyRegion } from "./regions.js";
import { skeletonHTML, cardHTML } from "./templates.js";

async function boot(){
  const list = document.getElementById('results-list');
  if (!list) return;

  // 1) show skeleton
  list.innerHTML = skeletonHTML();

  // 2) read which client to load
  const mount = document.querySelector('.tourkit-cards'); // e.g., <div class="tourkit-cards" data-client="demo" data-base="USER/tourism-ui-kit@main"></div>
  const clientKey = mount?.dataset?.client || 'tour-driver';
  const base = mount?.dataset?.base || 'krishnalewin-hash/tourism-ui-kit@main';

  // 3) fetch per-client config
  let configUrl;
  if (base.startsWith('../') || base.startsWith('./') || base.startsWith('/')) {
    // Local development
    configUrl = `${base}clients/${clientKey}.json`;
  } else {
    // CDN
    configUrl = `https://cdn.jsdelivr.net/gh/${base}/clients/${clientKey}.json`;
  }
  
  const res = await fetch(configUrl, { cache: 'no-store' });
  const config = await res.json();

  // 4) Get params - try sessionStorage first, then URL params
  let params = readParams();
  
  // Try to enhance params from sessionStorage (form enhancer)
  try {
    const stored = JSON.parse(sessionStorage.getItem('transfer:last') || '{}');
    if (stored.pickup_location && stored.dropoff_location) {
      params = {
        ...params,
        pickup_location: extractLocationText(stored.pickup_location),
        dropoff_location: extractLocationText(stored.dropoff_location),
        pickup_date: stored.pickup_date || params.pickup_date,
        pickup_time: stored.pickup_time || params.pickup_time,
        number_of_passengers: stored.passengers || params.number_of_passengers,
        first_name: stored.first_name || params.first_name,
        last_name: stored.last_name || params.last_name,
        email: stored.email || params.email,
        phone: stored.phone || params.phone
      };
    }
  } catch (error) {
    console.warn('Failed to read sessionStorage:', error);
  }

  // 5) compute region + render
  const region = classifyRegion(params.pickup_location, params.dropoff_location);

  if (!hasRequired(params) || !region || !config.TRANSFER_CATALOG?.[region]){
    list.innerHTML = `
      <div class="tour-card" role="region" aria-label="No route detected" style="padding:16px">
        We couldn’t detect the route from your answers.
        <div style="margin-top:10px"><a class="btn btn-primary" href="${config.START_OVER_URL || '/airport-transfer-form'}">Start Over</a></div>
      </div>`;
  } else {
    const { shuttle, private: priv } = config.TRANSFER_CATALOG[region];
    list.innerHTML = `${cardHTML(shuttle, params, true, buildUrl, config.copy)}${cardHTML(priv, params, false, buildUrl, config.copy)}`;
  }

  makeCardsClickable(list);
  await hydrateIcons();
}

function extractLocationText(locationData) {
  if (typeof locationData === 'string') {
    return locationData;
  }
  if (typeof locationData === 'object' && locationData.address) {
    return locationData.address;
  }
  if (typeof locationData === 'object' && locationData.name) {
    return locationData.name;
  }
  return String(locationData || '');
}

document.addEventListener('DOMContentLoaded', boot);