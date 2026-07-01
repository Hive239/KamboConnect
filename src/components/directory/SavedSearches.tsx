import { useEffect, useState } from "react";
import { SavedSearch } from "@/entities/all";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Bookmark, Trash2 as Trash, Bell } from "@/lib/icons";
import { toast } from "sonner";

/**
 * Save-search control for the Directory: persist the current {search_term, filters}
 * as a SavedSearch and re-apply/delete saved ones. → completes upgrade #1.
 */
export default function SavedSearches({ searchTerm, filters, onApply }:
  { searchTerm: string; filters: Record<string, any>; onApply: (s: any) => void }) {
  const { data: me } = useCurrentUser();
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    if (!me) { setItems([]); return; }
    setItems(await SavedSearch.filter({ user_id: me.id }, "-created_date"));
  };
  useEffect(() => { load(); }, [me?.id]);

  const save = async () => {
    if (!me) { toast.error("Sign in to save searches"); return; }
    const name = (searchTerm || "").trim() || "My search";
    await SavedSearch.create({ user_id: me.id, name, search_term: searchTerm, filters });
    toast.success("Search saved");
    load();
  };
  const del = async (id: string) => { await SavedSearch.delete(id); load(); };

  // Toggle email alerts for a saved search. NOTE: the job that actually *runs*
  // saved searches and emits notifications is a scheduled backend task
  // (Supabase cron / edge function) — this only records the user's preference.
  const toggleNotify = async (s: any) => {
    await SavedSearch.update(s.id, { notify: !s.notify, last_run_date: new Date().toISOString() });
    toast.success(!s.notify ? "You'll be alerted about new matches" : "Alerts turned off");
    load();
  };

  return (
    <div className="mt-3 flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" onClick={save} className="gap-2 rounded-full bg-card/80 backdrop-blur-sm">
        <Bookmark className="h-4 w-4" /> Save search
      </Button>
      {items.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="rounded-full">Saved ({items.length})</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-64">
            <DropdownMenuLabel>Saved searches</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {items.map((s) => (
              <DropdownMenuItem key={s.id} onSelect={(e) => { e.preventDefault(); onApply(s); }} className="flex items-center justify-between gap-2">
                <span className="truncate">{s.name}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleNotify(s); }}
                    aria-label={s.notify ? "Turn off alerts" : "Email me new matches"}
                    title={s.notify ? "Alerts on" : "Email me new matches"}
                  >
                    <Bell className={`h-3.5 w-3.5 ${s.notify ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} weight={s.notify ? "fill" : "regular"} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); del(s.id); }} aria-label="Delete saved search">
                    <Trash className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
