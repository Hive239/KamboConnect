
import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, UserCircle, MapPin } from "@/lib/icons";
import { formatDistance } from "../utils/locationUtils"; // Changed path from ../../ to ../
import FavoriteButton from "../favorites/FavoriteButton";

export default function PractitionerCard({
  practitioner,
  averageRating,
  reviewCount,
  onClick,
  size = "medium",
}) {
  const sizeStyles = {
    large: {
      container: "w-64",
      image: "h-64",
      font: "text-base",
    },
    medium: {
      container: "w-48",
      image: "h-48",
      font: "text-sm",
    },
  };

  const currentStyles = sizeStyles[size] || sizeStyles.medium;

  const formatAddress = (address) => {
    if (!address) return "Location not specified";
    const parts = [address.city, address.state_province, address.country];
    return parts.filter(Boolean).join(", ");
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className={`cursor-pointer flex-shrink-0 ${currentStyles.container} relative group`}
      onClick={onClick}
    >
      <Card className="overflow-hidden border-border shadow-sm hover:shadow-lg transition-all duration-300 bg-card h-full">
        <div className={`w-full bg-muted ${currentStyles.image} relative`}>
            {practitioner.profile_image_url ? (
                <img src={practitioner.profile_image_url} alt={practitioner.full_name} className="w-full h-full object-cover" />
            ) : (
                 <div className="w-full h-full flex items-center justify-center bg-muted">
                    <UserCircle className="w-16 h-16 text-muted-foreground" />
                 </div>
            )}
            {/* Verification / tier + reputation badges */}
            <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
              {practitioner.is_verified && (
                <Badge
                  variant={
                    practitioner.listing_tier === 'premium' ? 'premium'
                      : practitioner.listing_tier === 'featured' ? 'featured'
                      : 'verified'
                  }
                  className="rounded-full shadow-sm capitalize"
                >
                  {practitioner.listing_tier === 'premium' ? 'Premium'
                    : practitioner.listing_tier === 'featured' ? 'Featured'
                    : 'Verified'}
                </Badge>
              )}
              {Number(averageRating) >= 4.5 && reviewCount >= 3 && (
                <Badge variant="tier" className="rounded-full shadow-sm gap-1">
                  <Star className="h-3 w-3 fill-warning text-warning" /> Top Rated
                </Badge>
              )}
            </div>
            {/* Distance badge */}
            {practitioner.distance !== null && practitioner.distance !== undefined && (
              <div className="absolute top-3 right-12">
                <Badge variant="info" className="rounded-full shadow-sm">
                  {formatDistance(practitioner.distance)}
                </Badge>
              </div>
            )}
            {/* Favorite button */}
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <FavoriteButton
                itemId={practitioner.id}
                itemType="practitioner"
                itemTitle={practitioner.full_name}
                metadata={{
                  location: formatAddress(practitioner.address),
                  image_url: practitioner.profile_image_url
                }}
                size="sm"
                className="bg-card/90 hover:bg-card shadow-sm"
              />
            </div>
        </div>
        <div className="p-4">
          <h3 className={`font-semibold truncate text-foreground ${currentStyles.font}`}>{practitioner.full_name}</h3>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground truncate flex-1">{formatAddress(practitioner.address)}</p>
            {practitioner.distance !== null && practitioner.distance !== undefined && (
              <div className="flex items-center gap-1 text-xs text-info ml-2">
                <MapPin className="w-3 h-3" />
                {formatDistance(practitioner.distance)}
              </div>
            )}
          </div>
          {/* Only show ratings for verified practitioners */}
          {practitioner.is_verified && reviewCount > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <Star className="w-4 h-4 fill-warning text-warning" />
              <span className="text-sm font-medium text-foreground">{averageRating}</span>
              <span className="text-xs text-muted-foreground">({reviewCount})</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
