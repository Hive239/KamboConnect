/**
 * Grain — a thin wrapper over the `.grain` CSS utility (film-grain SVG noise via
 * ::after). Place inside a `relative` container to add organic tactility over flat
 * color. Purely decorative.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

export function Grain({ className }: { className?: string }) {
  return <div aria-hidden className={cn("grain pointer-events-none absolute inset-0", className)} />;
}

export default Grain;
