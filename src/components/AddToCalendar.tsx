import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CalendarDays, GoogleLogo, Download, ChevronDown } from "@/lib/icons";
import { googleCalendarUrl, downloadIcs, type CalendarEvent } from "@/lib/calendar";

/**
 * Add-to-Calendar dropdown: opens a prefilled Google Calendar event or downloads
 * an .ics (Apple/Outlook/any). Works for every end-user with no backend.
 */
export default function AddToCalendar({
  event,
  size = "sm",
  variant = "outline",
  className,
  label = "Add to Calendar",
}: {
  event: CalendarEvent;
  size?: "sm" | "default";
  variant?: "outline" | "ghost" | "secondary" | "default";
  className?: string;
  label?: string;
}) {
  if (!event?.start) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size={size} variant={variant} className={className}>
          <CalendarDays className="h-4 w-4" weight="duotone" />
          <span className="mx-1.5">{label}</span>
          <ChevronDown className="h-3 w-3 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
            <GoogleLogo className="mr-2 h-4 w-4" weight="bold" /> Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => downloadIcs(event)}>
          <Download className="mr-2 h-4 w-4" weight="duotone" /> Apple / Outlook (.ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
