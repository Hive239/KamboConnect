import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CommunityResource, User } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowUpRight, Book, Video, Link as LinkIcon, FileText, Shield, Users, Heart, BookOpen, Search, Plus } from "@/lib/icons";
import { toast } from "sonner";
// Small local groupBy (replaces the lodash dependency)
function groupBy<T>(items: T[], key: keyof T | string): Record<string, T[]> {
  return items.reduce((acc: Record<string, T[]>, item: any) => {
    const k = String(item[key]);
    (acc[k] ||= []).push(item);
    return acc;
  }, {});
}

const ResourceCard = ({ resource }) => {
  const typeIcons = {
    Article: <FileText className="w-4 h-4" />,
    Video: <Video className="w-4 h-4" />,
    Book: <Book className="w-4 h-4" />,
    Website: <LinkIcon className="w-4 h-4" />,
  };

  const categoryColors = {
    "Community Guidelines": "from-blue-500 to-indigo-600",
    "Safety Protocols": "from-red-500 to-pink-600", 
    "Integration Practices": "from-primary/50 to-clay",
    "Further Reading": "from-purple-500 to-violet-600"
  };

  const categoryImages = {
    "Community Guidelines": "https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=800",
    "Safety Protocols": "https://images.unsplash.com/photo-1628102490229-93051a85d342?q=80&w=800",
    "Integration Practices": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800",
    "Further Reading": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=800"
  };

  // Internal app routes ("/Education") navigate in-app; real external links open a new tab.
  const isInternal = resource.url?.startsWith("/");
  const hasLink = resource.url && resource.url !== "#";
  const Wrapper = ({ children }) =>
    !hasLink ? (
      <div className="block group">{children}</div>
    ) : isInternal ? (
      <Link to={resource.url} className="block group">{children}</Link>
    ) : (
      <a href={resource.url} target="_blank" rel="noopener noreferrer" className="block group">{children}</a>
    );

  return (
    <Wrapper>
      <Card className="shadow-sm border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
        <div className={`h-32 bg-gradient-to-br ${categoryColors[resource.category]} relative overflow-hidden`}>
          {categoryImages[resource.category] && (
            <img loading="lazy" 
              src={categoryImages[resource.category]} 
              alt={resource.category}
              className="w-full h-full object-cover opacity-30"
            />
          )}
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-3 right-3">
            <ArrowUpRight className="w-5 h-5 text-white opacity-70 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="absolute bottom-3 left-3">
            <Badge variant="outline" className="bg-card/90 text-foreground border-white/50">
              {typeIcons[resource.resource_type]}
              <span className="ml-1">{resource.resource_type}</span>
            </Badge>
          </div>
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg group-hover:text-primary transition-colors">
            {resource.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-muted-foreground leading-relaxed">
            {resource.description}
          </CardDescription>
        </CardContent>
      </Card>
    </Wrapper>
  );
};

const CategoryHeader = ({ category, count }) => {
  const categoryIcons = {
    "Community Guidelines": <Users className="w-6 h-6" />,
    "Safety Protocols": <Shield className="w-6 h-6" />, 
    "Integration Practices": <Heart className="w-6 h-6" />,
    "Further Reading": <BookOpen className="w-6 h-6" />
  };

  const categoryColors = {
    "Community Guidelines": "text-info bg-blue-50 border-info/20",
    "Safety Protocols": "text-red-700 bg-red-50 border-destructive/20",
    "Integration Practices": "text-primary bg-primary/5 border-primary/20", 
    "Further Reading": "text-clay bg-purple-50 border-clay/20"
  };

  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`p-3 rounded-lg border ${categoryColors[category]}`}>
        {categoryIcons[category]}
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">{category}</h2>
        <p className="text-muted-foreground text-sm">{count} {count === 1 ? 'resource' : 'resources'}</p>
      </div>
    </div>
  );
};

export default function ResourcesView() {
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [me, setMe] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", url: "", category: "Further Reading", resource_type: "Article", description: "" });

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      setResources(await CommunityResource.list());
    } catch (e) {
      console.error("Failed to load resources:", e);
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => { fetchResources(); User.me().then(setMe).catch(() => setMe(null)); }, []);

  const submitResource = async () => {
    if (!form.title.trim() || !form.url.trim()) { toast.error("Title and link are required"); return; }
    setSubmitting(true);
    try {
      await CommunityResource.create({ ...form, title: form.title.trim(), url: form.url.trim(), description: form.description.trim() });
      toast.success("Resource submitted");
      setShowSubmit(false);
      setForm({ title: "", url: "", category: "Further Reading", resource_type: "Article", description: "" });
      fetchResources();
    } catch (e) { console.error(e); toast.error("Couldn't submit. Please try again."); }
    finally { setSubmitting(false); }
  };

  const filtered = resources.filter((r: any) =>
    (typeFilter === "All" || r.resource_type === typeFilter) &&
    (!search || `${r.title} ${r.description || ""}`.toLowerCase().includes(search.toLowerCase()))
  );
  const groupedResources = groupBy(filtered, 'category');
  const categoryOrder = ["Community Guidelines", "Safety Protocols", "Integration Practices", "Further Reading"];

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search resources..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 rounded-xl bg-card pl-11" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by type" className="h-11 rounded-xl border border-input bg-card px-3 text-sm">
          {["All", "Article", "Video", "Book", "Website"].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {me && (
          <Button className="h-11 gap-1.5 rounded-xl" onClick={() => setShowSubmit(true)}><Plus className="h-4 w-4" weight="bold" /> Submit</Button>
        )}
      </div>

      <Dialog open={showSubmit} onOpenChange={setShowSubmit}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit a resource</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label htmlFor="r-title">Title</Label><Input id="r-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} maxLength={120} className="mt-1" /></div>
            <div><Label htmlFor="r-url">Link (URL)</Label><Input id="r-url" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://…" className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="r-cat">Category</Label>
                <select id="r-cat" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="mt-1 h-10 w-full rounded-md border border-input bg-card px-2 text-sm">
                  {["Community Guidelines", "Safety Protocols", "Integration Practices", "Further Reading"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="r-type">Type</Label>
                <select id="r-type" value={form.resource_type} onChange={(e) => setForm((f) => ({ ...f, resource_type: e.target.value }))} className="mt-1 h-10 w-full rounded-md border border-input bg-card px-2 text-sm">
                  {["Article", "Video", "Book", "Website"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div><Label htmlFor="r-desc">Description</Label><Textarea id="r-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} maxLength={300} className="mt-1" /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSubmit(false)}>Cancel</Button>
              <Button onClick={submitResource} disabled={submitting || !form.title.trim() || !form.url.trim()}>{submitting ? "Submitting…" : "Submit"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-12">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 shimmer rounded-lg"></div>
                <div>
                  <div className="h-6 w-48 shimmer rounded mb-2"></div>
                  <div className="h-4 w-24 shimmer rounded"></div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-64 shimmer rounded-lg"></div>
                <div className="h-64 shimmer rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {categoryOrder.map(category => (
            groupedResources[category] && (
              <div key={category} className="scroll-mt-6">
                <CategoryHeader 
                  category={category} 
                  count={groupedResources[category].length}
                />
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {groupedResources[category].map(resource => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>
              </div>
            )
          ))}
          
          {/* Empty State */}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-clay/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{resources.length === 0 ? "No Resources Yet" : "No matches"}</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {resources.length === 0 ? "Community resources will appear here as they become available." : "Try a different search or filter."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}