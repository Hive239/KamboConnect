import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookText, MessageSquare, Sparkle, UsersThree } from "@/lib/icons";
import { useSeo } from "@/lib/useSeo";

import FeedView from "../components/community/FeedView";
import ForumView from "../components/community/ForumView";
import GroupsView from "../components/community/GroupsView";
import ResourcesView from "../components/community/ResourcesView";

const triggerCls = "rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary gap-2";

export default function Community() {
  useSeo({ title: "Community — KamboConnect", description: "Connect, share, and learn with the Kambo community." });
  return (
    <div className="bg-muted min-h-screen">
      <div className="p-4 sm:p-6">
        <h1 className="font-display text-3xl font-semibold text-foreground">Community Hub</h1>
        <p className="text-muted-foreground">Connect, share, and learn with others</p>
      </div>

      <div className="px-4 sm:px-6 pb-8">
        <Tabs defaultValue="feed" className="w-full">
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
