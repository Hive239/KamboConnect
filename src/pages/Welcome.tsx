import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, Users, ArrowRight, Leaf } from "@/lib/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { useSeo } from "@/lib/useSeo";

/** Post-signup onboarding: route the new member by intent. */
export default function Welcome() {
  useSeo({ title: "Welcome — KamboGuide" });
  const navigate = useNavigate();
  const { data: me } = useCurrentUser();
  const name = (me?.full_name || "").split(" ")[0];

  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-10">
      <PageHeader icon={Leaf} kicker="Welcome" title={`Welcome${name ? `, ${name}` : ""}!`} subtitle="What brings you to KamboGuide?" className="-mx-6 -mt-6 mb-8 sm:-mx-10 sm:-mt-10" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(createPageUrl("Directory"))}>
          <CardContent className="p-6">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10"><MapPin className="h-6 w-6 text-primary" weight="duotone" /></div>
            <h2 className="font-semibold">I'm here to book</h2>
            <p className="mt-1 text-sm text-muted-foreground">Find a verified practitioner, request a consultation, and book safely.</p>
            <Button variant="ghost" className="mt-3 gap-1 px-0 text-primary">Browse the directory <ArrowRight className="h-4 w-4" /></Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(createPageUrl("PractitionerApplication"))}>
          <CardContent className="p-6">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-clay/10"><Briefcase className="h-6 w-6 text-clay" weight="duotone" /></div>
            <h2 className="font-semibold">I'm a practitioner</h2>
            <p className="mt-1 text-sm text-muted-foreground">List your practice, get verified, and start receiving consultations.</p>
            <Button variant="ghost" className="mt-3 gap-1 px-0 text-clay">Apply to list <ArrowRight className="h-4 w-4" /></Button>
          </CardContent>
        </Card>
      </div>

      <button onClick={() => navigate(createPageUrl("Community"))} className="mx-auto mt-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <Users className="h-4 w-4" /> Or explore the community first
      </button>
    </div>
  );
}
