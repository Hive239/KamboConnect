/**
 * StatCard — the one KPI/metric card for the whole app. Colored token outline,
 * tinted icon chip, count-up value, delta arrow, optional sparkline, hover-lift.
 * Replaces the ~15 hand-rolled flat stat cards (with hardcoded orange/purple/red).
 */
import * as React from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/ui/charts";

export type StatColor = "primary" | "clay" | "success" | "warning" | "info";

const COLOR: Record<StatColor, { border: string; ring: string; chip: string; spark: string }> = {
  primary: { border: "border-primary/25", ring: "hover:ring-primary/40", chip: "bg-primary/10 text-primary", spark: "hsl(var(--primary))" },
  clay: { border: "border-clay/25", ring: "hover:ring-clay/40", chip: "bg-clay/10 text-clay", spark: "hsl(var(--clay))" },
  success: { border: "border-success/25", ring: "hover:ring-success/40", chip: "bg-success/10 text-success", spark: "hsl(var(--success))" },
  warning: { border: "border-warning/25", ring: "hover:ring-warning/40", chip: "bg-warning/10 text-warning", spark: "hsl(var(--warning))" },
  info: { border: "border-info/25", ring: "hover:ring-info/40", chip: "bg-info/10 text-info", spark: "hsl(var(--info))" },
};

function useCountUp(target: number, decimals = 0, duration = 1100) {
  const reduce = useReducedMotion();
  const [val, setVal] = React.useState(reduce ? target : 0);
  const started = React.useRef(false);
  React.useEffect(() => {
    if (reduce) { setVal(target); return; }
    started.current = false;
    let raf = 0;
    const t0 = performance.now();
    const from = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, decimals, duration, reduce]);
  return val.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

export function StatCard({
  icon: Icon, label, value, suffix, prefix, delta, deltaLabel, color = "primary",
  spark, decimals = 0, sub, onClick, className,
}: {
  icon?: React.ElementType;
  label: string;
  value: number | string;
  suffix?: string;
  prefix?: string;
  delta?: number;
  deltaLabel?: string;
  color?: StatColor;
  spark?: Array<number | { value: number }>;
  decimals?: number;
  sub?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const c = COLOR[color] || COLOR.primary;
  const counted = useCountUp(typeof value === "number" ? value : 0, decimals);
  const shown = typeof value === "number" ? counted : value;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:ring-2",
        c.border, c.ring, onClick && "cursor-pointer", className,
      )}
    >
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {prefix}{shown}{suffix}
          </p>
          {typeof delta === "number" && (
            <p className={cn("mt-1 inline-flex items-center gap-1 text-xs font-medium", delta >= 0 ? "text-success" : "text-destructive")}>
              <span aria-hidden>{delta >= 0 ? "▲" : "▼"}</span>
              {Math.abs(delta)}%{deltaLabel ? <span className="text-muted-foreground"> {deltaLabel}</span> : null}
            </p>
          )}
          {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
        </div>
        {Icon && (
          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110", c.chip)}>
            <Icon className="h-5 w-5" weight="duotone" />
          </span>
        )}
      </div>
      {spark && spark.length > 1 && (
        <div className="relative z-10 mt-2 -mb-1 opacity-80">
          <Sparkline data={spark} color={c.spark} height={34} />
        </div>
      )}
    </div>
  );
}

export default StatCard;
