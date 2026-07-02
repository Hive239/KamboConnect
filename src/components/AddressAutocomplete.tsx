import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "@/lib/icons";

export interface ResolvedAddress {
  formatted: string;
  street?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Address autocomplete backed by the free Photon (OpenStreetMap) geocoder —
 * no API key. Selecting a suggestion returns a real, geocoded address
 * (canonical components + lat/lng) so every stored address maps to a real place.
 */
export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing an address…",
  id,
}: {
  value: string;
  onChange?: (text: string) => void;
  onSelect: (addr: ResolvedAddress) => void;
  placeholder?: string;
  id?: string;
}) {
  const [q, setQ] = useState(value || "");
  const [results, setResults] = useState<ResolvedAddress[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<any>(null);

  useEffect(() => { setQ(value || ""); }, [value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const search = (text: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (!text || text.trim().length < 3) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=5`);
        const j = await r.json();
        const mapped: ResolvedAddress[] = (j.features || []).map((f: any) => {
          const p = f.properties || {};
          const coords = f.geometry?.coordinates || [];
          const street = [p.name && p.name !== p.city ? p.name : p.street, p.housenumber].filter(Boolean).join(" ").trim() || undefined;
          const formatted = [street, p.city || p.county, p.state, p.postcode, p.country].filter(Boolean).join(", ");
          return {
            formatted, street, city: p.city || p.county || p.town || p.village,
            state_province: p.state, postal_code: p.postcode, country: p.country,
            longitude: coords[0], latitude: coords[1],
          };
        }).filter((a: ResolvedAddress) => a.formatted);
        setResults(mapped); setOpen(true);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
  };

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={q}
          onChange={(e) => { setQ(e.target.value); onChange?.(e.target.value); search(e.target.value); }}
          onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder}
          className="pl-9"
          autoComplete="off"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          {results.map((a, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setQ(a.formatted); onChange?.(a.formatted); onSelect(a); setOpen(false); }}
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{a.formatted}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
