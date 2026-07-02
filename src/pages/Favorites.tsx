import React, { useState, useEffect } from 'react';
import { Favorite } from '@/entities/Favorite';
import { User } from '@/entities/User';
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, Search, Calendar, MessageSquare, User as UserIcon,
  MapPin, Loader2, Trash2, ExternalLink
} from '@/lib/icons';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const FavoritePractitionerCard = ({ favorite, onRemove }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={favorite.metadata?.image_url} />
              <AvatarFallback>
                <UserIcon className="w-6 h-6 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{favorite.item_title}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {favorite.metadata?.location || 'Location not available'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Favorited {formatDistanceToNow(new Date(favorite.created_date), { addSuffix: true })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to={createPageUrl(`PractitionerProfile?id=${favorite.item_id}`)}>
                <Button size="sm" variant="outline">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View
                </Button>
              </Link>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => onRemove(favorite.id)}
                className="text-red-500 hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const FavoriteEventCard = ({ favorite, onRemove }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{favorite.item_title}</h3>
              <p className="text-sm text-muted-foreground">
                {favorite.metadata?.event_date ? 
                  new Date(favorite.metadata.event_date).toLocaleDateString() : 
                  'Date TBD'
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Favorited {formatDistanceToNow(new Date(favorite.created_date), { addSuffix: true })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to={createPageUrl('Events')}>
                <Button size="sm" variant="outline">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View
                </Button>
              </Link>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => onRemove(favorite.id)}
                className="text-red-500 hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const FavoritePostCard = ({ favorite, onRemove }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-info" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground line-clamp-2">{favorite.item_title}</h3>
              <p className="text-sm text-muted-foreground">
                by {favorite.metadata?.post_author || 'Unknown author'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Favorited {formatDistanceToNow(new Date(favorite.created_date), { addSuffix: true })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to={createPageUrl(`Post?id=${favorite.item_id}`)}>
                <Button size="sm" variant="outline">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View
                </Button>
              </Link>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => onRemove(favorite.id)}
                className="text-red-500 hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function Favorites() {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const loadFavorites = async () => {
      setIsLoading(true);
      try {
        const currentUser = await User.me();
        setUser(currentUser);

        if (currentUser) {
          // A data-fetch failure here must NOT log the user out (was showing the
          // "Please Log In" screen on transient network errors).
          try {
            const userFavorites = await Favorite.filter(
              { user_id: currentUser.id },
              '-created_date'
            );
            setFavorites(userFavorites);
          } catch (err) {
            console.error('Failed to load favorites:', err);
            toast.error('Could not load your favorites. Please try again.');
          }
        }
      } catch (error) {
        console.error('Not logged in:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, []);

  const removeFavorite = async (favoriteId) => {
    try {
      await Favorite.delete(favoriteId);
      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      toast.error('Could not remove favorite. Please try again.');
    }
  };

  const filteredFavorites = favorites.filter(favorite => {
    const matchesSearch = favorite.item_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || favorite.item_type === activeTab;
    return matchesSearch && matchesTab;
  });

  const favoritesByType = {
    practitioner: filteredFavorites.filter(f => f.item_type === 'practitioner'),
    event: filteredFavorites.filter(f => f.item_type === 'event'),
    post: filteredFavorites.filter(f => f.item_type === 'post')
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center p-6 bg-muted">
        <Heart className="w-16 h-16 text-muted-foreground/40 mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Save Your Favorites</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          Please log in to save practitioners, events, and posts you want to revisit.
        </p>
        <Button onClick={() => User.login()} className="bg-primary hover:bg-primary/90">
          Log In / Sign Up
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-muted min-h-screen">
      <div className="p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <PageHeader icon={Heart} kicker="Saved" title="My Favorites" subtitle="Your saved practitioners, events, and posts" className="-mx-4 -mt-4 mb-6 sm:-mx-6 sm:-mt-6" />

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search your favorites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-card"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-card mb-6">
              <TabsTrigger value="all">
                All ({favorites.length})
              </TabsTrigger>
              <TabsTrigger value="practitioner">
                Practitioners ({favoritesByType.practitioner.length})
              </TabsTrigger>
              <TabsTrigger value="event">
                Events ({favoritesByType.event.length})
              </TabsTrigger>
              <TabsTrigger value="post">
                Posts ({favoritesByType.post.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <AnimatePresence>
                {filteredFavorites.map(favorite => {
                  if (favorite.item_type === 'practitioner') {
                    return <FavoritePractitionerCard key={favorite.id} favorite={favorite} onRemove={removeFavorite} />;
                  }
                  if (favorite.item_type === 'event') {
                    return <FavoriteEventCard key={favorite.id} favorite={favorite} onRemove={removeFavorite} />;
                  }
                  if (favorite.item_type === 'post') {
                    return <FavoritePostCard key={favorite.id} favorite={favorite} onRemove={removeFavorite} />;
                  }
                  return null;
                })}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="practitioner" className="space-y-4">
              <AnimatePresence>
                {favoritesByType.practitioner.map(favorite => (
                  <FavoritePractitionerCard key={favorite.id} favorite={favorite} onRemove={removeFavorite} />
                ))}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="event" className="space-y-4">
              <AnimatePresence>
                {favoritesByType.event.map(favorite => (
                  <FavoriteEventCard key={favorite.id} favorite={favorite} onRemove={removeFavorite} />
                ))}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="post" className="space-y-4">
              <AnimatePresence>
                {favoritesByType.post.map(favorite => (
                  <FavoritePostCard key={favorite.id} favorite={favorite} onRemove={removeFavorite} />
                ))}
              </AnimatePresence>
            </TabsContent>
          </Tabs>

          {/* Empty State */}
          {filteredFavorites.length === 0 && (
            <div className="text-center py-16">
              <Heart className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchTerm ? 'No matching favorites found' : 'No favorites yet'}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchTerm 
                  ? 'Try adjusting your search terms or browse different categories.'
                  : 'Start exploring practitioners, events, and community posts to save your favorites!'
                }
              </p>
              {!searchTerm && (
                <div className="flex gap-4 justify-center mt-6">
                  <Link to={createPageUrl('Directory')}>
                    <Button variant="outline">Browse Practitioners</Button>
                  </Link>
                  <Link to={createPageUrl('Events')}>
                    <Button variant="outline">View Events</Button>
                  </Link>
                  <Link to={createPageUrl('Community')}>
                    <Button variant="outline">Community Posts</Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}