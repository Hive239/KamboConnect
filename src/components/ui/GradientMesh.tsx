/**
 * GradientMesh — atmospheric background of soft, blurred, brand-colored blobs that
 * slowly drift (the `aurora` keyframe). Absolutely positioned; place inside a
 * `relative` container behind content. Dark-aware and reduced-motion aware.
 *
 *   <div className="relative overflow-hidden">
 *     <GradientMesh />
 *     …content (give it `relative z-10`)…
 *   </div>
 */
import * as React from "react";
import { cn } from "@/lib/utils";

export function GradientMesh({
  className,
  intensity = "soft",
}: {
  className?: string;
  intensity?: "soft" | "vivid";
}) {
  const op = intensity === "vivid" ? "opacity-70" : "opacity-45";
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 -z-0 overflow-hidden", op, className)}
    >
      {/* forest green */}
      <div className="absolute -left-[10%] -top-[20%] h-[55vh] w-[55vh] rounded-full bg-primary/40 blur-3xl animate-aurora dark:bg-primary/30" />
      {/* terracotta clay */}
      <div
        className="absolute -right-[8%] top-[6%] h-[48vh] w-[48vh] rounded-full bg-clay/35 blur-3xl animate-aurora dark:bg-clay/25"
        style={{ animationDelay: "-6s" }}
      />
      {/* warm sand / info accent low */}
      <div
        className="absolute bottom-[-18%] left-[28%] h-[50vh] w-[50vh] rounded-full bg-info/25 blur-3xl animate-aurora dark:bg-info/20"
        style={{ animationDelay: "-12s" }}
      />
    </div>
  );
}

export default GradientMesh;
