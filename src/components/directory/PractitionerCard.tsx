import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, UserCircle, MapPin, Video, CheckCircle } from "@/lib/icons";
import { formatDistance } from "../utils/locationUtils";
import FavoriteButton from "../favorites/FavoriteButton";
import { useSpotlight } from "@/lib/useSpotlight";
import { Spotlight } from "@/components/ui/Spotlight";

/**
 * Fluid, grid-friendly practitioner card. Fills its container (parent controls
 * width via a grid), with an editorial image, tier/verification hierarchy,
 * modality chips, an availability dot, and a hover media zoom.
 */
export default function PractitionerCard({
  practitioner,
  averageRating,
  reviewCount,
  onClick,
  size = "medium",
}) {
  const imageH = size === "large" ? "h-56" : "h-48";

  const formatAddress = (address) => {
    if (!address) return "Location not specified";
    return [address.city, address.state_province, address.country].filter(Boolean).join(", ");
  };

  const modalities = (practitioner.modalities || practitioner.specializations || []).slice(0, 2);
  const hasDistance = practitioner.distance !== null && practitioner.distance !== undefined;
  const topRated = Number(averageRating) >= 4.5 && reviewCount >= 3;
  const { onMouseMove } = useSpotlight();

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={`group relative h-full w-full cursor-pointer ${practitioner.listing_tier === "featured" ? "gradient-border shadow-glow" : ""}`}
      onClick={onClick}
      onMouseMove={onMouseMove}
    >
      <Card className="relative flex h-full flex-col overflow-hidden border-border transition-shadow duration-300 hover:shadow-lg">
        <Spotlight className="z-10" />
        {/* Media */}
        <div className={`relative w-full ${imageH} overflow-hidden bg-muted`}>
          {practitioner.profile_image_url ? (
            <img
              loading="lazy"
              src={practitioner.profile_image_url}
              alt={practitioner.full_name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <UserCircle className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          {/* subtle gradient for legibility */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />

          {/* Verification / tier + reputation badges */}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {practitioner.is_verified && (
              <Badge
                variant={
                  practitioner.listing_tier === "featured" ? "featured"
                    : practitioner.listing_tier === "preferred" ? "preferred"
                    : "basic"
                }
                className="rounded-full capitalize shadow-sm"
              >
                {practitioner.listing_tier === "featured" ? "Featured"
                  : practitioner.listing_tier === "preferred" ? "Preferred"
                  : "Verified"}
              </Badge>
            )}
            {topRated && (
              <Badge variant="tier" className="gap-1 rounded-full shadow-sm">
                <Star className="h-3 w-3 fill-warning text-warning" /> Top Rated
              </Badge>
            )}
          </div>

          {/* Distance badge */}
          {hasDistance && (
            <div className="absolute right-3 top-3">
              <Badge variant="info" className="rounded-full shadow-sm">{formatDistance(practitioner.distance)}</Badge>
            </div>
          )}

          {/* Favorite button (reveal on hover) */}
          <div className="absolute bottom-3 right-3 opacity-0 transition-opacity group-hover:opacity-100">
            <FavoriteButton
              itemId={practitioner.id}
              itemType="practitioner"
              itemTitle={practitioner.full_name}
              metadata={{ location: formatAddress(practitioner.address), image_url: practitioner.profile_image_url }}
              size="sm"
              className="bg-card/90 shadow-sm hover:bg-card"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold text-foreground">{practitioner.full_name}</h3>
            {practitioner.is_verified && (
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" weight="fill" />
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" /> {formatAddress(practitioner.address)}
          </p>

          {/* Modality chips */}
          {modalities.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {modalities.map((m) => (
                <span key={m} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                  {m}
                </span>
              ))}
            </div>
          )}

          {/* Footer: rating + availability */}
          <div className="mt-auto flex items-center justify-between pt-3">
            {practitioner.is_verified && reviewCount > 0 ? (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-warning text-warning" />
                <span className="text-sm font-medium text-foreground">{averageRating}</span>
                <span className="text-xs text-muted-foreground">({reviewCount})</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">New</span>
            )}
            {practitioner.is_online && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                <Video className="h-3.5 w-3.5" weight="duotone" /> Online
              </span>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
