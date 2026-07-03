import { cn } from "@/lib/utils";

/**
 * Spotlight — a radial-gradient overlay that follows the cursor. Render it as a
 * child of a `group relative overflow-hidden` element whose `onMouseMove` is
 * wired to `useSpotlight()`. Fades in on hover; GPU-cheap, no JS per frame.
 */
export function Spotlight({
  glow = "hsl(var(--primary) / 0.15)",
  size = 240,
  className,
}: {
  glow?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
        className,
      )}
      style={{ background: `radial-gradient(${size}px circle at var(--mx, 50%) var(--my, 50%), ${glow}, transparent 70%)` }}
    />
  );
}

export default Spotlight;
