import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut } from '@/lib/icons';
import type { User } from '@/types/entities';

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string; weight?: string }>;
}

interface ProfileMenuProps {
  user: User | null;
  items: NavItem[];
  onLogout: () => void;
  onLogin: () => void;
}

function initials(name?: string) {
  if (!name) return 'KC';
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** Top-right account control: avatar dropdown with user links + sign out, or a Sign In button. */
export default function ProfileMenu({ user, items, onLogout, onLogin }: ProfileMenuProps) {
  if (!user) {
    return (
      <Button size="sm" onClick={onLogin} className="gap-2">
        <LogIn className="h-4 w-4" weight="bold" />
        <span className="hidden sm:inline">Sign In</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account menu"
          className="rounded-full outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:opacity-90"
        >
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src={user.profile_image_url} alt={user.full_name || 'Account'} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials(user.full_name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate font-semibold">{user.full_name || 'Your account'}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
          {user.role === 'admin' && (
            <span className="mt-1 w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
              Admin
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem key={item.title} asChild>
              <Link to={item.url} className="cursor-pointer gap-2">
                <Icon className="h-4 w-4" weight="duotone" />
                {item.title}
              </Link>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" weight="bold" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
