/**
 * StatusPill — one tokenized status → tone mapping for the whole app. Replaces the
 * duplicated hardcoded `bg-*-100 text-*-800` maps in bookings, events, forum,
 * resources, admin, users, disputes.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "info" | "destructive" | "muted" | "primary";

const TONE_CLASS: Record<Tone, string> = {
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  info: "border-info/30 bg-info/10 text-info",
  destructive: "border-destructive/30 bg-destructive/10 text-destructive",
  muted: "border-border bg-muted text-muted-foreground",
  primary: "border-primary/30 bg-primary/10 text-primary",
};

const STATUS_TONE: Record<string, Tone> = {
  // positive / active
  confirmed: "success", active: "success", paid: "success", approved: "success",
  verified: "success", resolved: "success", fulfilled: "success", converted: "success", scheduled: "success",
  // in progress / attention
  pending: "warning", requested: "warning", past_due: "warning", no_show: "warning",
  suspended: "warning", open: "warning", draft: "muted",
  // informational
  completed: "info", investigating: "info", waitlist: "info", ongoing: "info", upcoming: "info", reviewing: "info",
  // negative / closed
  declined: "muted", cancelled: "muted", dismissed: "muted", refunded: "muted", archived: "muted", partially_refunded: "muted",
  rejected: "destructive", failed: "destructive", banned: "destructive", expired: "destructive",
};

export function statusTone(status?: string): Tone {
  return STATUS_TONE[(status || "").toLowerCase()] || "muted";
}

export function statusLabel(status?: string): string {
  return (status || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusPill({ status, icon: Icon, className }: {
  status?: string;
  icon?: React.ElementType;
  className?: string;
}) {
  const tone = statusTone(status);
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize", TONE_CLASS[tone], className)}>
      {Icon && <Icon className="h-3 w-3" />}
      {statusLabel(status)}
    </span>
  );
}

export default StatusPill;
