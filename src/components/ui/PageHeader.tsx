/**
 * PageHeader — the signature futuristic page/section header used across every
 * page: animated gradient-mesh + film-grain, a glowing icon chip, an uppercase
 * kicker, display title, subtitle, and an optional actions slot. Consistent,
 * dynamic, on-theme.
 */
import * as React from "react";
import { GradientMesh } from "@/components/ui/GradientMesh";
import { cn } from "@/lib/utils";

export function PageHeader({
  icon: Icon, title, subtitle, kicker, actions, intensity = "soft", className, children,
}: {
  icon?: React.ElementType;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  kicker?: React.ReactNode;
  actions?: React.ReactNode;
  intensity?: "soft" | "vivid";
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("grain relative overflow-hidden border-b border-border bg-card", className)}>
      <GradientMesh intensity={intensity} />
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 shadow-glow">
              <Icon className="h-6 w-6 text-primary" weight="duotone" />
            </span>
          )}
          <div className="min-w-0">
            {kicker && <p className="text-xs font-semibold uppercase tracking-widest text-primary">{kicker}</p>}
            <h1 className="font-display text-hero font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-pretty text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        {children}
      </div>
    </div>
  );
}

export default PageHeader;
