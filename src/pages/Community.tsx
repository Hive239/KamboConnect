import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookText, MessageSquare, Sparkle, UsersThree } from "@/lib/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { useSeo } from "@/lib/useSeo";

import FeedView from "../components/community/FeedView";
import ForumView from "../components/community/ForumView";
import GroupsView from "../components/community/GroupsView";
import ResourcesView from "../components/community/ResourcesView";

const triggerCls = "rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary gap-2";

export default function Community() {
  useSeo({ title: "Community — KamboGuide", description: "Connect, share, and learn with the Kambo community." });
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "feed";
  return (
    <div className="bg-muted min-h-screen">
      <PageHeader icon={UsersThree} kicker="Community" title="Community Hub" subtitle="Connect, share, and learn with others." />

      <div className="px-4 sm:px-6 pb-8">
        <Tabs value={tab} onValueChange={(v) => setSearchParams({ tab: v }, { replace: true })} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto bg-muted p-1 rounded-xl">
            <TabsTrigger value="feed" className={triggerCls}><Sparkle className="w-4 h-4" weight="duotone" />Feed</TabsTrigger>
            <TabsTrigger value="forum" className={triggerCls}><MessageSquare className="w-4 h-4" weight="duotone" />Forum</TabsTrigger>
            <TabsTrigger value="groups" className={triggerCls}><UsersThree className="w-4 h-4" weight="duotone" />Groups</TabsTrigger>
            <TabsTrigger value="resources" className={triggerCls}><BookText className="w-4 h-4" weight="duotone" />Resources</TabsTrigger>
          </TabsList>
          <TabsContent value="feed" className="py-6"><FeedView /></TabsContent>
          <TabsContent value="forum" className="py-6"><ForumView /></TabsContent>
          <TabsContent value="groups" className="py-6"><GroupsView /></TabsContent>
          <TabsContent value="resources" className="py-6"><ResourcesView /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
