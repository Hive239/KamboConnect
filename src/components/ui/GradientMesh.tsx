/**
 * GradientMesh — atmospheric background of soft, blurred, brand-colored blobs that
 * slowly drift (the `aurora` keyframe). Absolutely positioned; place inside a
 * `relative` container behind content. Dark-aware and reduced-motion aware.
 *
 *   intensity="soft"  → subtle ambient wash (section backgrounds)
 *   intensity="vivid" → saturated, colorful hero atmosphere
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
  const vivid = intensity === "vivid";
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-0 overflow-hidden",
        vivid ? "opacity-100" : "opacity-50",
        className,
      )}
    >
      {/* forest green */}
      <div
        className={cn(
          "absolute rounded-full blur-3xl animate-aurora",
          vivid ? "-left-[10%] -top-[18%] h-[70vh] w-[70vh] bg-primary/60" : "-left-[10%] -top-[20%] h-[55vh] w-[55vh] bg-primary/40 dark:bg-primary/30",
        )}
      />
      {/* terracotta clay */}
      <div
        className={cn(
          "absolute rounded-full blur-3xl animate-aurora",
          vivid ? "-right-[6%] top-[4%] h-[62vh] w-[62vh] bg-clay/60" : "-right-[8%] top-[6%] h-[48vh] w-[48vh] bg-clay/35 dark:bg-clay/25",
        )}
        style={{ animationDelay: "-6s" }}
      />
      {/* ocean info blue */}
      <div
        className={cn(
          "absolute rounded-full blur-3xl animate-aurora",
          vivid ? "bottom-[-16%] left-[26%] h-[64vh] w-[64vh] bg-info/50" : "bottom-[-18%] left-[28%] h-[50vh] w-[50vh] bg-info/25 dark:bg-info/20",
        )}
        style={{ animationDelay: "-12s" }}
      />
      {/* vivid-only extra warmth + emerald for a richer wash */}
      {vivid && (
        <>
          <div className="absolute right-[16%] bottom-[0%] h-[48vh] w-[48vh] rounded-full bg-warning/45 blur-3xl animate-aurora" style={{ animationDelay: "-3s" }} />
          <div className="absolute left-[34%] top-[6%] h-[44vh] w-[44vh] rounded-full bg-success/50 blur-3xl animate-aurora" style={{ animationDelay: "-9s" }} />
        </>
      )}
    </div>
  );
}

export default GradientMesh;
