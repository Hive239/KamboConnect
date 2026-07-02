/**
 * Futuristic chart primitives — recharts under the hood (no new dependency),
 * dressed with gradient fills, soft glow, glassy tooltips, and animated draw-in.
 * Colors are token strings like "hsl(var(--primary))".
 */
import * as React from "react";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts";
import { cn } from "@/lib/utils";

export const GLASS_TOOLTIP: React.CSSProperties = {
  background: "hsl(var(--card) / 0.92)",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  backdropFilter: "blur(8px)",
  boxShadow: "var(--shadow-lg)",
  fontSize: 12,
};

/** Tiny inline trend line for stat cards. `data` = number[] or {value}[]. */
export function Sparkline({ data, color = "hsl(var(--primary))", height = 34 }: {
  data: Array<number | { value: number }>; color?: string; height?: number;
}) {
  const id = React.useId().replace(/:/g, "");
  const d = (data || []).map((v, i) => ({ i, v: typeof v === "number" ? v : v.value }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={d} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.45} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#sp-${id})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Full gradient/glow area chart with a glassy tooltip. `series`: {key,color,label}[]. */
export function AreaChartGlow({ data, xKey = "date", series, height = 260, yWidth = 40 }: {
  data: any[]; xKey?: string; series: { key: string; color: string; label?: string }[]; height?: number; yWidth?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`ag-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.5} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={yWidth} />
        <Tooltip contentStyle={GLASS_TOOLTIP} cursor={{ stroke: "hsl(var(--border))" }} />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label || s.key}
            stroke={s.color}
            strokeWidth={2.5}
            fill={`url(#ag-${s.key})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            style={{ filter: `drop-shadow(0 6px 12px ${s.color}44)` }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Glowing single-line chart. */
export function LineGlow({ data, xKey = "date", dataKey, color = "hsl(var(--primary))", height = 220 }: {
  data: any[]; xKey?: string; dataKey: string; color?: string; height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={36} />
        <Tooltip contentStyle={GLASS_TOOLTIP} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} style={{ filter: `drop-shadow(0 4px 10px ${color}55)` }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Animated gradient progress bar (replaces hand-rolled meters). */
export function GradientBar({ value, max = 100, from = "hsl(var(--primary))", to = "hsl(var(--clay))", className }: {
  value: number; max?: number; from?: string; to?: string; className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${from}, ${to})` }} />
    </div>
  );
}

/** Radial gauge with centered % label. */
export function RadialGauge({ value, max = 100, color = "hsl(var(--primary))", label, size = 120 }: {
  value: number; max?: number; color?: string; label?: string; size?: number;
}) {
  const pct = Math.round((value / (max || 1)) * 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ v: pct }]} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="v" cornerRadius={999} fill={color} background={{ fill: "hsl(var(--muted))" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-semibold">{pct}%</span>
        {label && <span className="text-[10px] text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}
