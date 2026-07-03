
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Post, Reply, User, Notification, Practitioner } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MessageSquare, Lock, CheckCircle } from "@/lib/icons";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import { sanitizeHtml } from "@/lib/sanitize";
import { parseMentions } from "@/lib/mentions";
import { Badge } from "@/components/ui/badge";
import ReportButton from "@/components/profile/ReportButton";
import ReactionButton from "@/components/social/ReactionButton";
import ShareButton from "@/components/ShareButton";
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
  const [editingPost, setEditingPost] = useState(false);
  const [editDraft, setEditDraft] = useState({ title: "", content: "" });
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editReplyText, setEditReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null); // { id, name } of the parent reply

  const postId = new URLSearchParams(location.search).get("id");

  const reqRef = useRef(0);
  const loadData = useCallback(async () => {
    if (!postId) {
      navigate(createPageUrl("Community"));
      return;
    }
    // Ignore a stale response if a newer load (different postId) started meanwhile.
    const myReq = ++reqRef.current;
    setIsLoading(true);
    try {
      const [currentUser, postData, postReplies] = await Promise.all([
        User.me().catch(() => null),
        Post.get(postId),
        Reply.filter({ post_id: postId }, "created_date"),
      ]);
      if (myReq !== reqRef.current) return;
      setUser(currentUser);
      setPost(postData);
      setReplies((postReplies || []).filter((r) => !r.is_hidden)); // moderated replies hidden
      try {
        const pracs = await Practitioner.list();
        if (myReq !== reqRef.current) return;
        setPractitionerIds(new Set(pracs.map((p) => p.id)));
      } catch { /* author links are a non-critical enhancement */ }
    } catch (error) {
      if (myReq !== reqRef.current) return;
      console.error("Failed to load post data:", error);
      navigate(createPageUrl("Community"));
    } finally {
      if (myReq === reqRef.current) setIsLoading(false);
    }
  }, [postId, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const canEdit = (authorId) => user && (user.id === authorId || user.role === "admin");

  const startEditPost = () => { setEditDraft({ title: post.title, content: post.content }); setEditingPost(true); };
  const saveEditPost = async () => {
    if (!editDraft.title.trim() || !editDraft.content.trim()) return;
    try {
      await Post.update(post.id, { title: editDraft.title.trim().slice(0, 200), content: editDraft.content });
      setPost((p) => ({ ...p, title: editDraft.title.trim().slice(0, 200), content: editDraft.content }));
      setEditingPost(false);
      toast.success("Post updated");
    } catch (e) { console.error(e); toast.error("Couldn't save changes."); }
  };
  const deletePost = async () => {
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    try {
      await Post.delete(post.id);
      try { const rs = await Reply.filter({ post_id: post.id }); await Promise.all(rs.map((r) => Reply.delete(r.id))); } catch { /* best-effort cleanup */ }
      toast.success("Post deleted");
      navigate(createPageUrl("Community"));
    } catch (e) { console.error(e); toast.error("Couldn't delete the post."); }
  };

  const saveEditReply = async (reply) => {
    if (!editReplyText.trim()) return;
    try {
      await Reply.update(reply.id, { content: editReplyText.trim() });
      setReplies((prev) => prev.map((r) => (r.id === reply.id ? { ...r, content: editReplyText.trim() } : r)));
      setEditingReplyId(null);
      toast.success("Reply updated");
    } catch (e) { console.error(e); toast.error("Couldn't save."); }
  };
  const deleteReply = async (reply) => {
    if (!window.confirm("Delete this reply?")) return;
    try {
      await Reply.delete(reply.id);
      setReplies((prev) => prev.filter((r) => r.id !== reply.id));
      try {
        const next = Math.max(0, (post.reply_count || 1) - 1);
        await Post.update(post.id, { reply_count: next });
        setPost((p) => ({ ...p, reply_count: next }));
      } catch { /* non-fatal */ }
      toast.success("Reply deleted");
    } catch (e) { console.error(e); toast.error("Couldn't delete."); }
  };

  const markAnswer = async (reply) => {
    try {
      // Only one accepted answer per Q&A post.
      await Promise.all(replies.filter((r) => r.is_accepted && r.id !== reply.id).map((r) => Reply.update(r.id, { is_accepted: false })));
      await Reply.update(reply.id, { is_accepted: true });
      setReplies((prev) => prev.map((r) => ({ ...r, is_accepted: r.id === reply.id })));
      if (reply.author_id && reply.author_id !== user?.id) {
        await Notification.create({ user_id: reply.author_id, title: "Your reply was marked as the answer", message: `${user?.full_name || "The author"} accepted your answer on "${post.title}".`, type: "community", related_id: post.id, action_url: createPageUrl(`Post?id=${post.id}`) }).catch(() => {});
      }
      toast.success("Marked as the answer");
    } catch (e) { console.error(e); toast.error("Couldn't mark the answer."); }
  };

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
        parent_id: replyingTo?.id || null, // threaded reply
      });
      setReplyingTo(null);

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
      
      // @mentions — notify any thread participant named in the reply.
      const participants = new Map();
      participants.set(post.author_id, post.author_name);
      replies.forEach((r) => participants.set(r.author_id, r.author_name));
      const people = [...participants].map(([id, name]) => ({ id, name })).filter((p) => p.id);
      const mentioned = parseMentions(newReply, people).filter((m) => m.id !== user.id && m.id !== post.author_id);
      await Promise.all(mentioned.map((m) => Notification.create({
        user_id: m.id,
        title: `${user.full_name} mentioned you`,
        message: `You were mentioned in a reply on "${post.title}".`,
        type: "community",
        related_id: post.id,
        action_url: createPageUrl(`Post?id=${post.id}`),
        sender_image_url: user.profile_image_url,
      }).catch(() => {})));

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
      <div className="flex justify-center items-center min-h-[calc(100dvh-150px)]">
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

  // Build the reply tree. Roots = replies with no parent; a Q&A's accepted answer floats first.
  const isQA = post.category === "Q&A";
  const childrenByParent = {};
  for (const r of replies) { const k = r.parent_id || "__root__"; (childrenByParent[k] ||= []).push(r); }
  const orderReplies = (list) => [...list].sort((a, b) => {
    if (isQA && (a.is_accepted || b.is_accepted)) return (b.is_accepted ? 1 : 0) - (a.is_accepted ? 1 : 0);
    return new Date(a.created_date) - new Date(b.created_date);
  });
  const rootReplies = orderReplies(childrenByParent["__root__"] || []);

  const renderReply = (reply, depth) => {
    const kids = orderReplies(childrenByParent[reply.id] || []);
    return (
      <div key={reply.id} className={depth > 0 ? "ml-6 border-l-2 border-border pl-4" : ""}>
        <Card className={`bg-card ${reply.is_accepted ? "border-primary/50 ring-1 ring-primary/30" : ""}`}>
          <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{reply.author_name.charAt(0)}</AvatarFallback>
              {reply.author_profile_image_url && <AvatarImage src={reply.author_profile_image_url} alt={reply.author_name} />}
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {reply.author_id && practitionerIds.has(reply.author_id) ? (
                  <>
                    <Link to={createPageUrl(`PractitionerProfile?id=${reply.author_id}`)} className="font-semibold text-primary hover:underline">{reply.author_name}</Link>
                    <Badge variant="tier" className="text-[10px]">Practitioner</Badge>
                  </>
                ) : reply.author_id ? (
                  <Link to={createPageUrl(`UserProfile?id=${reply.author_id}`)} className="font-semibold hover:underline">{reply.author_name}</Link>
                ) : (
                  <span className="font-semibold">{reply.author_name}</span>
                )}
                {reply.is_accepted && <Badge className="bg-success/15 text-success text-[10px] gap-1"><CheckCircle className="h-3 w-3" weight="fill" /> Answer</Badge>}
                <span className="text-xs text-muted-foreground">{format(new Date(reply.created_date), "MMM d, yyyy, p")}</span>
              </div>
              {editingReplyId === reply.id ? (
                <div className="mt-1 space-y-2">
                  <Textarea rows={3} value={editReplyText} onChange={(e) => setEditReplyText(e.target.value)} />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingReplyId(null)}>Cancel</Button>
                    <Button size="sm" onClick={() => saveEditReply(reply)} disabled={!editReplyText.trim()}>Save</Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-foreground mt-1">{reply.content}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ReactionButton targetType="reply" targetId={reply.id} />
                    {user && !post.is_locked && depth < 3 && (
                      <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => { setReplyingTo({ id: reply.id, name: reply.author_name }); document.getElementById("reply-composer")?.scrollIntoView({ behavior: "smooth" }); }}>Reply</button>
                    )}
                    {isQA && user && user.id === post.author_id && !reply.is_accepted && (
                      <button className="text-xs font-medium text-success hover:underline" onClick={() => markAnswer(reply)}>Mark as answer</button>
                    )}
                    {canEdit(reply.author_id) && (
                      <>
                        <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => { setEditingReplyId(reply.id); setEditReplyText(reply.content); }}>Edit</button>
                        <button className="text-xs text-muted-foreground hover:text-destructive" onClick={() => deleteReply(reply)}>Delete</button>
                      </>
                    )}
                    {user && user.id !== reply.author_id && (
                      <ReportButton itemType="reply" itemId={reply.id} itemTitle={`reply by ${reply.author_name}`} size="sm" variant="ghost" />
                    )}
                  </div>
                </>
              )}
              {kids.length > 0 && <div className="mt-3 space-y-3">{kids.map((c) => renderReply(c, depth + 1))}</div>}
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 bg-muted min-h-[100dvh]">
      <div className="max-w-4xl mx-auto">
        <PageBreadcrumbs
          className="mb-4"
          items={post.group_id ? [
            { label: "Community", to: createPageUrl("Community") },
            { label: "Groups", to: createPageUrl(`GroupDetail?id=${post.group_id}`) },
            { label: post.title },
          ] : [
            { label: "Community", to: createPageUrl("Community") },
            { label: "Forum", to: createPageUrl("Community") },
            { label: post.title },
          ]}
        />

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-3xl">{post.title}</CardTitle>
              <ShareButton title={post.title} />
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{post.author_name.charAt(0)}</AvatarFallback>
                {post.author_profile_image_url && (
                    <AvatarImage src={post.author_profile_image_url} alt={post.author_name} />
                )}
              </Avatar>
              {post.author_id && practitionerIds.has(post.author_id) ? (
                <span className="flex items-center gap-1.5">
                  <Link to={createPageUrl(`PractitionerProfile?id=${post.author_id}`)} className="text-primary hover:underline">
                    {post.author_name}
                  </Link>
                  <Badge variant="tier" className="text-[10px]">Practitioner</Badge>
                </span>
              ) : post.author_id ? (
                <Link to={createPageUrl(`UserProfile?id=${post.author_id}`)} className="hover:underline">{post.author_name}</Link>
              ) : (
                <span>{post.author_name}</span>
              )}
              <span>•</span>
              <span>{format(new Date(post.created_date), "MMM d, yyyy")}</span>
            </div>
          </CardHeader>
          <CardContent>
            {editingPost ? (
              <div className="space-y-3">
                <Input value={editDraft.title} onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))} maxLength={200} />
                <Textarea rows={8} value={editDraft.content} onChange={(e) => setEditDraft((d) => ({ ...d, content: e.target.value }))} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingPost(false)}>Cancel</Button>
                  <Button size="sm" onClick={saveEditPost} disabled={!editDraft.title.trim() || !editDraft.content.trim()}>Save</Button>
                </div>
              </div>
            ) : (
              <>
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
                />
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
                  <ReactionButton targetType="post" targetId={post.id} size="default" />
                  <div className="flex items-center gap-2">
                    {canEdit(post.author_id) && (
                      <>
                        <Button variant="ghost" size="sm" onClick={startEditPost}>Edit</Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={deletePost}>Delete</Button>
                      </>
                    )}
                    {user && user.id !== post.author_id && (
                      <ReportButton itemType="post" itemId={post.id} itemTitle={post.title} />
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-8">
          <h3 className="text-2xl font-bold mb-4">{replies.length} Replies</h3>
          <div className="space-y-6">
            {rootReplies.map((reply) => renderReply(reply, 0))}
          </div>
        </div>

        {post.is_locked ? (
          <div className="mt-8 flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/60 p-4 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" /> This thread is locked — new replies are disabled.
          </div>
        ) : user && (
          <Card className="mt-8" id="reply-composer">
            <CardHeader>
              <CardTitle>{replyingTo ? `Replying to ${replyingTo.name}` : "Leave a Reply"}</CardTitle>
            </CardHeader>
            <CardContent>
              {replyingTo && (
                <button className="mb-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => setReplyingTo(null)}>Cancel reply — post at top level instead</button>
              )}
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
