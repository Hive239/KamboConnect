import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const TIER_COLOR: Record<string, string> = {
  featured: "#c2703d", // clay/gold
  preferred: "#2f6b4f",
  basic: "#5a8f73",
};

/** World map of practitioners — dot size = booking activity, color = tier. */
export default function GeoMap({ points }: { points: { lat: number; lng: number; label: string; weight: number; tier?: string }[] }) {
  return (
    <div className="h-[440px] w-full overflow-hidden rounded-xl border border-border">
      <MapContainer center={[20, 0]} zoom={2} minZoom={1} worldCopyJump className="h-full w-full" style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        {points.map((p, i) => (
          <CircleMarker
            key={i}
            center={[p.lat, p.lng]}
            radius={Math.min(22, 5 + p.weight * 2)}
            pathOptions={{ color: TIER_COLOR[p.tier || "basic"], fillColor: TIER_COLOR[p.tier || "basic"], fillOpacity: 0.55, weight: 1 }}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold">{p.label}</p>
                <p className="text-xs capitalize text-muted-foreground">{p.tier || "basic"} · {p.weight} booking{p.weight === 1 ? "" : "s"}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
