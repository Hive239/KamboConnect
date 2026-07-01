/**
 * HeroMap — a compact, non-scroll-hijacking live map for the Landing hero.
 * Shows verified practitioners that have coordinates; markers link to profiles.
 * Lazy-loaded from Landing so leaflet stays out of the initial bundle.
 */
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function HeroMap({ practitioners }: { practitioners: any[] }) {
  const withCoords = (practitioners || []).filter((p) => p.latitude && p.longitude).slice(0, 40);

  const center: [number, number] = withCoords.length
    ? [
        withCoords.reduce((s, p) => s + p.latitude, 0) / withCoords.length,
        withCoords.reduce((s, p) => s + p.longitude, 0) / withCoords.length,
      ]
    : [39.8283, -98.5795];

  return (
    <MapContainer
      center={center}
      zoom={withCoords.length > 1 ? 4 : 6}
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full"
      style={{ height: "100%", width: "100%", background: "transparent" }}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
      {withCoords.map((p) => (
        <Marker key={p.id} position={[p.latitude, p.longitude]}>
          <Popup>
            <div className="w-48 p-0.5">
              <div className="flex items-center gap-2">
                {p.profile_image_url ? (
                  <img src={p.profile_image_url} alt={p.full_name} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted" />
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.full_name}</p>
                  {p.address && (
                    <p className="truncate text-xs text-muted-foreground">
                      {[p.address.city, p.address.state_province].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </div>
              <Link
                to={createPageUrl(`PractitionerProfile?id=${p.id}`)}
                className="mt-2 block rounded-md bg-primary px-3 py-1.5 text-center text-xs font-semibold text-primary-foreground"
              >
                View profile
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
