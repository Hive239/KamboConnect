import React, { useState } from 'react';
import { Heart } from '@/lib/icons';
import { Button } from "@/components/ui/button";
import { Favorite } from '@/entities/Favorite';
import { User } from '@/entities/User';
import { useCurrentUser, useMyFavorites, useDataInvalidator } from '@/lib/useCurrentUser';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function FavoriteButton({
  itemId,
  itemType,
  itemTitle,
  metadata = {},
  className = "",
  size = "default"
}) {
  const { data: user } = useCurrentUser();
  const { data: favorites } = useMyFavorites();
  const invalidate = useDataInvalidator();
  const [isLoading, setIsLoading] = useState(false);

  const existing = (favorites || []).find(f => f.item_id === itemId && f.item_type === itemType);
  const isFavorited = !!existing;

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { await User.login(); return; }

    setIsLoading(true);
    try {
      if (existing) {
        await Favorite.delete(existing.id);
      } else {
        await Favorite.create({ user_id: user.id, item_id: itemId, item_type: itemType, item_title: itemTitle, metadata });
      }
      invalidate('favorites');
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "h-8 w-8",
    default: "h-10 w-10",
    lg: "h-12 w-12"
  };

  const iconSizes = {
    sm: "w-4 h-4",
    default: "w-5 h-5", 
    lg: "w-6 h-6"
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFavorited}
      onClick={toggleFavorite}
      disabled={isLoading}
      className={cn(
        "relative hover:bg-destructive/10 hover:text-destructive transition-all",
        sizeClasses[size],
        className
      )}
    >
      <motion.div
        animate={{ 
          scale: isFavorited ? [1, 1.2, 1] : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <Heart 
          className={cn(
            iconSizes[size],
            "transition-all duration-200",
            isFavorited 
              ? "fill-red-500 text-red-500" 
              : "text-muted-foreground hover:text-red-500"
          )} 
        />
      </motion.div>
      {isFavorited && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.5, 1] }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 pointer-events-none"
        >
          <Heart className={cn(iconSizes[size], "text-red-500 fill-red-500 m-auto mt-2")} />
        </motion.div>
      )}
    </Button>
  );
}