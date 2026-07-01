/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in miles
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Get user's current location using browser geolocation
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = 'An unknown error occurred while retrieving location';
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  });
};

/**
 * Format distance for display
 */
export const formatDistance = (distance) => {
  if (distance === null || distance === undefined) return 'Distance unknown';
  if (distance < 1) return `${(distance * 5280).toFixed(0)} ft`;
  return `${distance} mi`;
};

/**
 * Sort array of items by distance from user location
 */
export const sortByDistance = (items, userLocation, getItemLocation) => {
  if (!userLocation) return items;
  
  return items
    .map(item => {
      const itemLocation = getItemLocation(item);
      const distance = itemLocation ? 
        calculateDistance(
          userLocation.latitude, 
          userLocation.longitude, 
          itemLocation.latitude, 
          itemLocation.longitude
        ) : null;
      
      return { ...item, distance };
    })
    .sort((a, b) => {
      // Items with no distance go to the end
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
};

/**
 * Keep only items within `radiusMiles` of the user. Items with no resolvable
 * location are kept (we don't penalize missing coords). No-op without a location.
 */
export const filterByRadius = (items, userLocation, getItemLocation, radiusMiles) => {
  if (!userLocation || !radiusMiles) return items;
  return items.filter((item) => {
    const loc = getItemLocation(item);
    if (!loc) return true;
    const d = calculateDistance(userLocation.latitude, userLocation.longitude, loc.latitude, loc.longitude);
    return d === null || d <= radiusMiles;
  });
};