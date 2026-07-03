import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Practitioner, Event, Post, Group } from '@/entities/all';
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from '@/components/ui/command';
import {
  Search, MapPin, Sparkle, Users, Calendar, Briefcase, MessageSquare, Heart,
  Store, BookOpen, User as UserIcon, Package, Home,
} from '@/lib/icons';

const DESTINATIONS = [
  { label: 'For You', page: 'ForYou', icon: Home },
  { label: 'Ask the Guide', page: 'Guide', icon: Sparkle },
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
  { label: 'Journal', page: 'Journal', icon: BookOpen },
  { label: 'Coursework', page: 'Coursework', icon: BookOpen },
  { label: 'Profile', page: 'Profile', icon: UserIcon },
  { label: 'Account Settings', page: 'MyAccount', icon: UserIcon },
  { label: 'Practitioner Dashboard', page: 'PractitionerDashboard', icon: Briefcase },
  { label: 'Billing & Growth', page: 'Billing', icon: Briefcase },
  { label: 'Admin Dashboard', page: 'AdminDashboard', icon: Sparkle },
  { label: 'Trust & Safety', page: 'TrustSafety', icon: Sparkle },
];

/**
 * Global command palette (⌘K / Ctrl+K). Jump to any page or search practitioners
 * by name. Uses the installed-but-previously-unwired cmdk component.
 */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('open-command-palette', onOpen);
    return () => { document.removeEventListener('keydown', onKey); window.removeEventListener('open-command-palette', onOpen); };
  }, []);

  // Lazily load searchable content the first time the palette opens.
  useEffect(() => {
    if (!open || loaded) return;
    setLoaded(true);
    Practitioner.list().then((l) => setPractitioners(l || [])).catch(() => {});
    Event.list("-start_date").then((l) => setEvents((l || []).filter((e: any) => e.status !== "draft" && e.status !== "cancelled"))).catch(() => {});
    Post.list("-last_reply_date").then((l) => setPosts((l || []).filter((p: any) => !p.is_hidden))).catch(() => {});
    Group.list("-member_count").then((l) => setGroups(l || [])).catch(() => {});
  }, [open, loaded]);

  const go = (url: string) => {
    setOpen(false);
    navigate(url);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search practitioners, events, discussions, groups…" />
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
            {practitioners.slice(0, 20).map((p) => (
              <CommandItem key={p.id} value={`practitioner ${p.full_name} ${p.location || ''}`} onSelect={() => go(`${createPageUrl('PractitionerProfile')}?id=${p.id}`)}>
                <UserIcon className="mr-2 h-4 w-4" weight="duotone" />
                <span>{p.full_name}</span>
                {p.location && <span className="ml-2 text-xs text-muted-foreground">{p.location}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {events.length > 0 && (
          <CommandGroup heading="Events">
            {events.slice(0, 20).map((e) => (
              <CommandItem key={e.id} value={`event ${e.title} ${e.location || ''}`} onSelect={() => go(`${createPageUrl('EventDetail')}?id=${e.id}`)}>
                <Calendar className="mr-2 h-4 w-4" weight="duotone" /> <span>{e.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {posts.length > 0 && (
          <CommandGroup heading="Discussions">
            {posts.slice(0, 20).map((p) => (
              <CommandItem key={p.id} value={`post ${p.title}`} onSelect={() => go(`${createPageUrl('Post')}?id=${p.id}`)}>
                <MessageSquare className="mr-2 h-4 w-4" weight="duotone" /> <span>{p.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {groups.length > 0 && (
          <CommandGroup heading="Groups">
            {groups.slice(0, 20).map((g) => (
              <CommandItem key={g.id} value={`group ${g.name}`} onSelect={() => go(`${createPageUrl('GroupDetail')}?id=${g.id}`)}>
                <Users className="mr-2 h-4 w-4" weight="duotone" /> <span>{g.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
