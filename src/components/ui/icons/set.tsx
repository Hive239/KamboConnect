/**
 * Bespoke KamboGuide icon set (custom-drawn). Names match the app's icon API.
 * Any name not defined here falls back to Phosphor via src/lib/icons.ts.
 */
import * as React from "react";
import { makeIcon, Duo, type IconWeight } from "./base";

/* ---------- primitives / actions ---------- */
export const Plus = makeIcon(() => <><path d="M12 5v14" /><path d="M5 12h14" /></>, "Plus");
export const Minus = makeIcon(() => <path d="M5 12h14" />, "Minus");
export const X = makeIcon(() => <><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>, "X");
export const Check = makeIcon(() => <path d="M5 12.5l4.4 4.5L19 7" />, "Check");
export const CheckCheck = makeIcon(() => <><path d="M2 12.5l4 4L14 8" /><path d="M11 15l1.5 1.5L22 7" /></>, "CheckCheck");
export const ArrowRight = makeIcon(() => <><path d="M4 12h15" /><path d="M13 6l6 6-6 6" /></>, "ArrowRight");
export const ArrowLeft = makeIcon(() => <><path d="M20 12H5" /><path d="M11 6l-6 6 6 6" /></>, "ArrowLeft");
export const ArrowUpRight = makeIcon(() => <><path d="M7 17L17 7" /><path d="M8 7h9v9" /></>, "ArrowUpRight");
export const ChevronDown = makeIcon(() => <path d="M6 9l6 6 6-6" />, "ChevronDown");
export const ChevronUp = makeIcon(() => <path d="M6 15l6-6 6 6" />, "ChevronUp");
export const ChevronRight = makeIcon(() => <path d="M9 6l6 6-6 6" />, "ChevronRight");
export const ChevronLeft = makeIcon(() => <path d="M15 6l-6 6 6 6" />, "ChevronLeft");

/* ---------- circular status ---------- */
export const CheckCircle = makeIcon((w) => <><Duo d="M12 3a9 9 0 100 18 9 9 0 000-18Z" weight={w} /><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.6 2.6L16 9.5" stroke={w === "fill" ? "hsl(var(--card))" : undefined as any} /></>, "CheckCircle");
export const XCircle = makeIcon((w) => <><Duo d="M12 3a9 9 0 100 18 9 9 0 000-18Z" weight={w} /><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" stroke={w === "fill" ? "hsl(var(--card))" : undefined as any} /></>, "XCircle");
export const Circle = makeIcon((w) => <><Duo d="M12 3a9 9 0 100 18 9 9 0 000-18Z" weight={w} /><circle cx="12" cy="12" r="8.5" /></>, "Circle");
export const Info = makeIcon((w) => <><Duo d="M12 3a9 9 0 100 18 9 9 0 000-18Z" weight={w} /><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 7.75v.5" /></>, "Info");

/* ---------- nav / core ---------- */
export const Home = makeIcon((w) => <><Duo d="M4 11l8-6 8 6v8a1 1 0 01-1 1H5a1 1 0 01-1-1Z" weight={w} opacity={0.15} /><path d="M4 11l8-6 8 6" /><path d="M6 10v9h12v-9" /><path d="M10 19v-4.5h4V19" /></>, "Home");
export const Search = makeIcon((w) => <><Duo d="M11 5a6 6 0 100 12 6 6 0 000-12Z" weight={w} opacity={0.15} /><circle cx="11" cy="11" r="6.25" /><path d="M20 20l-4-4" /></>, "Search");
export const MapPin = makeIcon((w) => <><Duo d="M12 21c4.5-4.2 7-7.6 7-11a7 7 0 10-14 0c0 3.4 2.5 6.8 7 11Z" weight={w} opacity={0.15} /><path d="M12 21c4.5-4.2 7-7.6 7-11a7 7 0 10-14 0c0 3.4 2.5 6.8 7 11Z" /><circle cx="12" cy="10" r="2.5" /></>, "MapPin");
export const Bell = makeIcon((w) => <><Duo d="M6 17l-1 2h14l-1-2v-5a6 6 0 10-12 0Z" weight={w} opacity={0.15} /><path d="M6 17l-1 2h14l-1-2v-5a6 6 0 10-12 0Z" /><path d="M10 20.5a2 2 0 004 0" /></>, "Bell");
export const Heart = makeIcon((w) => <><Duo d="M12 20S4 14.6 4 9.6A3.9 3.9 0 0112 7a3.9 3.9 0 018 2.6C20 14.6 12 20 12 20Z" weight={w} /><path d="M12 20S4 14.6 4 9.6A3.9 3.9 0 0112 7a3.9 3.9 0 018 2.6C20 14.6 12 20 12 20Z" /></>, "Heart");
export const Star = makeIcon((w) => <><Duo d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" weight={w} /><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" /></>, "Star");
export const User = makeIcon((w) => <><Duo d="M12 4.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7ZM5.5 20a6.5 6.5 0 0113 0Z" weight={w} opacity={0.15} /><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20a6.5 6.5 0 0113 0" /></>, "User");
export const UserCircle = makeIcon((w) => <><Duo d="M12 3a9 9 0 100 18 9 9 0 000-18Z" weight={w} opacity={0.15} /><circle cx="12" cy="12" r="9" /><circle cx="12" cy="10" r="2.75" /><path d="M6.5 18.5a5.6 5.6 0 0111 0" /></>, "UserCircle");
export const Users = makeIcon((w) => <><Duo d="M9 5a3 3 0 100 6 3 3 0 000-6ZM3.5 19a5.5 5.5 0 0111 0Z" weight={w} opacity={0.15} /><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0111 0" /><path d="M15.5 5.5a3 3 0 010 5.8" /><path d="M16 14.2a5.5 5.5 0 014.5 4.8" /></>, "Users");
export const Calendar = makeIcon((w) => <><Duo d="M5 6h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1Z" weight={w} opacity={0.12} /><rect x="4" y="6" width="16" height="14" rx="2" /><path d="M4 10h16" /><path d="M8 3.5v4M16 3.5v4" /></>, "Calendar");
export const Clock = makeIcon((w) => <><Duo d="M12 3a9 9 0 100 18 9 9 0 000-18Z" weight={w} opacity={0.12} /><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>, "Clock");
export const MessageSquare = makeIcon((w) => <><Duo d="M20 15a2 2 0 01-2 2H9l-4 3V7a2 2 0 012-2h11a2 2 0 012 2Z" weight={w} opacity={0.14} /><path d="M20 15a2 2 0 01-2 2H9l-4 3V7a2 2 0 012-2h11a2 2 0 012 2Z" /></>, "MessageSquare");
export const Send = makeIcon((w) => <><Duo d="M21 4L3 11l6.5 2.5L12 20l3-8Z" weight={w} opacity={0.14} /><path d="M21 4L3 11l7 2.5L12.5 21 21 4Z" /><path d="M10 13.5L21 4" /></>, "Send");
export const Sparkle = makeIcon((w) => <><Duo d="M12 3c.7 4.5 1.8 5.6 6.3 6.3C13.8 10 12.7 11.1 12 15.6c-.7-4.5-1.8-5.6-6.3-6.3C10.2 8.6 11.3 7.5 12 3Z" weight={w} /><path d="M12 3c.7 4.5 1.8 5.6 6.3 6.3C13.8 10 12.7 11.1 12 15.6c-.7-4.5-1.8-5.6-6.3-6.3C10.2 8.6 11.3 7.5 12 3Z" /><path d="M18 15c.3 1.8.7 2.2 2.5 2.5-1.8.3-2.2.7-2.5 2.5-.3-1.8-.7-2.2-2.5-2.5 1.8-.3 2.2-.7 2.5-2.5Z" /></>, "Sparkle");
export const Shield = makeIcon((w) => <><Duo d="M12 3l7 2.5v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10v-5L12 3Z" weight={w} opacity={0.14} /><path d="M12 3l7 2.5v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10v-5L12 3Z" /></>, "Shield");
export const ShieldCheck = makeIcon((w) => <><Duo d="M12 3l7 2.5v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10v-5L12 3Z" weight={w} opacity={0.14} /><path d="M12 3l7 2.5v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10v-5L12 3Z" /><path d="M9 11.5l2 2 4-4" /></>, "ShieldCheck");
export const Sun = makeIcon((w) => <><Duo d="M12 8a4 4 0 100 8 4 4 0 000-8Z" weight={w} /><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" /></>, "Sun");
export const Moon = makeIcon((w) => <><Duo d="M20 14a8 8 0 11-9-9 6.5 6.5 0 009 9Z" weight={w} /><path d="M20 14a8 8 0 11-9-9 6.5 6.5 0 009 9Z" /></>, "Moon");

/* ---------- signature marks (unique KamboGuide) ---------- */
// Kambo ceremony mark — a vessel with the three application points.
export const KamboMark = makeIcon((w) => <><Duo d="M12 3a9 9 0 100 18 9 9 0 000-18Z" weight={w} opacity={0.12} /><circle cx="12" cy="12" r="9" /><circle cx="9" cy="10.5" r="1.15" fill="currentColor" stroke="none" /><circle cx="12" cy="9" r="1.15" fill="currentColor" stroke="none" /><circle cx="15" cy="10.5" r="1.15" fill="currentColor" stroke="none" /><path d="M8.5 14.5c1 1.6 2.1 2.4 3.5 2.4s2.5-.8 3.5-2.4" /></>, "KamboMark");
// Guide orb — concentric focus with an orbiting spark.
export const GuideOrb = makeIcon((w) => <><Duo d="M12 4.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15Z" weight={w} opacity={0.12} /><circle cx="12" cy="12" r="7.5" /><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" /><circle cx="18.5" cy="6.5" r="1.4" fill="currentColor" stroke="none" /></>, "GuideOrb");
// Journey — a winding path between two nodes.
export const Journey = makeIcon(() => <><path d="M5 18c3.5 0 3-5 6.5-5S15 8 18.5 8" /><circle cx="5" cy="18" r="1.8" fill="currentColor" stroke="none" /><circle cx="18.5" cy="8" r="1.8" fill="currentColor" stroke="none" /></>, "Journey");
// Ceremony flame.
export const Ceremony = makeIcon((w) => <><Duo d="M12 3c3 4 5 6 5 10a5 5 0 01-10 0c0-2 1-3.2 2-4 .4 1.6 1.5 2 2 2 0-3-1-5.2 1-8Z" weight={w} opacity={0.15} /><path d="M12 3c3 4 5 6 5 10a5 5 0 01-10 0c0-2 1-3.2 2-4 .4 1.6 1.5 2 2 2 0-3-1-5.2 1-8Z" /></>, "Ceremony");
