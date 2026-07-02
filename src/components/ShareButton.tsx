import { Button } from "@/components/ui/button";
import { ShareIcon } from "@/lib/icons";
import { toast } from "sonner";

/**
 * Share the current page (or a given URL) via the Web Share API, falling back to
 * copy-to-clipboard. Reused across shareable detail pages (events, posts, profiles, groups).
 */
export default function ShareButton({ title, url, size = "sm", variant = "outline", label = "Share", className }:
  { title?: string; url?: string; size?: "sm" | "default"; variant?: any; label?: string; className?: string }) {
  const share = async () => {
    const shareUrl = url || window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: title || document.title, url: shareUrl });
      else { await navigator.clipboard.writeText(shareUrl); toast.success("Link copied to clipboard"); }
    } catch { /* user cancelled */ }
  };
  return (
    <Button variant={variant} size={size} onClick={share} className={`gap-1.5 ${className || ""}`}>
      <ShareIcon className="h-4 w-4" /> {label}
    </Button>
  );
}
