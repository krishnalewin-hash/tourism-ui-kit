/* ===== Quote Results Calculator ===== */
/* 
  Handles airport transfer pricing calculations with:
  - Distance-based pricing bands
  - 2-person minimum requirement
  - Google Maps integration
  - Client-specific configuration
*/

(function() {
  'use strict';

  // Global configuration
  let CONFIG = null;
  let CLIENT_CONFIG = null;

  // Load client configuration
  async function loadClientConfig() {
    if (!window.CFG?.client) {
      console.error('[QuoteCalc] No client specified in window.CFG');
      return;
    }

    const client = window.CFG.client;
    const baseUrl = window.CFG.baseUrl || 'https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@main';
    const configUrl = `${baseUrl}/clients/${client}/core/config.json`;

    try {
      console.log(`[QuoteCalc] Loading config for ${client} from ${configUrl}`);
      const response = await fetch(configUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      CLIENT_CONFIG = await response.json();
      console.log('[QuoteCalc] Config loaded:', CLIENT_CONFIG);
      
      // Initialize with client config
      CONFIG = CLIENT_CONFIG.QUOTE_RESULTS_CONFIG;
      
    } catch (error) {
      console.error('[QuoteCalc] Failed to load client config:', error);
      // Use fallback config
      CONFIG = {
        bands: [
          { maxMi: 50, pricePP: 30 },
          { maxMi: 60, pricePP: 40 },
          { maxMi: 70, pricePP: 50 },
          { maxMi: 999, pricePP: 80 }
        ],
        minPricePP: 30,
        defaultPassengers: 2,
        MINIMUM_PASSENGERS: 2,
        MINIMUM_CHARGE_MESSAGE: "Minimum 2 passengers required. Price shown is for up to 2 people.",
        map: { zoom: 9 }
      };
    }
  }

  // Calculate price based on distance and passengers
  function calculatePrice(distanceMiles, passengers) {
    if (!CONFIG) {
      console.error('[QuoteCalc] No configuration loaded');
      return null;
    }

    // Find the appropriate pricing band
    let pricePerPerson = CONFIG.minPricePP;
    for (const band of CONFIG.bands) {
      if (distanceMiles <= band.maxMi) {
        pricePerPerson = band.pricePP;
        break;
      }
    }

    // Apply 2-person minimum logic
    const minimumPassengers = CONFIG.MINIMUM_PASSENGERS || 2;
    const effectivePassengers = Math.max(passengers, minimumPassengers);
    
    const totalPrice = pricePerPerson * effectivePassengers;
    
    return {
      pricePerPerson,
      passengers,
      effectivePassengers,
      totalPrice,
      isMinimumCharge: passengers < minimumPassengers,
      minimumMessage: CONFIG.MINIMUM_CHARGE_MESSAGE
    };
  }

  // Get distance using Google Maps Distance Matrix API
  async function getDistance(pickup, dropoff) {
    if (!window.google?.maps?.DistanceMatrixService) {
      console.error('[QuoteCalc] Google Maps Distance Matrix API not available');
      return null;
    }

    return new Promise((resolve) => {
      const service = new google.maps.DistanceMatrixService();
      service.getDistanceMatrix({
        origins: [pickup],
        destinations: [dropoff],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.IMPERIAL
      }, (response, status) => {
        if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
          const distance = response.rows[0].elements[0].distance;
          const distanceMiles = distance.value / 1609.34; // Convert meters to miles
          console.log(`[QuoteCalc] Distance calculated: ${distanceMiles.toFixed(1)} miles`);
          resolve(distanceMiles);
        } else {
          console.error('[QuoteCalc] Distance calculation failed:', status);
          resolve(null);
        }
      });
    });
  }

  // Inject CSS styles
  function injectStyles() {
    if (document.getElementById('quote-results-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'quote-results-styles';
    style.textContent = `
      .quote-results {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      .quote-results h2 {
        color: #333;
        margin-bottom: 20px;
        text-align: center;
        font-size: 24px;
      }
      .quote-details {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 6px;
        margin-bottom: 20px;
      }
      .quote-details > div {
        margin-bottom: 10px;
        padding: 8px 0;
        border-bottom: 1px solid #e9ecef;
      }
      .quote-details > div:last-child {
        border-bottom: none;
      }
      .distance-info, .pricing-info, .passenger-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .total-price {
        background: #007bff;
        color: white;
        padding: 15px;
        border-radius: 6px;
        text-align: center;
        font-size: 18px;
        font-weight: bold;
        margin-top: 15px;
      }
      .minimum-notice {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        color: #856404;
        padding: 10px;
        border-radius: 4px;
        margin: 10px 0;
        font-size: 14px;
        text-align: center;
      }
      .quote-actions {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-top: 20px;
      }
      .call-btn, .whatsapp-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
        transition: all 0.3s ease;
      }
      .call-btn {
        background: #28a745;
        color: white;
      }
      .call-btn:hover {
        background: #218838;
        transform: translateY(-2px);
      }
      .whatsapp-btn {
        background: #25d366;
        color: white;
      }
      .whatsapp-btn:hover {
        background: #1ea952;
        transform: translateY(-2px);
      }
      .error {
        text-align: center;
        padding: 40px 20px;
        color: #dc3545;
      }
      .error h2 {
        color: #dc3545;
        margin-bottom: 15px;
      }
      .error p {
        font-size: 16px;
        line-height: 1.5;
      }
      @media (max-width: 768px) {
        .quote-results {
          margin: 10px;
          padding: 15px;
        }
        .quote-actions {
          flex-direction: column;
        }
        .call-btn, .whatsapp-btn {
          width: 100%;
          margin-bottom: 10px;
        }
        .distance-info, .pricing-info, .passenger-info {
          flex-direction: column;
          align-items: flex-start;
        }
        .distance-info strong, .pricing-info strong, .passenger-info strong {
          margin-bottom: 5px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Render quote results
  function renderQuote(quoteData, distanceMiles) {
    const container = document.getElementById('quote-calc');
    if (!container) {
      console.error('[QuoteCalc] Quote container not found');
      return;
    }

    // Inject styles first
    injectStyles();

    const { pricePerPerson, passengers, effectivePassengers, totalPrice, isMinimumCharge, minimumMessage } = quoteData;

    container.innerHTML = `
      <div class="quote-results">
        <h2>Transfer Quote</h2>
        <div class="quote-details">
          <div class="distance-info">
            <strong>Distance:</strong> ${distanceMiles.toFixed(1)} miles
          </div>
          <div class="pricing-info">
            <strong>Price per person:</strong> $${pricePerPerson}
          </div>
          <div class="passenger-info">
            <strong>Passengers:</strong> ${passengers}
            ${isMinimumCharge ? `<br><em>Effective passengers (minimum):</em> ${effectivePassengers}` : ''}
          </div>
          ${isMinimumCharge ? `<div class="minimum-notice">${minimumMessage}</div>` : ''}
          <div class="total-price">
            <strong>Total Price: $${totalPrice}</strong>
          </div>
        </div>
        <div class="quote-actions">
          <button onclick="window.open('tel:${CLIENT_CONFIG?.CONTACT_CONFIG?.phone?.number || '18762814247'}')" class="call-btn">
            Call to Book
          </button>
          <button onclick="window.open('https://wa.me/${CLIENT_CONFIG?.CONTACT_CONFIG?.whatsapp?.number?.replace(/[^0-9]/g, '') || '18762814247'}')" class="whatsapp-btn">
            WhatsApp
          </button>
        </div>
      </div>
    `;
  }

  // Main calculation function
  async function calculate() {
    console.log('[QuoteCalc] Starting calculation...');
    
    // Load client configuration
    await loadClientConfig();
    
    // Get parameters from URL
    const params = new URLSearchParams(window.location.search);
    const pickup = params.get('pickup_location') || params.get('pickup');
    const dropoff = params.get('dropoff_location') || params.get('dropoff');
    const passengers = parseInt(params.get('passengers') || params.get('number_of_passengers') || CONFIG?.defaultPassengers || 2);

    console.log('[QuoteCalc] Parameters:', { pickup, dropoff, passengers });

    if (!pickup || !dropoff) {
      console.error('[QuoteCalc] Missing pickup or dropoff location');
      document.getElementById('quote-calc').innerHTML = `
        <div class="error">
          <h2>Missing Information</h2>
          <p>Please provide both pickup and dropoff locations.</p>
        </div>
      `;
      return;
    }

    // Get distance
    const distanceMiles = await getDistance(pickup, dropoff);
    if (distanceMiles === null) {
      console.error('[QuoteCalc] Could not calculate distance');
      document.getElementById('quote-calc').innerHTML = `
        <div class="error">
          <h2>Distance Calculation Failed</h2>
          <p>Could not calculate distance between locations. Please try again.</p>
        </div>
      `;
      return;
    }

    // Calculate price
    const quoteData = calculatePrice(distanceMiles, passengers);
    if (!quoteData) {
      console.error('[QuoteCalc] Could not calculate price');
      return;
    }

    // Render results
    renderQuote(quoteData, distanceMiles);
  }

  // Load Google Maps if not already loaded
  function loadGoogleMaps() {
    return new Promise((resolve) => {
      if (window.google?.maps) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${window.CFG?.GMAPS_KEY || 'AIzaSyD4gsEcGYTjqAILBU0z3ZNqEwyODGymXjA'}&libraries=places`;
      script.onload = () => {
        console.log('[QuoteCalc] Google Maps loaded');
        resolve();
      };
      script.onerror = () => {
        console.error('[QuoteCalc] Failed to load Google Maps');
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('[QuoteCalc] DOM ready, initializing...');
    
    // Load Google Maps
    await loadGoogleMaps();
    
    // Start calculation
    await calculate();
  });

  // Expose calculate function globally
  window.calculate = calculate;

})();
