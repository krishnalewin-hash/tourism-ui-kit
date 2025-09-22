// Enhanced pricing calculator similar to Blacklane/RideLux
export class PricingCalculator {
  constructor(config = {}) {
    this.rates = config.PRICING_RATES || this.getDefaultRates();
    this.gmapsKey = config.GMAPS_KEY;
  }

  getDefaultRates() {
    return {
      shuttle: {
        perMile: 1.50,
        perMinute: 0.50,
        minimum: 25,
        baseRate: 12
      },
      private: {
        perMile: 2.50,
        perMinute: 0.75,
        minimum: 35,
        baseRate: 35
      },
      zones: {
        MBJ_AREA: { shuttle: { base: 12 }, private: { base: 35 } },
        OCHO_RIOS: { shuttle: { base: 25 }, private: { base: 80 } },
        NEGRIL: { shuttle: { base: 28 }, private: { base: 95 } }
      }
    };
  }

  // Get real-time distance and duration using Google Maps
  async getRouteData(pickup, dropoff) {
    if (!window.google || !this.gmapsKey) {
      console.warn('Google Maps not available for distance calculation');
      return null;
    }

    try {
      const service = new google.maps.DistanceMatrixService();
      
      return new Promise((resolve, reject) => {
        service.getDistanceMatrix({
          origins: [pickup],
          destinations: [dropoff],
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.IMPERIAL,
          avoidHighways: false,
          avoidTolls: false
        }, (response, status) => {
          if (status === 'OK' && response.rows[0]?.elements[0]?.status === 'OK') {
            const element = response.rows[0].elements[0];
            resolve({
              distance: element.distance.value * 0.000621371, // meters to miles
              duration: element.duration.value / 60, // seconds to minutes
              distanceText: element.distance.text,
              durationText: element.duration.text
            });
          } else {
            reject(new Error(`Distance calculation failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('Route calculation error:', error);
      return null;
    }
  }

  // Calculate dynamic price like Blacklane/RideLux
  async calculateDynamicPrice(pickup, dropoff, vehicleType = 'shuttle', passengers = 1, dateTime = new Date()) {
    const routeData = await this.getRouteData(pickup, dropoff);
    
    // Fallback to zone-based pricing if Maps API fails
    if (!routeData) {
      return this.getZoneBasedPrice(pickup, dropoff, vehicleType, passengers);
    }

    const rates = this.rates[vehicleType] || this.rates.shuttle;
    
    // Base calculation: distance + time
    let basePrice = 0;
    basePrice += routeData.distance * rates.perMile;
    basePrice += routeData.duration * rates.perMinute;
    basePrice = Math.max(basePrice, rates.minimum);

    // Dynamic adjustments (like surge pricing)
    let surgeMultiplier = 1.0;
    const hour = dateTime.getHours();
    const day = dateTime.getDay();
    
    // Time-based surge
    if (hour >= 22 || hour <= 5) { // Night hours (10pm - 5am)
      surgeMultiplier = 1.25;
    } else if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) { // Rush hours
      surgeMultiplier = 1.15;
    }

    // Weekend premium
    if (day === 0 || day === 6) { // Sunday or Saturday
      surgeMultiplier *= 1.1;
    }

    // Passenger adjustments
    if (vehicleType === 'shuttle') {
      // Shuttle: per-person pricing
      basePrice *= parseInt(passengers) || 1;
    } else {
      // Private: surcharge for large groups
      const passengerCount = parseInt(passengers) || 1;
      if (passengerCount > 4) {
        surgeMultiplier *= (1 + (passengerCount - 4) * 0.05); // 5% per extra passenger
      }
    }

    const finalPrice = Math.round(basePrice * surgeMultiplier);

    return {
      basePrice: Math.round(basePrice),
      finalPrice,
      surgeMultiplier: Math.round(surgeMultiplier * 100) / 100,
      breakdown: {
        distance: `${routeData.distanceText} @ $${rates.perMile}/mile`,
        duration: `${routeData.durationText} @ $${rates.perMinute}/min`,
        surge: surgeMultiplier > 1.05 ? `${Math.round((surgeMultiplier - 1) * 100)}% premium` : null,
        passengers: vehicleType === 'shuttle' ? `${passengers} passengers` : null
      },
      routeData,
      method: 'dynamic'
    };
  }

  // Fallback zone-based pricing (your current system)
  getZoneBasedPrice(pickup, dropoff, vehicleType, passengers = 1) {
    const region = this.classifyRegion(pickup, dropoff);
    const zonePrices = this.rates.zones?.[region]?.[vehicleType];
    
    if (zonePrices) {
      let price = zonePrices.base;
      
      if (vehicleType === 'shuttle') {
        price *= parseInt(passengers) || 1;
      } else if (parseInt(passengers) > 4) {
        price += (parseInt(passengers) - 4) * 5;
      }

      return {
        finalPrice: price,
        basePrice: zonePrices.base,
        surgeMultiplier: 1.0,
        breakdown: {
          zone: `${region} zone rate`,
          passengers: vehicleType === 'shuttle' ? `${passengers} passengers` : null
        },
        routeData: null,
        method: 'zone-based'
      };
    }

    // Ultimate fallback
    const fallbackPrice = vehicleType === 'private' ? 50 : 25;
    return { 
      finalPrice: fallbackPrice * (vehicleType === 'shuttle' ? parseInt(passengers) : 1), 
      basePrice: fallbackPrice, 
      surgeMultiplier: 1.0,
      method: 'fallback'
    };
  }

  classifyRegion(pickup, dropoff) {
    const t = s => (s || "").toLowerCase();
    const a = t(pickup), b = t(dropoff), hay = a + " " + b;
    const isAirport = /(sangster|montego bay intl|montego bay international|mbj|airport)/.test(hay);
    const inMBJ = /(montego\s*bay|ironshore|rose hall|hip strip|gloucester ave)/.test(hay);
    const inOchi = /(ocho\s*rios|st\.?\s*ann|st ann)/.test(hay);
    const inNegril = /(negril|westmoreland|seven mile|bloody bay)/.test(hay);
    
    if ((isAirport && inMBJ) || (inMBJ && isAirport)) return "MBJ_AREA";
    if ((isAirport && inOchi) || (inOchi && isAirport)) return "OCHO_RIOS";
    if ((isAirport && inNegril) || (inNegril && isAirport)) return "NEGRIL";
    return null;
  }
}

// Legacy functions for backward compatibility
export function calculatePricing(basePrice, passengers, vehicleType = 'shuttle') {
  const calculator = new PricingCalculator();
  const result = calculator.getZoneBasedPrice('', '', vehicleType, passengers);
  return result.finalPrice;
}

export function getVehicleRecommendation(passengers) {
  const count = parseInt(passengers) || 1;
  
  if (count <= 2) return 'Either shuttle or private works well';
  if (count <= 4) return 'Private transfer recommended for comfort';
  if (count <= 8) return 'Private transfer required';
  return 'Multiple vehicles or large group transfer needed';
}