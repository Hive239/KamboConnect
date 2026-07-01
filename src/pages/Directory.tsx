
import React, { useState, useEffect, useCallback } from "react";
import { Practitioner, Review } from "@/entities/all";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, UserCircle, MapPin, RefreshCw, Loader2 } from "@/lib/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getCurrentLocation, sortByDistance, filterByRadius } from "../components/utils/locationUtils";
import { useSeo } from "@/lib/useSeo";

import PractitionerCard from "../components/directory/PractitionerCard";
import PractitionerModal from "../components/directory/PractitionerModal";
import FilterModal from "../components/directory/FilterModal";
import SavedSearches from "../components/directory/SavedSearches";
import MapView from "../components/directory/MapView";
import DailyQuote from "../components/directory/DailyQuote";

const formatAddress = (address) => {
    if (!address) return "Location not specified";
    const parts = [address.city, address.state_province, address.country];
    return parts.filter(Boolean).join(", ") || "Location not specified";
};

export default function Directory() {
  const navigate = useNavigate();
  useSeo({
    title: "Find Trusted Kambo Practitioners — KamboGuide",
    description: "Discover verified Kambo practitioners near you. Search by location, modality, language, and price.",
    jsonLd: { "@context": "https://schema.org", "@type": "WebSite", name: "KamboGuide", url: "https://kamboguide.app" },
  });
  const [practitioners, setPractitioners] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [filteredPractitioners, setFilteredPractitioners] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPractitioner, setSelectedPractitioner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [mapBounds, setMapBounds] = useState(null);
  const [mapPractitioners, setMapPractitioners] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [filters, setFilters] = useState({
    sortBy: "nearest",
    minRating: 0,
    priceRange: [0, 3],
    verificationLevel: "all",
    modalities: [],
    languages: [],
    onlineOnly: false,
    radius: 0, // miles; 0 = any distance
  });

  // Get user location on component mount
  useEffect(() => {
    const getUserLocation = async () => {
      if (filters.sortBy !== "nearest" && !filters.radius) return;
      
      setIsGettingLocation(true);
      try {
        const location = await getCurrentLocation();
        setUserLocation(location);
        setLocationError(null);
      } catch (error) {
        console.warn("Could not get user location:", error.message);
        setLocationError(error.message);
        setUserLocation(null);
      } finally {
        setIsGettingLocation(false);
      }
    };

    getUserLocation();
  }, [filters.sortBy, filters.radius]);

  const getPractitionerReviews = useCallback((practitionerId) => {
    return reviews.filter(review => review.practitioner_id === practitionerId);
  }, [reviews]);

  const getAverageRating = useCallback((practitionerId) => {
    const practitionerReviews = getPractitionerReviews(practitionerId);
    if (practitionerReviews.length === 0) return 0;
    const sum = practitionerReviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / practitionerReviews.length).toFixed(1);
  }, [getPractitionerReviews]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const practitionersData = await Practitioner.list("-created_date");

      // Ensure essential fields have defaults. Tier comes from the practitioner's
      // active subscription (set on the row); default to 'basic' when unset.
      const practitionersWithDetails = practitionersData.map(p => {
        if (!p.address) p.address = {};
        if (!p.listing_tier) p.listing_tier = 'basic';
        return p;
      });

      // Real reviews from the data layer (normalize rating field for the UI helpers)
      const reviewsData = await Review.list("-created_date");
      const normalizedReviews = reviewsData.map(r => ({ ...r, rating: r.overall_rating ?? r.rating }));

      setPractitioners(practitionersWithDetails);
      setReviews(normalizedReviews);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filterPractitioners = useCallback(() => {
    let filtered = practitioners.filter(practitioner => {
      // Text search
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        practitioner.full_name?.toLowerCase().includes(lowerCaseSearchTerm) ||
        practitioner.address?.city?.toLowerCase().includes(lowerCaseSearchTerm) ||
        practitioner.address?.state_province?.toLowerCase().includes(lowerCaseSearchTerm) ||
        practitioner.address?.country?.toLowerCase().includes(lowerCaseSearchTerm) ||
        (practitioner.specializations || []).some((s) => s.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (practitioner.languages || []).some((l) => l.toLowerCase().includes(lowerCaseSearchTerm)) ||
        practitioner.bio?.toLowerCase().includes(lowerCaseSearchTerm);

      // Rating filter
      const practitionerRating = getAverageRating(practitioner.id);
      const matchesRating = filters.minRating === 0 || practitionerRating >= filters.minRating;

      // Price range filter
      const priceRangeMap = { "$": 0, "$$": 1, "$$$": 2, "$$$$": 3 };
      const practitionerPrice = practitioner.pricing_range ? (priceRangeMap[practitioner.pricing_range] || 0) : 0;
      const matchesPrice = practitionerPrice >= filters.priceRange[0] && filters.priceRange[1] >= practitionerPrice;

      // Verification filter
      let matchesVerification = true;
      if (filters.verificationLevel === "verified") {
        matchesVerification = practitioner.is_verified;
      } else if (filters.verificationLevel === "advanced") {
        matchesVerification = practitioner.is_verified && practitioner.verification_level === "advanced";
      } else if (filters.verificationLevel === "master") {
        matchesVerification = practitioner.is_verified && practitioner.verification_level === "master";
      }

      // Modality filter (match against specializations/modalities)
      const pm = [...(practitioner.modalities || []), ...(practitioner.specializations || [])].map((s) => s.toLowerCase());
      const matchesModality = !filters.modalities?.length || filters.modalities.some((m) => pm.some((x) => x.includes(m.toLowerCase())));

      // Language filter
      const pl = (practitioner.languages || []).map((s) => s.toLowerCase());
      const matchesLanguage = !filters.languages?.length || filters.languages.some((l) => pl.includes(l.toLowerCase()));

      // Online filter
      const matchesOnline = !filters.onlineOnly || practitioner.is_online;

      return matchesSearch && matchesRating && matchesPrice && matchesVerification && matchesModality && matchesLanguage && matchesOnline;
    });

    // Radius filter (near me) — needs a location
    if (filters.radius && userLocation) {
      filtered = filterByRadius(filtered, userLocation, (p) => (p.latitude && p.longitude ? { latitude: p.latitude, longitude: p.longitude } : null), filters.radius);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case "nearest":
        if (userLocation) {
          filtered = sortByDistance(
            filtered, 
            userLocation, 
            (practitioner) => practitioner.latitude && practitioner.longitude ? {
              latitude: practitioner.latitude,
              longitude: practitioner.longitude
            } : null
          );
        }
        break;
      case "rating":
        filtered.sort((a, b) => getAverageRating(b.id) - getAverageRating(a.id));
        break;
      case "experience":
        filtered.sort((a, b) => (b.years_experience || 0) - (a.years_experience || 0));
        break;
      case "newest":
        filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        break;
    }

    setFilteredPractitioners(filtered);
  }, [searchTerm, practitioners, filters, getAverageRating, userLocation]);
  // (filters object covers modalities/languages/onlineOnly/radius)

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterPractitioners();
  }, [searchTerm, practitioners, filters, filterPractitioners]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
  };

  const handleSubmitReview = async (reviewData) => {
    // For mock data, we might just append it or reload the mock reviews
    // In a real app, this would hit the backend and then reload reviews from backend
    await Review.create(reviewData); // Still call the API if it exists, but then reload mock for consistent state
    const newReview = { 
        ...reviewData, 
        id: `mock_rev_${Date.now()}`, // Generate a unique ID for mock review
        created_date: new Date().toISOString()
    };
    setReviews(prevReviews => [...prevReviews, newReview]);
  };
  
  const handleRequestBooking = (practitioner) => {
    if (!practitioner) return;
    navigate(createPageUrl(`BookingRequest?practitionerId=${practitioner.id}`));
    setSelectedPractitioner(null); // Close the modal
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const handleMapPractitionersUpdate = (practitioners) => {
    // This function can be used if we want the map to filter the main list,
    // but for now we'll keep them separate.
  };

  // Updated handler for clicking a practitioner to open the modal
  const handlePractitionerClick = (practitioner, fromMap = false) => {
    setSelectedPractitioner(practitioner);
    // If opened from map, switch back to list view for better UX
    if (fromMap) {
      setViewMode("list");
    }
  };
  
  // Updated categorization logic for 5 sections
  const spotlightedPractitioners = filteredPractitioners
    .filter(p => p.is_verified && p.listing_tier === 'featured' && getAverageRating(p.id) >= 4.0 && (p.years_experience >= 5))
    .sort((a, b) => (b.years_experience || 0) - (a.years_experience || 0));

  const recommendedPractitioners = filteredPractitioners
    .filter(p => p.is_verified && (p.listing_tier === 'featured' || p.listing_tier === 'preferred') && getAverageRating(p.id) >= 3.5 && !spotlightedPractitioners.some(spotP => spotP.id === p.id))
    .sort((a, b) => getAverageRating(b.id) - getAverageRating(a.id));

  const featuredPractitioners = filteredPractitioners
    .filter(p => p.is_verified && p.listing_tier === 'preferred' && !spotlightedPractitioners.some(spotP => spotP.id === p.id) && !recommendedPractitioners.some(recP => recP.id === p.id))
    .sort((a, b) => getAverageRating(b.id) - getAverageRating(a.id));

  const vettedPractitioners = filteredPractitioners
    .filter(p => p.is_verified && (p.listing_tier === 'basic' || !p.listing_tier) &&
      !spotlightedPractitioners.some(spotP => spotP.id === p.id) && 
      !recommendedPractitioners.some(recP => recP.id === p.id) && 
      !featuredPractitioners.some(featP => featP.id === p.id))
    .sort((a, b) => (b.years_experience || 0) - (a.years_experience || 0));

  // Fixed: Ensure unvetted practitioners are those who are NOT verified
  const unvettedPractitioners = filteredPractitioners
    .filter(p => !p.is_verified)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <div className="bg-muted min-h-screen">
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-br from-primary/10 via-background to-clay/10 flex flex-col items-center justify-center text-center p-6 overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-[1]"></div>
         <div className="absolute inset-0 bg-cover bg-center opacity-[0.07]" style={{backgroundImage: "url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2071&auto=format&fit=crop')"}}></div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="font-display text-4xl sm:text-5xl font-semibold text-foreground mb-4 z-10 max-w-2xl tracking-tight"
        >
          Connect with Trusted Practitioners
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg text-muted-foreground mb-4 max-w-lg z-10"
        >
          Find verified Kambo practitioners in your area
        </motion.p>
        
        {/* Location Status */}
        {filters.sortBy === "nearest" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mb-4 z-10"
          >
            {isGettingLocation ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Getting your location...</p>
            ) : userLocation ? (
              <p className="text-sm text-primary">✓ Location detected - showing nearest practitioners</p>
            ) : locationError ? (
              <p className="text-sm text-warning">⚠ Location unavailable - showing all practitioners</p>
            ) : null}
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="w-full max-w-lg z-10"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search by name, location, or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-14 py-4 h-14 text-base rounded-2xl shadow-sm border-0 bg-card/80 backdrop-blur-sm focus:bg-card transition-all"
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-accent rounded-xl w-10 h-10"
              onClick={() => setShowFilterModal(true)}
            >
              <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
          <SavedSearches
            searchTerm={searchTerm}
            filters={filters}
            onApply={(s) => { setSearchTerm(s.search_term || ""); if (s.filters) setFilters((prev) => ({ ...prev, ...s.filters })); }}
          />
        </motion.div>
      </div>
      
      {/* Daily Quote Section */}
      <DailyQuote />

      {/* Main Content Area */}
      <div className="p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {viewMode === 'list' ? (
            <div className="space-y-12">
              {/* Spotlighted Practitioners */}
              {spotlightedPractitioners.length > 0 && (
                <section>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-foreground">Spotlighted Practitioners</h2>
                      <p className="text-muted-foreground">Elite practitioners with exceptional expertise and perfect ratings</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 flex-1 sm:flex-none"
                      >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setViewMode('map')}
                        className="flex items-center gap-2 flex-1 sm:flex-none"
                      >
                        <MapPin className="w-4 h-4" />
                        Map View
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex gap-6 overflow-x-auto pb-4">
                      {spotlightedPractitioners.map(practitioner => (
                        <PractitionerCard 
                          key={practitioner.id}
                          practitioner={practitioner}
                          averageRating={getAverageRating(practitioner.id)}
                          reviewCount={getPractitionerReviews(practitioner.id).length}
                          onClick={() => handlePractitionerClick(practitioner)}
                          size="large"
                        />
                      ))}
                  </div>
                </section>
              )}

              {/* Recommended Practitioners */}
              {recommendedPractitioners.length > 0 && (
                <section className="pt-8 border-t border-border">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Recommended Practitioners</h2>
                  <p className="text-muted-foreground mb-6">Premium verified practitioners with excellent ratings</p>
                  
                  {isLoading ? (
                     <div className="flex gap-4 overflow-x-auto pb-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-48 h-60 bg-muted rounded-2xl animate-pulse flex-shrink-0"></div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {recommendedPractitioners.map(practitioner => (
                        <PractitionerCard 
                            key={practitioner.id}
                            practitioner={practitioner}
                            averageRating={getAverageRating(practitioner.id)}
                            reviewCount={getPractitionerReviews(practitioner.id).length}
                            onClick={() => handlePractitionerClick(practitioner)}
                            size="medium"
                        />
                        ))}
                    </div>
                  )}
                </section>
              )}

              {/* Featured Practitioners */}
              {featuredPractitioners.length > 0 && (
                <section className="pt-8 border-t border-border">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Featured Practitioners</h2>
                  <p className="text-muted-foreground mb-6">Verified practitioners with enhanced profiles</p>
                  
                  {isLoading ? (
                     <div className="flex gap-4 overflow-x-auto pb-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-48 h-60 bg-muted rounded-2xl animate-pulse flex-shrink-0"></div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {featuredPractitioners.map(practitioner => (
                        <PractitionerCard 
                            key={practitioner.id}
                            practitioner={practitioner}
                            averageRating={getAverageRating(practitioner.id)}
                            reviewCount={getPractitionerReviews(practitioner.id).length}
                            onClick={() => handlePractitionerClick(practitioner)}
                            size="medium"
                        />
                        ))}
                    </div>
                  )}
                </section>
              )}

              {/* Vetted Practitioners */}
              {vettedPractitioners.length > 0 && (
                <section className="pt-8 border-t border-border">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Vetted Practitioners</h2>
                  <p className="text-muted-foreground mb-6">Verified practitioners who have met our safety standards</p>
                  
                  {isLoading ? (
                     <div className="flex gap-4 overflow-x-auto pb-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-48 h-60 bg-muted rounded-2xl animate-pulse flex-shrink-0"></div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {vettedPractitioners.map(practitioner => (
                            <PractitionerCard 
                            key={practitioner.id}
                            practitioner={practitioner}
                            averageRating={getAverageRating(practitioner.id)}
                            reviewCount={getPractitionerReviews(practitioner.id).length}
                            onClick={() => handlePractitionerClick(practitioner)}
                            size="medium"
                            />
                        ))}
                    </div>
                  )}
                </section>
              )}

              {/* Unvetted Practitioners */}
              {unvettedPractitioners.length > 0 && (
                <section className="pt-8 border-t border-border">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Unvetted Practitioners</h2>
                  <p className="text-muted-foreground mb-6">New practitioners awaiting verification - exercise extra caution</p>
                  
                  {isLoading ? (
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="w-48 h-60 bg-muted rounded-2xl animate-pulse flex-shrink-0"></div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {unvettedPractitioners.map(practitioner => (
                            <PractitionerCard 
                            key={practitioner.id}
                            practitioner={practitioner}
                            averageRating={getAverageRating(practitioner.id)}
                            reviewCount={getPractitionerReviews(practitioner.id).length}
                            onClick={() => handlePractitionerClick(practitioner)}
                            size="medium"
                            />
                        ))}
                    </div>
                  )}
                </section>
              )}

              {/* Overall No Results Message */}
              {!isLoading && filteredPractitioners.length === 0 && (
                    <div className="text-center py-16">
                        <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No practitioners found</h3>
                        <p className="text-muted-foreground">Try adjusting your search terms or filters.</p>
                    </div>
              )}
            </div>
          ) : (
            <MapView 
              practitioners={filteredPractitioners}
              onPractitionerSelect={(practitioner) => handlePractitionerClick(practitioner, true)}
              onMapPractitionersUpdate={handleMapPractitionersUpdate}
            />
          )}
        </div>
      </div>

      {/* Practitioner Detail Modal */}
      <AnimatePresence>
        {selectedPractitioner && (
            <PractitionerModal
            key={selectedPractitioner.id}
            practitioner={selectedPractitioner}
            reviews={getPractitionerReviews(selectedPractitioner.id)}
            averageRating={getAverageRating(selectedPractitioner.id)}
            onClose={() => setSelectedPractitioner(null)}
            onSubmitReview={handleSubmitReview}
            onRequestBooking={() => handleRequestBooking(selectedPractitioner)}
            />
        )}
      </AnimatePresence>
      
      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />
    </div>
  );
}
