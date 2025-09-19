export function calculatePricing(basePrice, passengers, vehicleType = 'shuttle') {
  const passengerCount = parseInt(passengers) || 1;
  
  if (vehicleType === 'shuttle') {
    // Shuttle: per-person pricing
    return basePrice * passengerCount;
  } else {
    // Private: base price + passenger surcharge
    const surcharge = Math.max(0, (passengerCount - 4) * 5); // $5 per extra passenger over 4
    return basePrice + surcharge;
  }
}

export function getVehicleRecommendation(passengers) {
  const count = parseInt(passengers) || 1;
  
  if (count <= 2) return 'Either shuttle or private works well';
  if (count <= 4) return 'Private transfer recommended for comfort';
  if (count <= 8) return 'Private transfer required';
  return 'Multiple vehicles or large group transfer needed';
}