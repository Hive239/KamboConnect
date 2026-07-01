import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CommunityResource } from "@/entities/CommunityResource";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Book, Video, Link as LinkIcon, FileText, Shield, Users, Heart, BookOpen } from "@/lib/icons";
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
            <img 
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
    "Community Guidelines": "text-blue-600 bg-blue-50 border-blue-200",
    "Safety Protocols": "text-red-600 bg-red-50 border-red-200",
    "Integration Practices": "text-primary bg-primary/5 border-primary/20", 
    "Further Reading": "text-purple-600 bg-purple-50 border-purple-200"
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

  useEffect(() => {
    const fetchResources = async () => {
      setIsLoading(true);
      const allResources = await CommunityResource.list();
      setResources(allResources);
      setIsLoading(false);
    };
    fetchResources();
  }, []);

  const groupedResources = groupBy(resources, 'category');
  const categoryOrder = ["Community Guidelines", "Safety Protocols", "Integration Practices", "Further Reading"];

  return (
    <div className="space-y-12">
      {isLoading ? (
        <div className="space-y-12">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-muted rounded-lg animate-pulse"></div>
                <div>
                  <div className="h-6 w-48 bg-muted rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-64 bg-muted rounded-lg animate-pulse"></div>
                <div className="h-64 bg-muted rounded-lg animate-pulse"></div>
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
          {resources.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-clay/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No Resources Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Community resources will appear here as they become available. Check back soon!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}