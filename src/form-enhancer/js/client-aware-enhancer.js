// Client-Aware Form Enhancer - Loads config from client JSON files
(function() {
  'use strict';

  let isInitialized = false;
  let clientConfig = null;

  async function loadClientConfig() {
    try {
      // Get client from window.CLIENT_ID or default to 'demo'
      const clientId = window.CLIENT_ID || 'demo';
      const base = window.BASE_URL || 'krishnalewin-hash/tourism-ui-kit@main';
      
      const configUrl = `https://cdn.jsdelivr.net/gh/${base}/clients/${clientId}.json`;
      console.log(`Loading client config from: ${configUrl}`);
      
      const response = await fetch(configUrl, {
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load client config: ${response.status} ${response.statusText}`);
      }
      
      clientConfig = await response.json();
      console.log('Client config loaded:', clientConfig);
      
      // Set up window.CFG from the client config
      if (clientConfig.WINDOW_CFG) {
        window.CFG = clientConfig.WINDOW_CFG;
        console.log(`Successfully loaded config for client: ${clientId}`, window.CFG);
        return true;
      } else {
        console.warn(`No WINDOW_CFG found for client: ${clientId}. Available keys:`, Object.keys(clientConfig));
        return false;
      }
    } catch (error) {
      console.error('Failed to load client config:', error);
      
      // Fallback: if client config fails, don't block the form entirely
      if (!window.CFG) {
        console.warn('Using fallback configuration');
        window.CFG = {
          GMAPS_KEY: '', // Will cause graceful degradation
          COUNTRIES: ['jm'],
          PLACES: {
            FIELDS: ['place_id','formatted_address','geometry','name','types'],
            TYPES: ['establishment']
          }
        };
      }
      return false;
    }
  }

  async function loadGoogleMaps() {
    if (window.google?.maps) return;
    
    if (!window.CFG || !window.CFG.GMAPS_KEY) {
      console.warn('Form enhancer: No window.CFG.GMAPS_KEY found - Google Maps features will be disabled');
      return;
    }
    
    if (!window.CFG.GMAPS_KEY.trim()) {
      console.warn('Form enhancer: Empty GMAPS_KEY - Google Maps features will be disabled');
      return;
    }
    
    console.log('Loading Google Maps API with key:', window.CFG.GMAPS_KEY.substring(0, 10) + '...');
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${window.CFG.GMAPS_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    return new Promise((resolve, reject) => {
      script.onload = () => {
        console.log('Google Maps API loaded successfully');
        resolve();
      };
      script.onerror = (error) => {
        console.error('Failed to load Google Maps API:', error);
        reject(error);
      };
      document.head.appendChild(script);
    });
  }

  async function enhanceForm() {
    if (isInitialized || !window.google?.maps || !window.CFG) return;
    
    const placesConfig = window.CFG.PLACES || {};
    
    // Find and enhance location fields
    enhanceLocationField(['[data-q="pickup_location"]', '[name="pickup_location"]'], 'pickup_location', placesConfig);
    enhanceLocationField(['[data-q="drop-off_location"]', '[name="drop-off_location"]', '[name="dropoff_location"]'], 'dropoff_location', placesConfig);
    
    // Add form icons
    addFieldIcons();
    
    // Set up data persistence (your existing logic)
    setupDataPersistence();
    
    isInitialized = true;
    console.log('Client-aware form enhancer initialized successfully');
  }

  function enhanceLocationField(selectors, fieldType, placesConfig) {
    const field = findField(selectors);
    if (!field) return;
    
    const autocomplete = new google.maps.places.Autocomplete(field, {
      fields: placesConfig.FIELDS || ['place_id', 'formatted_address', 'geometry', 'name', 'types'],
      types: placesConfig.TYPES || ['establishment'],
      componentRestrictions: {
        country: window.CFG.COUNTRIES || ['jm']
      }
    });
    
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        // Save enhanced location data
        saveFieldData(fieldType, {
          address: place.formatted_address,
          name: place.name,
          place_id: place.place_id,
          types: place.types,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        });
      }
    });
  }

  function findField(selectors) {
    for (const selector of selectors) {
      const field = document.querySelector(selector);
      if (field) return field;
    }
    return null;
  }

  function addFieldIcons() {
    const iconMap = {
      '[data-q="pickup_location"]': getMapPinIcon(),
      '[name="pickup_location"]': getMapPinIcon(),
      '[data-q="drop-off_location"]': getMapPinIcon(),
      '[name="drop-off_location"]': getMapPinIcon(),
      '[name="dropoff_location"]': getMapPinIcon(),
      '[data-q="pickup_date"]': getCalendarIcon(),
      '[name="pickup_date"]': getCalendarIcon(),
      '[data-q="pickup_time"]': getClockIcon(),
      '[name="pickup_time"]': getClockIcon(),
      '[data-q="number_of_passengers"]': getUsersIcon(),
      '[name="number_of_passengers"]': getUsersIcon()
    };

    Object.entries(iconMap).forEach(([selector, icon]) => {
      const field = document.querySelector(selector);
      if (field && !field.parentElement.querySelector('.field-icon')) {
        addIcon(field, icon);
      }
    });
  }

  function addIcon(field, iconSvg) {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.style.width = '100%';
    
    field.parentNode.insertBefore(wrapper, field);
    wrapper.appendChild(field);
    
    const iconElement = document.createElement('div');
    iconElement.className = 'field-icon';
    iconElement.innerHTML = iconSvg;
    iconElement.style.cssText = `
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      z-index: 1;
      opacity: 0.6;
    `;
    
    wrapper.appendChild(iconElement);
    
    // Add padding to field for icon
    field.style.paddingLeft = '40px';
  }

  function getMapPinIcon() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
  }

  function getCalendarIcon() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
  }

  function getClockIcon() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12,6 12,12 16,14"></polyline></svg>`;
  }

  function getUsersIcon() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
  }

  function setupDataPersistence() {
    // Your exact existing logic
    const KEY = 'transfer:last';
    
    const FIELDS = {
      pickup_location:      ['[data-q="pickup_location"]','[name="pickup_location"]'],
      dropoff_location:     ['[data-q="drop-off_location"]','[name="drop-off_location"]','[name="dropoff_location"]'],
      pickup_date:          ['[data-q="pickup_date"]','[name="pickup_date"]'],
      pickup_time:          ['[data-q="pickup_time"]','[name="pickup_time"]'],
      passengers:           ['select[data-q="number_of_passengers"]','[name="number_of_passengers"]','[data-q="number_of_passengers"]'],
      first_name:           ['[name="first_name"]','[data-q="full_name"]'],
      last_name:            ['[name="last_name"]'],
      email:                ['[name="email"]'],
      phone:                ['[name="phone"]']
    };

    function pick(selectorList){
      for (const sel of selectorList) {
        const el = document.querySelector(sel);
        if (el && typeof el.value !== 'undefined') return el.value.trim();
      }
      return '';
    }

    function snapshot(){
      const data = {};
      for (const k of Object.keys(FIELDS)) data[k] = pick(FIELDS[k]);
      return data;
    }

    function save(){
      try {
        const data = snapshot();
        sessionStorage.setItem(KEY, JSON.stringify(data));
      } catch(e) {}
    }

    // Save whenever anything relevant changes
    document.addEventListener('input', save, true);
    document.addEventListener('change', save, true);

    // Extra safety: save right before submit/navigation
    document.addEventListener('click', (e)=>{
      const btn = e.target.closest?.('.ghl-btn.ghl-footer-next, .ghl-btn.ghl-submit-btn');
      if (btn) save();
    }, true);

    window.addEventListener('beforeunload', save);
  }

  function saveFieldData(fieldName, value) {
    try {
      const saved = JSON.parse(sessionStorage.getItem('transfer:last') || '{}');
      saved[fieldName] = value;
      saved.timestamp = Date.now();
      sessionStorage.setItem('transfer:last', JSON.stringify(saved));
    } catch (error) {
      console.warn('Failed to save form data:', error);
    }
  }

  // Initialize when DOM is ready
  async function initialize() {
    try {
      console.log('Initializing client-aware form enhancer...');
      console.log('CLIENT_ID:', window.CLIENT_ID);
      
      // Load client configuration first
      const configLoaded = await loadClientConfig();
      if (!configLoaded) {
        console.warn('Client configuration not loaded - continuing with limited functionality');
      }
      
      // Load Google Maps (only if we have a valid API key)
      if (window.CFG?.GMAPS_KEY?.trim()) {
        await loadGoogleMaps();
      } else {
        console.log('Skipping Google Maps - no API key available');
      }
      
      // Set up data persistence regardless of Google Maps
      setupDataPersistence();
      
      // Wait a bit for form to be ready, then enhance (if Google Maps is available)
      setTimeout(() => {
        if (window.google?.maps) {
          enhanceForm();
        } else {
          console.log('Google Maps not available - form enhancement limited to data persistence');
        }
      }, 1000);
      
    } catch (error) {
      console.error('Failed to initialize client-aware form enhancer:', error);
      
      // Fallback: at least set up data persistence
      try {
        setupDataPersistence();
        console.log('Fallback: data persistence enabled');
      } catch (fallbackError) {
        console.error('Complete initialization failure:', fallbackError);
      }
    }
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();