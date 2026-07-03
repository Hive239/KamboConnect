import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Practitioner } from "@/entities/all";
import MapView from "@/components/directory/MapView";
import { createPageUrl } from "@/utils";
import { useSeo } from "@/lib/useSeo";
import { Loader2, MapPin } from "@/lib/icons";
import { PageHeader } from "@/components/ui/PageHeader";

/** Standalone full-page practitioner map (upgrade #1 discoverability). */
export default function MapPage() {
  useSeo({ title: "Practitioner Map — KamboGuide", description: "Find Kambo practitioners near you on the map." });
  const navigate = useNavigate();
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const list = await Practitioner.list();
      // Real coordinates only — a practitioner without a geocoded location is omitted
      // from the map rather than shown at a fabricated point.
      setPractitioners(list.filter((p: any) => typeof p.latitude === "number" && typeof p.longitude === "number"));
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 sm:p-6">
      <PageHeader icon={MapPin} kicker="Discover" title="Practitioner Map" subtitle="Explore verified Kambo practitioners near you." className="-mx-4 -mt-4 mb-4 sm:-mx-6 sm:-mt-6" />
      <MapView
        practitioners={practitioners}
        onPractitionerSelect={(p: any) => navigate(createPageUrl(`PractitionerProfile?id=${p.id}`))}
        onMapPractitionersUpdate={() => {}}
        heightClass="h-[75vh]"
      />
    </div>
  );
}
