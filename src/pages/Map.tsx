import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Practitioner } from "@/entities/all";
import MapView from "@/components/directory/MapView";
import { createPageUrl } from "@/utils";
import { useSeo } from "@/lib/useSeo";
import { Loader2 } from "@/lib/icons";

/** Standalone full-page practitioner map (upgrade #1 discoverability). */
export default function MapPage() {
  useSeo({ title: "Practitioner Map — KamboConnect", description: "Find Kambo practitioners near you on the map." });
  const navigate = useNavigate();
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const list = await Practitioner.list();
      // Fallback coords so pins render for seed rows without lat/lng (mirrors Events).
      setPractitioners(list.map((p: any) => ({
        ...p,
        latitude: p.latitude ?? (40.7128 + (Math.random() - 0.5) * 2),
        longitude: p.longitude ?? (-74.006 + (Math.random() - 0.5) * 2),
      })));
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-display text-2xl font-semibold">Practitioner Map</h1>
      <p className="mb-4 text-muted-foreground">Explore verified Kambo practitioners near you.</p>
      <MapView
        practitioners={practitioners}
        onPractitionerSelect={(p: any) => navigate(createPageUrl(`PractitionerProfile?id=${p.id}`))}
        onMapPractitionersUpdate={() => {}}
        heightClass="h-[75vh]"
      />
    </div>
  );
}
