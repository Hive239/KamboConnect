import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, X } from "@/lib/icons";

const MODALITIES = ["Traditional Kambo", "Sananga", "Hapé / Rapé", "Integration Coaching", "Group Circles", "Women’s Circles", "Trauma-Informed", "Microdosing Guidance"];
const LANGUAGES = ["English", "Spanish", "Portuguese", "French", "Japanese", "Hawaiian"];
const PRICE_LABELS = ["$", "$$", "$$$", "$$$$"];
const RADIUS_OPTIONS = [0, 10, 25, 50, 100, 250];

export default function FilterModal({ isOpen, onClose, onApplyFilters, currentFilters }) {
  const [sortBy, setSortBy] = useState(currentFilters.sortBy || "nearest");
  const [minRating, setMinRating] = useState(currentFilters.minRating || 0);
  const [priceRange, setPriceRange] = useState(currentFilters.priceRange || [0, 3]);
  const [verificationLevel, setVerificationLevel] = useState(currentFilters.verificationLevel || "all");
  const [modalities, setModalities] = useState<string[]>(currentFilters.modalities || []);
  const [languages, setLanguages] = useState<string[]>(currentFilters.languages || []);
  const [onlineOnly, setOnlineOnly] = useState(!!currentFilters.onlineOnly);
  const [radius, setRadius] = useState(currentFilters.radius || 0);

  const toggle = (list: string[], setList: (v: string[]) => void, v: string) =>
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const apply = () => {
    onApplyFilters({ sortBy, minRating, priceRange, verificationLevel, modalities, languages, onlineOnly, radius });
    onClose();
  };

  const clearAll = () => {
    setSortBy("nearest"); setMinRating(0); setPriceRange([0, 3]); setVerificationLevel("all");
    setModalities([]); setLanguages([]); setOnlineOnly(false); setRadius(0);
  };

  const Chip = ({ active, onClick, children }: any) => (
    <button onClick={onClick} className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${active ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}>{children}</button>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-2xl rounded-t-2xl bg-card max-h-[88vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
              <h2 className="text-lg font-semibold">Filters</h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">Reset</Button>
                <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}><X className="h-5 w-5" /></Button>
              </div>
            </div>
            <div className="space-y-7 p-6">
              {/* Sort + radius */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sort by</h3>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full bg-muted"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nearest">Nearest to me</SelectItem>
                      <SelectItem value="rating">Highest rated</SelectItem>
                      <SelectItem value="experience">Most experienced</SelectItem>
                      <SelectItem value="newest">Newest first</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Distance</h3>
                  <Select value={String(radius)} onValueChange={(v) => setRadius(Number(v))}>
                    <SelectTrigger className="w-full bg-muted"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RADIUS_OPTIONS.map((r) => <SelectItem key={r} value={String(r)}>{r === 0 ? "Any distance" : `Within ${r} mi`}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Online toggle */}
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm font-medium">Offers online sessions</span>
                <Switch checked={onlineOnly} onCheckedChange={setOnlineOnly} />
              </div>

              {/* Rating */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Minimum rating</h3>
                <div className="flex gap-2">
                  <Button variant={minRating === 0 ? "default" : "outline"} onClick={() => setMinRating(0)} className="flex-1 h-11">Any</Button>
                  {[3, 4, 4.5].map((r) => (
                    <Button key={r} variant={minRating === r ? "default" : "outline"} onClick={() => setMinRating(r)} className="flex-1 h-11 gap-1">
                      <Star className={`w-4 h-4 ${minRating === r ? "fill-primary-foreground" : "fill-warning text-warning"}`} /> {r}+
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price range</h3>
                  <span className="text-sm font-medium text-primary">{PRICE_LABELS[priceRange[0]]} – {PRICE_LABELS[priceRange[1]]}</span>
                </div>
                <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={3} step={1} className="w-full" />
              </div>

              {/* Verification */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Verification</h3>
                <div className="flex flex-wrap gap-2">
                  {[["all", "All"], ["verified", "Verified"], ["advanced", "Advanced"], ["master", "Master"]].map(([v, l]) => (
                    <Chip key={v} active={verificationLevel === v} onClick={() => setVerificationLevel(v)}>{l}</Chip>
                  ))}
                </div>
              </div>

              {/* Modalities */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Modalities</h3>
                <div className="flex flex-wrap gap-2">
                  {MODALITIES.map((m) => <Chip key={m} active={modalities.includes(m)} onClick={() => toggle(modalities, setModalities, m)}>{m}</Chip>)}
                </div>
              </div>

              {/* Languages */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((l) => <Chip key={l} active={languages.includes(l)} onClick={() => toggle(languages, setLanguages, l)}>{l}</Chip>)}
                </div>
              </div>

              <Button onClick={apply} className="w-full h-12 font-medium">Show results</Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
