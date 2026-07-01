
import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Post, Reply, User, Notification, Practitioner } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, MessageSquare } from "@/lib/icons";
import { format } from "date-fns";
import 'react-quill/dist/quill.snow.css';

export default function PostPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [user, setUser] = useState(null);
  const [newReply, setNewReply] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Changed from isReplying to isSubmitting
  // Author names link to a public profile only when the author is a practitioner.
  const [practitionerIds, setPractitionerIds] = useState(() => new Set());

  const postId = new URLSearchParams(location.search).get("id");

  const loadData = useCallback(async () => {
    if (!postId) {
      navigate(createPageUrl("Community"));
      return;
    }
    setIsLoading(true);
    try {
      const [currentUser, postData, postReplies] = await Promise.all([
        User.me().catch(() => null),
        Post.get(postId),
        Reply.filter({ post_id: postId }, "created_date"),
      ]);
      setUser(currentUser);
      setPost(postData);
      setReplies(postReplies);
      try {
        const pracs = await Practitioner.list();
        setPractitionerIds(new Set(pracs.map((p) => p.id)));
      } catch { /* author links are a non-critical enhancement */ }
    } catch (error) {
      console.error("Failed to load post data:", error);
      navigate(createPageUrl("Community"));
    } finally {
      setIsLoading(false);
    }
  }, [postId, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReplySubmit = async (e) => {
    e.preventDefault(); // Keep preventDefault for form submission
    if (!newReply.trim() || !user || !post) return; // Added !post check for safety
    setIsSubmitting(true); // Use isSubmitting
    try {
      const createdReply = await Reply.create({
        post_id: post.id, // Use post.id directly
        content: newReply,
        author_id: user.id,
        author_name: user.full_name,
      });

      // Update post's reply_count and last_reply_date
      await Post.update(post.id, {
        reply_count: (post.reply_count || 0) + 1,
        last_reply_date: new Date().toISOString(),
      });
      
      // Notify original post author
      if (user.id !== post.author_id) {
          await Notification.create({
              user_id: post.author_id,
              title: "New reply on your post", // Updated title
              message: `${user.full_name} replied to your post: "${post.title}"`, // Updated message
              type: 'community',
              related_id: post.id,
              action_url: createPageUrl(`Post?id=${post.id}`),
              sender_image_url: user.profile_image_url, // Changed from || null
          });
      }
      
      // Optimistically add the new reply to the list
      // Include author_profile_image_url for avatar rendering
      setReplies(prev => [...prev, { ...createdReply, author_profile_image_url: user.profile_image_url }]);
      setNewReply("");
      // loadData() is no longer needed here due to optimistic update
    } catch (error) {
      console.error("Failed to submit reply:", error);
    } finally {
      setIsSubmitting(false); // Use isSubmitting
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-150px)]">
        <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold">Post not found</h2>
        <p className="text-muted-foreground">The post you're looking for doesn't exist.</p>
        <Button asChild className="mt-4">
          <Link to={createPageUrl("Community")}>Back to Community</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-muted min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Button variant="ghost" asChild>
            <Link to={createPageUrl("Community")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Community
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{post.title}</CardTitle>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{post.author_name.charAt(0)}</AvatarFallback>
                {post.author_profile_image_url && (
                    <AvatarImage src={post.author_profile_image_url} alt={post.author_name} />
                )}
              </Avatar>
              {post.author_id && practitionerIds.has(post.author_id) ? (
                <Link to={createPageUrl(`PractitionerProfile?id=${post.author_id}`)} className="text-primary hover:underline">
                  {post.author_name}
                </Link>
              ) : (
                <span>{post.author_name}</span>
              )}
              <span>•</span>
              <span>{format(new Date(post.created_date), "MMM d, yyyy")}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </CardContent>
        </Card>

        <div className="mt-8">
          <h3 className="text-2xl font-bold mb-4">{replies.length} Replies</h3>
          <div className="space-y-6">
            {replies.map((reply) => (
              <Card key={reply.id} className="bg-card">
                <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
                   <Avatar className="h-10 w-10">
                    <AvatarFallback>{reply.author_name.charAt(0)}</AvatarFallback>
                    {reply.author_profile_image_url && (
                        <AvatarImage src={reply.author_profile_image_url} alt={reply.author_name} />
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {reply.author_id && practitionerIds.has(reply.author_id) ? (
                        <Link to={createPageUrl(`PractitionerProfile?id=${reply.author_id}`)} className="font-semibold text-primary hover:underline">
                          {reply.author_name}
                        </Link>
                      ) : (
                        <span className="font-semibold">{reply.author_name}</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(reply.created_date), "MMM d, yyyy, p")}
                      </span>
                    </div>
                    <p className="text-foreground mt-1">{reply.content}</p>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {user && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Leave a Reply</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReplySubmit} className="space-y-4">
                <Textarea
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={4}
                  required
                />
                <Button type="submit" disabled={isSubmitting}> {/* Use isSubmitting */}
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Post Reply
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
        {!user && (
            <div className="text-center mt-8 p-6 bg-muted rounded-lg">
                <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground mb-2"/>
                <p className="font-semibold">Want to join the conversation?</p>
                <p className="text-sm text-muted-foreground mb-4">You must be logged in to reply.</p>
                <Button onClick={() => User.login()}>Log In</Button>
            </div>
        )}
      </div>
    </div>
  );
}
