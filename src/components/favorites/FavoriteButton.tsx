import React, { useState, useEffect } from 'react';
import { Heart } from '@/lib/icons';
import { Button } from "@/components/ui/button";
import { Favorite } from '@/entities/Favorite';
import { User } from '@/entities/User';
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
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const loadUserAndFavoriteStatus = async () => {
      if (hasFetched) return; // Prevent multiple fetches
      
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        setHasFetched(true);
        
        if (currentUser) {
          await new Promise(resolve => setTimeout(resolve, 150)); // Add delay to prevent rate limiting
          const existingFavorite = await Favorite.filter({
            user_id: currentUser.id,
            item_id: itemId,
            item_type: itemType
          });
          setIsFavorited(existingFavorite.length > 0);
        }
      } catch (error) {
        // User not logged in or other error
        console.warn("Could not load favorite status:", error.message);
        setUser(null);
        setHasFetched(true);
      }
    };

    loadUserAndFavoriteStatus();
  }, [itemId, itemType, hasFetched]);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      // Optionally redirect to login or show message
      await User.login();
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorited) {
        // Remove favorite - optimistically update UI first
        setIsFavorited(false);
        
        // Add delay before API call to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        const existingFavorites = await Favorite.filter({
          user_id: user.id,
          item_id: itemId,
          item_type: itemType
        });
        
        if (existingFavorites.length > 0) {
          await Favorite.delete(existingFavorites[0].id);
        }
      } else {
        // Add favorite - optimistically update UI first
        setIsFavorited(true);
        
        // Add delay before API call to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        await Favorite.create({
          user_id: user.id,
          item_id: itemId,
          item_type: itemType,
          item_title: itemTitle,
          metadata
        });
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      // Revert optimistic update on error
      setIsFavorited(!isFavorited);
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