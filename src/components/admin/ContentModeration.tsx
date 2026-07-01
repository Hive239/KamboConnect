import React, { useState, useEffect } from "react";
import { Post, Reply, Report } from "@/entities/all";
import { moderateContent } from "@/integrations/Moderation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  MessageSquare, 
  Flag, 
  EyeOff, 
  Trash2, 
  AlertTriangle,
  Search
} from "@/lib/icons";
import { format } from "date-fns";

const ContentItem = ({ content, type, onAction, ai }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            {type === 'post' && (
              <h3 className="font-medium text-lg mb-1">{content.title}</h3>
            )}
            <div className="text-sm text-muted-foreground mb-2">
              By {content.author_name} • {format(new Date(content.created_date), 'MMM d, yyyy')}
              {type === 'post' && (
                <Badge variant="outline" className="ml-2">{content.category}</Badge>
              )}
              {ai?.flagged && (
                <Badge variant="destructive" className="ml-2 gap-1" title={ai.reasons.join(', ')}>
                  <AlertTriangle className="w-3 h-3" /> AI risk {Math.round(ai.score * 100)}%
                </Badge>
              )}
            </div>
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: isExpanded ? content.content : truncateText(content.content) 
              }}
            />
            {content.content.length > 150 && (
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-0 h-auto text-xs"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-2 ml-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onAction(content.id, 'flag')}
            >
              <Flag className="w-3 h-3 mr-1" />
              Flag
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onAction(content.id, 'hide')}
            >
              <EyeOff className="w-3 h-3 mr-1" />
              Hide
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => onAction(content.id, 'delete')}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ContentModeration() {
  const [posts, setPosts] = useState([]);
  const [replies, setReplies] = useState([]);
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [aiScores, setAiScores] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadContent = async () => {
    try {
      const [allPosts, allReplies, reports] = await Promise.all([
        Post.list('-created_date', 50),
        Reply.list('-created_date', 50), 
        Report.filter({ reported_item_type: 'post' })
      ]);
      
      setPosts(allPosts);
      setReplies(allReplies);
      setFlaggedContent(reports);

      // AI moderation pass: score each post/reply so admins see auto-flags.
      const scored = await Promise.all([
        ...allPosts.map(async (p) => [p.id, await moderateContent(`${p.title || ''} ${p.content || ''}`)]),
        ...allReplies.map(async (r) => [r.id, await moderateContent(r.content || '')]),
      ]);
      setAiScores(Object.fromEntries(scored));
    } catch (error) {
      console.error("Failed to load content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const handleContentAction = async (contentId, action) => {
    try {
      switch (action) {
        case 'flag':
          await Report.create({
            reported_item_type: 'post',
            reported_item_id: contentId,
            reporter_id: 'admin',
            reason: 'Admin flagged for review',
            status: 'pending'
          });
          break;
        case 'hide':
          // In a real app, you'd update a 'is_hidden' field
          console.log(`Hiding content ${contentId}`);
          break;
        case 'delete':
          const confirmDelete = window.confirm('Are you sure you want to delete this content? This action cannot be undone.');
          if (confirmDelete) {
            await Post.delete(contentId);
            loadContent(); // Refresh
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action} content:`, error);
    }
  };

  const filteredPosts = posts.filter(post => 
    !searchTerm || 
    post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.author_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReplies = replies.filter(reply => 
    !searchTerm || 
    reply.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reply.author_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Content Moderation
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="posts">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">
            Posts ({filteredPosts.length})
          </TabsTrigger>
          <TabsTrigger value="replies">
            Replies ({filteredReplies.length})
          </TabsTrigger>
          <TabsTrigger value="flagged">
            Flagged ({flaggedContent.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {filteredPosts.map(post => (
            <ContentItem
              key={post.id}
              content={post}
              type="post"
              onAction={handleContentAction}
              ai={aiScores[post.id]}
            />
          ))}
        </TabsContent>

        <TabsContent value="replies" className="space-y-4">
          {filteredReplies.map(reply => (
            <ContentItem
              key={reply.id}
              content={reply}
              type="reply"
              onAction={handleContentAction}
              ai={aiScores[reply.id]}
            />
          ))}
        </TabsContent>

        <TabsContent value="flagged" className="space-y-4">
          {flaggedContent.length > 0 ? (
            flaggedContent.map(report => (
              <Card key={report.id} className="border-orange-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">Flagged Content Report</h4>
                      <p className="text-sm text-muted-foreground mt-1">{report.reason}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Reported {format(new Date(report.created_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-orange-600">
                      Needs Review
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                <p>No flagged content.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}