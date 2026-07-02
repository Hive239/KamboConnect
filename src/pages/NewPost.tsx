import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { User } from "@/entities/User";
import { Post } from "@/entities/Post";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";
import { MessageSquare } from "@/lib/icons";
import { ArrowLeft, Send } from "@/lib/icons";
import { emitFeed } from "@/lib/feed";

export default function NewPost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General Discussion");
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        // Not logged in, redirect or handle
        navigate(createPageUrl("Community"));
      }
    };
    fetchUser();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !user) return;
    // Length caps — prevent multi-MB payloads (storage/render abuse).
    if (title.length > 200) { toast.error("Title must be 200 characters or fewer."); return; }
    if (content.length > 20000) { toast.error("Post is too long (20,000 character limit)."); return; }

    setIsSubmitting(true);
    try {
      const newPost = await Post.create({
        title: title.trim().slice(0, 200),
        content,
        category,
        author_id: user.id,
        author_name: user.full_name,
        last_reply_date: new Date().toISOString()
      });
      await emitFeed({
        actor_id: user.id, actor_name: user.full_name, actor_image_url: user.profile_image_url,
        verb: "posted", object_type: "post", object_id: newPost.id,
        summary: title, action_url: `/Post?id=${newPost.id}`,
      });
      toast.success("Post published");
      navigate(createPageUrl(`Post?id=${newPost.id}`));
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error("Couldn't publish. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline','strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link'],
      ['clean']
    ],
  };

  return (
    <div className="bg-card min-h-screen p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to={createPageUrl("Community")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Community
          </Link>
        </div>
        <PageHeader icon={MessageSquare} kicker="Community" title="Start a discussion" subtitle="Share an experience, ask a question, or start a conversation." className="-mx-4 -mt-2 mb-6 sm:-mx-6" />

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create a New Post</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">Title</label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a descriptive title"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General Discussion">General Discussion</SelectItem>
                      <SelectItem value="Experience Sharing">Experience Sharing</SelectItem>
                      <SelectItem value="Q&A">Q&A</SelectItem>
                      <SelectItem value="Integration">Integration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Content</label>
                <div className="bg-card">
                   <ReactQuill 
                    theme="snow" 
                    value={content} 
                    onChange={setContent}
                    modules={quillModules}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || content.trim() === "<p><br></p>" || !content.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Posting..." : "Create Post"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}