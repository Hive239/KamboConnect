import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { 
  Crosshair, Search, Loader2, MapPin
} from '@/lib/icons';
import L from 'leaflet';

// Fix default marker icons to ensure they render correctly.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map invalidation
const MapInitializer = () => {
  const map = useMap();
  
  useEffect(() => {
    // Invalidate size when component mounts to ensure proper rendering
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [map]);
  
  return null;
};

const MapEventHandler = ({ onBoundsChange, setMapBounds }) => {
  const map = useMap();
  
  const handleMoveEnd = useCallback(() => {
    const bounds = map.getBounds();
    const newBounds = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
      center: map.getCenter()
    };
    setMapBounds(newBounds);
    onBoundsChange(newBounds);
  }, [map, onBoundsChange, setMapBounds]);

  useMapEvents({
    moveend: handleMoveEnd,
    zoomend: handleMoveEnd,
  });

  return null;
};

const MyLocationButton = ({ onLocationFound, isLoading }) => {
  const map = useMap();
  
  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], 12);
          onLocationFound({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your location. Please enable location services.');
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <Button
      onClick={handleMyLocation}
      disabled={isLoading}
      className="absolute bottom-4 right-4 z-[1000] bg-card hover:bg-accent text-foreground border border-input shadow-lg"
      size="icon"
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
      <span className="sr-only">My Location</span>
    </Button>
  );
};

const SearchAreaButton = ({ onSearchArea, isVisible, isLoading }) => {
  if (!isVisible) return null;

  return (
    <Button
      onClick={onSearchArea}
      disabled={isLoading}
      className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-card hover:bg-accent text-foreground border border-input shadow-lg"
      size="sm"
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
      Search This Area
    </Button>
  );
};

const MapView = ({ 
  practitioners, 
  onPractitionerSelect,
  onMapPractitionersUpdate 
}) => {
  const [userLocation, setUserLocation] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [mapBounds, setMapBounds] = useState(null);
  const [isSearchAreaVisible, setIsSearchAreaVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef();

  const practitionersWithCoords = practitioners.filter(p => p.latitude && p.longitude);
  
  const mapCenter = userLocation 
    ? [userLocation.lat, userLocation.lng]
    : practitionersWithCoords.length > 0
    ? [practitionersWithCoords[0].latitude, practitionersWithCoords[0].longitude]
    : [39.8283, -98.5795]; // Center of the US

  const handleLocationFound = (location) => {
    setUserLocation(location);
    setIsLocationLoading(false);
  };

  const handleBoundsChange = useCallback(() => {
    setIsSearchAreaVisible(true);
  }, []);

  const handleSearchArea = useCallback(() => {
    if (!mapBounds) return;
    setIsSearching(true);
    setIsSearchAreaVisible(false);
    
    const practitionersInBounds = practitioners.filter(p => 
      p.latitude && p.longitude &&
      p.latitude >= mapBounds.south &&
      p.latitude <= mapBounds.north &&
      p.longitude >= mapBounds.west &&
      p.longitude <= mapBounds.east
    );

    onMapPractitionersUpdate(practitionersInBounds);

    setTimeout(() => setIsSearching(false), 500);
  }, [practitioners, mapBounds, onMapPractitionersUpdate]);

  // Handle click on the "View Profile" button inside a map popup
  const handleViewProfileClick = (practitioner) => {
    if (mapRef.current) {
        mapRef.current.closePopup();
    }
    onPractitionerSelect(practitioner);
  };

  if (practitionersWithCoords.length === 0) {
    return (
      <div className="h-96 w-full bg-muted flex items-center justify-center rounded-lg border">
        <div className="text-center p-8">
          <MapPin className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No practitioners with location data</h3>
          <p className="text-muted-foreground">Switch to list view to see all practitioners.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 relative bg-card rounded-lg border overflow-hidden">
      <MapContainer 
        center={mapCenter} 
        zoom={practitionersWithCoords.length > 0 ? 10 : 4} 
        scrollWheelZoom={true} 
        className="w-full h-full"
        ref={mapRef}
        style={{ height: '100%', width: '100%' }}
      >
        <MapInitializer />
        
        <TileLayer
          attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapEventHandler 
          onBoundsChange={handleBoundsChange}
          setMapBounds={setMapBounds}
        />

        <MyLocationButton 
          onLocationFound={handleLocationFound}
          isLoading={isLocationLoading}
        />

        <SearchAreaButton 
          onSearchArea={handleSearchArea}
          isVisible={isSearchAreaVisible}
          isLoading={isSearching}
        />

        {practitionersWithCoords.map(practitioner => (
          <Marker
            key={practitioner.id}
            position={[practitioner.latitude, practitioner.longitude]}
          >
            <Popup>
              <div className="text-center p-2">
                <h3 className="font-semibold text-foreground mb-1">{practitioner.full_name}</h3>
                {practitioner.address && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {[practitioner.address.city, practitioner.address.state_province].filter(Boolean).join(", ")}
                  </p>
                )}
                <Button 
                  size="sm" 
                  onClick={() => handleViewProfileClick(practitioner)}
                  className="bg-primary hover:bg-primary/90"
                >
                  View Profile
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;