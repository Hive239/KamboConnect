/**
 * SegmentedControl — an evenly-spaced pill selector matching the Tabs language
 * (colored active outline + glass track). Replaces native <select> filter rows
 * and ad-hoc pill-button filters (Events, Forum, Resources, Market).
 */
import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ElementType;
  count?: number;
}

export function SegmentedControl<T extends string = string>({
  options, value, onChange, className, scroll = false,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  /** allow horizontal scroll instead of squeezing when there are many options */
  scroll?: boolean;
}) {
  return (
    <div
      className={cn(
        // Always allow the track to scroll rather than truncate labels when a row
        // is too narrow to show every full word.
        "flex w-full items-center gap-1 rounded-xl border border-border/60 bg-muted/70 p-1 backdrop-blur-sm overflow-x-auto",
        className,
      )}
      role="tablist"
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cn(
              // No min-w-0: a pill must never shrink below its own text (which is
              // what caused truncation). flex-1 still gives equal widths when they fit.
              "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              scroll ? "" : "flex-1",
              on
                ? "bg-card text-primary shadow-sm ring-2 ring-inset ring-primary/60"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.icon && <o.icon className="h-4 w-4" weight={on ? "fill" : "duotone"} />}
            <span className="whitespace-nowrap">{o.label}</span>
            {typeof o.count === "number" && (
              <span className={cn("ml-0.5 rounded-full px-1.5 text-xs", on ? "bg-primary/15 text-primary" : "bg-muted-foreground/10 text-muted-foreground")}>
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
