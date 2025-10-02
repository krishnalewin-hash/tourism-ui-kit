import { loadScript, base64Encode, decodeParams } from '../../shared/js/utils.js';

class FormEnhancer {
  constructor() {
    this.config = null;
    this.placesService = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Load client configuration
      const client = window.CFG?.client || 'tour-driver';
      const base = window.CFG?.base || 'krishnalewin-hash/tourism-ui-kit@main';
      
      const configResponse = await fetch(`https://cdn.jsdelivr.net/gh/${base}/clients/${client}.json`);
      this.config = await configResponse.json();
      
      if (!this.config.FORM_CONFIG) {
        console.warn('No FORM_CONFIG found for client:', client);
        return;
      }
      
      // Load Google Maps API
      await this.loadGoogleMaps();
      
      // Initialize form enhancements
      await this.enhanceForm();
      
      this.isInitialized = true;
      console.log('Form enhancer initialized for client:', client);
      
    } catch (error) {
      console.error('Failed to initialize form enhancer:', error);
    }
  }

  async loadGoogleMaps() {
    if (window.google?.maps) return;
    
    const apiKey = this.config.FORM_CONFIG.GMAPS_KEY;
    if (!apiKey) {
      console.warn('No Google Maps API key configured');
      return;
    }
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    return new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async enhanceForm() {
    if (!window.google?.maps) return;
    
    const mapping = this.config.FORM_CONFIG.FIELD_MAPPING;
    const placesConfig = this.config.FORM_CONFIG.PLACES;
    
    // Find and enhance location fields
    this.enhanceLocationField(mapping.pickup_location, 'pickup', placesConfig);
    this.enhanceLocationField(mapping.dropoff_location, 'dropoff', placesConfig);
    
    // Add form icons
    this.addFieldIcons();
    
    // Set up data persistence
    this.setupDataPersistence();
    
    // Restore saved data
    this.restoreSavedData();
  }

  enhanceLocationField(selectors, fieldType, placesConfig) {
    const field = this.findField(selectors);
    if (!field) return;
    
    const autocomplete = new google.maps.places.Autocomplete(field, {
      fields: placesConfig.FIELDS,
      types: placesConfig.TYPES,
      componentRestrictions: {
        country: this.config.FORM_CONFIG.COUNTRIES
      }
    });
    
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        this.saveFieldData(fieldType + '_location', {
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

  findField(selectors) {
    for (const selector of selectors) {
      const field = document.querySelector(selector);
      if (field) return field;
    }
    return null;
  }

  addFieldIcons() {
    const iconMap = {
      pickup_location: this.getMapPinIcon(),
      dropoff_location: this.getMapPinIcon(),
      pickup_date: this.getCalendarIcon(),
      pickup_time: this.getClockIcon(),
      passengers: this.getUsersIcon()
    };

    Object.entries(this.config.FORM_CONFIG.FIELD_MAPPING).forEach(([fieldName, selectors]) => {
      const field = this.findField(selectors);
      const icon = iconMap[fieldName];
      
      if (field && icon && !field.parentElement.querySelector('.field-icon')) {
        this.addIcon(field, icon);
      }
    });
  }

  addIcon(field, iconSvg) {
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

  getMapPinIcon() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
  }

  getCalendarIcon() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
  }

  getClockIcon() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12,6 12,12 16,14"></polyline></svg>`;
  }

  getUsersIcon() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
  }

  setupDataPersistence() {
    const form = document.querySelector('form');
    if (!form) return;
    
    // Save data on input changes
    Object.entries(this.config.FORM_CONFIG.FIELD_MAPPING).forEach(([fieldName, selectors]) => {
      const field = this.findField(selectors);
      if (field) {
        field.addEventListener('input', () => {
          this.saveFieldData(fieldName, field.value);
        });
        
        field.addEventListener('change', () => {
          this.saveFieldData(fieldName, field.value);
        });
      }
    });
  }

  saveFieldData(fieldName, value) {
    try {
      const saved = JSON.parse(sessionStorage.getItem('transfer:last') || '{}');
      saved[fieldName] = value;
      saved.timestamp = Date.now();
      saved.client = window.CFG?.client || 'tour-driver';
      sessionStorage.setItem('transfer:last', JSON.stringify(saved));
    } catch (error) {
      console.warn('Failed to save form data:', error);
    }
  }

  restoreSavedData() {
    try {
      const saved = JSON.parse(sessionStorage.getItem('transfer:last') || '{}');
      
      Object.entries(this.config.FORM_CONFIG.FIELD_MAPPING).forEach(([fieldName, selectors]) => {
        const field = this.findField(selectors);
        const value = saved[fieldName];
        
        if (field && value && typeof value === 'string') {
          field.value = value;
        }
      });
    } catch (error) {
      console.warn('Failed to restore form data:', error);
    }
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const enhancer = new FormEnhancer();
    enhancer.initialize();
  });
} else {
  const enhancer = new FormEnhancer();
  enhancer.initialize();
}

export default FormEnhancer;