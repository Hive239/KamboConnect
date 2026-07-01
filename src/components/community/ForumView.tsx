import React, { useState, useEffect } from "react";
import { Post } from "@/entities/Post";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, MessageSquare, Pin, ArrowRight } from "@/lib/icons";
import { formatDistanceToNow } from "date-fns";
import FavoriteButton from "../favorites/FavoriteButton";

const PostListItem = ({ post }) => {
  const categoryColors = {
    "General Discussion": "bg-blue-100 text-blue-800 border-blue-200",
    "Experience Sharing": "bg-primary/10 text-primary border-primary/20",
    "Q&A": "bg-amber-100 text-amber-800 border-amber-200",
    "Integration": "bg-purple-100 text-purple-800 border-purple-200",
  };

  return (
    <Card className="shadow-sm border-border hover:shadow-md hover:border-input transition-all duration-300 group relative">
        <CardContent className="p-4 flex items-start gap-4">
            <div className="flex-1">
              {post.is_pinned && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium mb-2">
                  <Pin className="w-3.5 h-3.5"/> Pinned Post
                </div>
              )}
              <Link to={createPageUrl(`Post?id=${post.id}`)} className="block group-hover:text-primary transition-colors">
                <h3 className="font-semibold text-foreground text-lg mb-2">{post.title}</h3>
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className={`${categoryColors[post.category]} border`}>{post.category}</Badge>
                <span>by {post.author_name}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(post.last_reply_date || post.created_date), { addSuffix: true })}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="text-2xl font-bold text-foreground">{post.reply_count}</div>
                <div className="text-xs text-muted-foreground">replies</div>
              </div>
              
              {/* Favorite button */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <FavoriteButton
                  itemId={post.id}
                  itemType="post"
                  itemTitle={post.title}
                  metadata={{
                    post_author: post.author_name,
                    category: post.category
                  }}
                  size="sm"
                />
              </div>
              
              <Link to={createPageUrl(`Post?id=${post.id}`)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </div>
        </CardContent>
    </Card>
  );
};


export default function ForumView() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      if (hasFetched) return; // Prevent multiple fetches
      
      setIsLoading(true);
      setHasFetched(true);
      
      try {
        await new Promise(resolve => setTimeout(resolve, 300)); // Add delay to prevent rate limiting
        const allPosts = await Post.list("-last_reply_date");
        // Mock data for reply counts for demo
        const postsWithReplies = allPosts.map((p, i) => ({...p, reply_count: i % 5 + (p.is_pinned ? 5 : 0) }));
        setPosts(postsWithReplies);
      } catch (error) {
        console.error("Failed to load posts:", error);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []); // Empty dependency array to run only once

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const pinnedPosts = filteredPosts.filter(p => p.is_pinned);
  const regularPosts = filteredPosts.filter(p => !p.is_pinned);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Search discussions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-11 rounded-xl bg-card border-input"
          />
        </div>
        <Link to={createPageUrl("NewPost")}>
          <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 h-11 rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="space-y-3">
          {pinnedPosts.map(post => <PostListItem key={post.id} post={post} />)}
          {regularPosts.map(post => <PostListItem key={post.id} post={post} />)}
        </div>
      ) : (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No discussions found</h3>
          <p className="text-muted-foreground">Be the first to start a conversation!</p>
        </div>
      )}
    </div>
  );
}