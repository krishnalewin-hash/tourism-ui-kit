export function skeletonHTML(){
  return `
    <div class="skeleton-list" aria-hidden="true">
      <div class="skeleton">
        <div class="shimmer sk-img"></div>
        <div class="sk-pad">
          <div class="shimmer sk-line lg"></div>
          <div class="shimmer sk-line"></div>
          <div class="shimmer sk-line" style="width:60%"></div>
        </div>
        <div class="sk-right">
          <div class="shimmer sk-line"></div>
          <div class="shimmer sk-pill"></div>
        </div>
      </div>
      <div class="skeleton">
        <div class="shimmer sk-img"></div>
        <div class="sk-pad">
          <div class="shimmer sk-line lg"></div>
          <div class="shimmer sk-line"></div>
          <div class="shimmer sk-line" style="width:60%"></div>
        </div>
        <div class="sk-right">
          <div class="shimmer sk-line"></div>
          <div class="shimmer sk-pill"></div>
        </div>
      </div>
    </div>`;
}

export function featuresHTML(copy = {}){
  const {
    flight = "Flight tracking",
    wifi = "Complimentary in-vehicle Wi-Fi",
    water = "Complimentary bottled water",
    cancel = "Free cancellation up to 24 hours before pickup",
    inclusive = "Price includes taxes, tolls & tip — no hidden costs"
  } = copy;

  return `
    <ul class="tour-features" role="list">
      <li class="tour-feature"><svg class="ico" data-lucide="plane"></svg><span>${flight}</span></li>
      <li class="tour-feature"><svg class="ico" data-lucide="wifi"></svg><span>${wifi}</span></li>
      <li class="tour-feature"><svg class="ico" data-lucide="cup-soda"></svg><span>${water}</span></li>
      <li class="tour-feature"><svg class="ico" data-lucide="calendar-x"></svg><span>${cancel}</span></li>
      <li class="tour-feature"><svg class="ico" data-lucide="receipt"></svg><span>${inclusive}</span></li>
    </ul>`;
}

export function cardHTML(product, params, eager, buildUrl, copy){
  const imgFlags = eager ? 'loading="eager" fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';
  const url = buildUrl(product.url, params);
  const price = (product.fromPrice!=null && product.fromPrice!=="")
    ? `<div class="micro">From</div><div class="amount">$${Math.round(product.fromPrice)}</div>` : '';
  return `
    <article class="tour-card atc-card" data-url="${url}" aria-label="${product.name}">
      <a class="img-link tour-img" href="${url}">
        <img src="${product.img}" alt="${product.name}" ${imgFlags}>
      </a>
      <div class="tour-body">
        <h3><a class="title-link" href="${url}">${product.name}</a></h3>
        ${featuresHTML(copy)}
      </div>
      <div class="tour-price">
        ${price}
        <a class="btn btn-primary" href="${url}">View Details</a>
      </div>
    </article>`;
}