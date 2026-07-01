import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Practitioner } from '@/entities/all';
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from '@/components/ui/command';
import {
  Search, MapPin, Sparkle, Users, Calendar, Briefcase, MessageSquare, Heart,
  Store, BookOpen, User as UserIcon, Package,
} from '@/lib/icons';

const DESTINATIONS = [
  { label: 'Directory', page: 'Directory', icon: Search },
  { label: 'Map', page: 'Map', icon: MapPin },
  { label: 'Find Your Match', page: 'Matchmaking', icon: Sparkle },
  { label: 'Community', page: 'Community', icon: Users },
  { label: 'Events', page: 'Events', icon: Calendar },
  { label: 'Market', page: 'Market', icon: Store },
  { label: 'Learn', page: 'Education', icon: BookOpen },
  { label: 'My Bookings', page: 'Bookings', icon: Briefcase },
  { label: 'Messages', page: 'Messages', icon: MessageSquare },
  { label: 'My Favorites', page: 'Favorites', icon: Heart },
  { label: 'My Orders', page: 'Orders', icon: Package },
  { label: 'Profile', page: 'Profile', icon: UserIcon },
];

/**
 * Global command palette (⌘K / Ctrl+K). Jump to any page or search practitioners
 * by name. Uses the installed-but-previously-unwired cmdk component.
 */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Lazily load practitioners the first time the palette opens.
  useEffect(() => {
    if (open && practitioners.length === 0) {
      Practitioner.list().then((list) => setPractitioners(list || [])).catch(() => {});
    }
  }, [open, practitioners.length]);

  const go = (url: string) => {
    setOpen(false);
    navigate(url);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages and practitioners…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Go to">
          {DESTINATIONS.map((d) => (
            <CommandItem key={d.page} value={`page ${d.label}`} onSelect={() => go(createPageUrl(d.page))}>
              <d.icon className="mr-2 h-4 w-4" weight="duotone" />
              {d.label}
            </CommandItem>
          ))}
        </CommandGroup>
        {practitioners.length > 0 && (
          <CommandGroup heading="Practitioners">
            {practitioners.slice(0, 30).map((p) => (
              <CommandItem
                key={p.id}
                value={`practitioner ${p.full_name} ${p.location || ''}`}
                onSelect={() => go(`${createPageUrl('PractitionerProfile')}?id=${p.id}`)}
              >
                <UserIcon className="mr-2 h-4 w-4" weight="duotone" />
                <span>{p.full_name}</span>
                {p.location && <span className="ml-2 text-xs text-muted-foreground">{p.location}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
