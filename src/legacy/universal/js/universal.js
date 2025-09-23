import { hydrateIcons } from "../../shared/js/icons-lucide.js";
import { readParams } from "../../shared/js/params.js";

// Import other components
// import { initCards } from "../cards/js/widget.js";
// import { initTourDetail } from "../tour-detail/js/detail.js";
// import { initBooking } from "../booking/js/booking.js";

async function initUniversalWidget() {
  const mount = document.querySelector('.tourkit-universal');
  if (!mount) return;
  
  const mode = mount.dataset.mode || 'auto';
  const clientKey = mount.dataset.client || 'demo';
  const base = mount.dataset.base || 'krishnalewin-hash/tourism-ui-kit@main';
  
  // Auto-detect mode based on page context if not specified
  let detectedMode = mode;
  if (mode === 'auto') {
    const params = readParams();
    const path = window.location.pathname.toLowerCase();
    
    if (path.includes('booking') || path.includes('checkout')) {
      detectedMode = 'booking';
    } else if (path.includes('detail') || params.tour_id || params.product_id) {
      detectedMode = 'detail';
    } else {
      detectedMode = 'cards';
    }
  }
  
  // Initialize the appropriate component
  switch (detectedMode) {
    case 'cards':
      // Show multiple options (current cards widget)
      await initCardsWidget(mount, clientKey, base);
      break;
    case 'detail':
      // Show single tour details
      await initDetailWidget(mount, clientKey, base);
      break;
    case 'booking':
      // Show booking form
      await initBookingWidget(mount, clientKey, base);
      break;
  }
  
  await hydrateIcons();
}

async function initCardsWidget(mount, clientKey, base) {
  // This would be your existing cards logic
  const resultsContainer = document.getElementById('results-list') || 
                          mount.querySelector('.results-list') || 
                          createResultsContainer(mount);
  
  // Load and render cards (existing logic)
  console.log('Initializing cards widget for client:', clientKey);
}

async function initDetailWidget(mount, clientKey, base) {
  console.log('Initializing detail widget for client:', clientKey);
  // Load specific tour details
}

async function initBookingWidget(mount, clientKey, base) {
  console.log('Initializing booking widget for client:', clientKey);
  // Load booking form
}

function createResultsContainer(mount) {
  const container = document.createElement('div');
  container.id = 'results-list';
  container.className = 'tour-list';
  container.setAttribute('aria-live', 'polite');
  mount.appendChild(container);
  return container;
}

document.addEventListener('DOMContentLoaded', initUniversalWidget);