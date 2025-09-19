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
  const clientKey = mount?.dataset?.client || 'demo';
  const base = mount?.dataset?.base || 'YOUR_GH_USER/tourism-ui-kit@main';

  // 3) fetch per-client config
  const res = await fetch(`https://cdn.jsdelivr.net/gh/${base}/clients/${clientKey}.json`, { cache: 'no-store' });
  const config = await res.json();

  // 4) compute region + render
  const params = readParams();
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

document.addEventListener('DOMContentLoaded', boot);