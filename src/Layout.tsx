import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import {
  Search, Users, Calendar, Store, BookOpen, Menu, Heart, User as UserIcon,
  LogOut, Shield, Briefcase, Settings, LogIn, MessageSquare, ShieldCheck,
  PanelLeft, Sparkle, Trophy, MapPin, Package,
} from "@/lib/icons";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ProfileMenu from "@/components/layout/ProfileMenu";

// Main navigation (Desktop rail + Mobile sheet + Mobile bottom nav source)
const mainNavItems = [
  { title: "Directory", tKey: "nav.directory", url: createPageUrl("Directory"), icon: Search, isPublic: true },
  { title: "Map", tKey: "nav.map", url: createPageUrl("Map"), icon: MapPin, isPublic: true },
  { title: "Find Your Match", tKey: "nav.matchmaking", url: createPageUrl("Matchmaking"), icon: Sparkle, isPublic: true },
  { title: "Community", tKey: "nav.community", url: createPageUrl("Community"), icon: Users, isPublic: true },
  { title: "Events", tKey: "nav.events", url: createPageUrl("Events"), icon: Calendar, isPublic: true },
  { title: "My Bookings", tKey: "nav.bookings", url: createPageUrl("Bookings"), icon: Briefcase, isPublic: false },
  { title: "Messages", tKey: "nav.messages", url: createPageUrl("Messages"), icon: MessageSquare, isPublic: false },
  { title: "My Favorites", tKey: "nav.favorites", url: createPageUrl("Favorites"), icon: Heart, isPublic: false },
  { title: "Market", tKey: "nav.market", url: createPageUrl("Market"), icon: Store, isPublic: true },
  { title: "Learn", tKey: "nav.learn", url: createPageUrl("Education"), icon: BookOpen, isPublic: true },
];

// User/account items — surfaced in the top-right ProfileMenu (and mobile sheet)
const userDrawerItems = [
  { title: "Profile", tKey: "nav.profile", url: createPageUrl("Profile"), icon: UserIcon },
  { title: "My Account", tKey: "nav.account", url: createPageUrl("MyAccount"), icon: Settings },
  { title: "My Orders", tKey: "nav.orders", url: createPageUrl("Orders"), icon: Package },
  { title: "Practitioner Dashboard", tKey: "nav.practitionerDashboard", url: createPageUrl("PractitionerDashboard"), icon: Briefcase },
  { title: "Billing & Growth", tKey: "nav.billing", url: createPageUrl("Billing"), icon: Trophy },
  { title: "Admin Dashboard", tKey: "nav.adminDashboard", url: createPageUrl("AdminDashboard"), icon: ShieldCheck, adminOnly: true },
  { title: "Trust & Safety", tKey: "nav.trustSafety", url: createPageUrl("TrustSafety"), icon: Shield, adminOnly: true },
  { title: "Admin Verification", tKey: "nav.verification", url: createPageUrl("Verification"), icon: ShieldCheck, adminOnly: true },
  { title: "Legal Disclaimer", tKey: "nav.disclaimer", url: createPageUrl("Disclaimer"), icon: Shield },
];

const RAIL_KEY = "kc_rail_collapsed";

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [user, setUser] = useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem(RAIL_KEY) === "1",
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    User.me().then(setUser).catch(() => setUser(null));
  }, [location.pathname]);

  const toggleRail = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(RAIL_KEY, next ? "1" : "0");
      return next;
    });
  };

  const handleLogout = async () => {
    await User.logout();
    setUser(null);
    setIsSheetOpen(false);
    navigate(createPageUrl("Directory"));
  };
  const handleLogin = async () => { await User.login(); };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`${createPageUrl("Directory")}${search ? `?q=${encodeURIComponent(search)}` : ""}`);
  };

  const visibleMainNav = mainNavItems.filter((i) => i.isPublic || !!user);
  const visibleUserItems = userDrawerItems.filter((i) => !i.adminOnly || (user && user.role === "admin"));
  const navByTitle = (title: string) => mainNavItems.find((i) => i.title === title)!;
  const mobileBottomNav = [
    navByTitle("Directory"), navByTitle("Community"),
    ...(user ? [navByTitle("Events")] : []),
    navByTitle("Find Your Match"),
    user
      ? { title: "Profile", url: createPageUrl("Profile"), icon: UserIcon, isPublic: false }
      : { title: "Learn", url: createPageUrl("Education"), icon: BookOpen, isPublic: true },
  ];

  const isActive = (url: string) => location.pathname === url;

  /** Shared nav link with animated active pill + collapsed tooltip. */
  const NavLink = ({ item, onClick }: { item: any; onClick?: () => void }) => {
    const active = isActive(item.url);
    const Icon = item.icon;
    const link = (
      <Link
        to={item.url}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${
          active ? "text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        } ${collapsed ? "md:justify-center md:px-0" : ""}`}
      >
        {active && (
          <motion.span
            layoutId="nav-pill"
            className="absolute inset-0 rounded-lg bg-primary/10"
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }}
          />
        )}
        <Icon weight={active ? "fill" : "duotone"} className="relative z-10 h-5 w-5 shrink-0" />
        <span className={`relative z-10 ${collapsed ? "md:hidden" : ""}`}>{item.tKey ? t(item.tKey) : item.title}</span>
      </Link>
    );
    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">{item.tKey ? t(item.tKey) : item.title}</TooltipContent>
        </Tooltip>
      );
    }
    return link;
  };

  const Wordmark = ({ onClick }: { onClick?: () => void }) => (
    <Link to={createPageUrl("Directory")} onClick={onClick} className="flex items-center gap-2">
      <span className="font-display text-xl font-semibold bg-gradient-to-r from-primary to-clay bg-clip-text text-transparent">
        KamboGuide
      </span>
    </Link>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        {t("common.skipToContent")}
      </a>

      <div className="flex min-h-screen flex-col bg-background text-foreground">
        {/* ---------- Top bar ---------- */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-card/95 px-3 backdrop-blur-sm sm:px-4">
          {/* Mobile: hamburger opens sheet */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" weight="bold" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
              <div className="flex h-full flex-col">
                <div className="flex h-16 items-center border-b border-sidebar-border px-6">
                  <Wordmark onClick={() => setIsSheetOpen(false)} />
                </div>
                <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                  {visibleMainNav.map((item) => (
                    <NavLink key={item.title} item={item} onClick={() => setIsSheetOpen(false)} />
                  ))}
                  {user && (
                    <>
                      <div className="my-3 h-px bg-sidebar-border" />
                      {visibleUserItems.map((item) => (
                        <NavLink key={item.title} item={item} onClick={() => setIsSheetOpen(false)} />
                      ))}
                    </>
                  )}
                </nav>
                <div className="border-t border-sidebar-border p-3">
                  {user ? (
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
                    >
                      <LogOut className="h-5 w-5" weight="bold" /> {t("common.signOut")}
                    </button>
                  ) : (
                    <Button onClick={handleLogin} className="w-full gap-2">
                      <LogIn className="h-4 w-4" weight="bold" /> {t("common.signIn")}
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop: rail collapse toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            onClick={toggleRail}
          >
            <PanelLeft className="h-5 w-5" weight="duotone" />
          </Button>

          <Wordmark />

          {/* Center search (desktop) */}
          <form onSubmit={onSearchSubmit} className="ml-2 hidden max-w-md flex-1 md:flex">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("common.search")}
                aria-label={t("common.search")}
                className="h-10 rounded-full border-border bg-muted/60 pl-9 pr-14 focus-visible:bg-background"
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground lg:flex">
                ⌘K
              </kbd>
            </div>
          </form>

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            {user && <NotificationCenter />}
            <ProfileMenu user={user} items={visibleUserItems} onLogout={handleLogout} onLogin={handleLogin} />
          </div>
        </header>

        {/* ---------- Body: rail + content ---------- */}
        <div className="flex flex-1">
          {/* Desktop collapsible icon rail */}
          <motion.aside
            initial={false}
            animate={{ width: collapsed ? 72 : 198 }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 36 }}
            className="sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex"
          >
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {visibleMainNav.map((item) => (
                <NavLink key={item.title} item={item} />
              ))}
            </nav>
            <div className="border-t border-sidebar-border p-3">
              {!collapsed && (
                <p className="px-3 py-1 text-xs text-muted-foreground">
                  {user ? t("common.signedInAs", { name: user.full_name?.split(" ")[0] || "you" }) : t("common.guest")}
                </p>
              )}
            </div>
          </motion.aside>

          {/* Main content */}
          <main id="main-content" className="min-w-0 flex-1 bg-muted pb-24 md:pb-0">
            <motion.div
              key={location.pathname}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </main>
        </div>

        {/* ---------- Mobile bottom nav ---------- */}
        <footer className="fixed bottom-0 z-40 w-full border-t border-border bg-card/95 backdrop-blur-sm md:hidden">
          <nav className="grid grid-cols-5 px-1 py-1">
            {mobileBottomNav.map((item) => {
              const active = isActive(item.url);
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  aria-label={item.tKey ? t(item.tKey) : item.title}
                  aria-current={active ? "page" : undefined}
                  className="relative flex h-16 w-full flex-col items-center justify-center gap-1 rounded-lg"
                >
                  {active && (
                    <motion.span
                      layoutId="mobile-nav-pill"
                      className="absolute inset-x-3 top-2 h-9 rounded-full bg-primary/10"
                      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }}
                    />
                  )}
                  <Icon
                    weight={active ? "fill" : "duotone"}
                    className={`relative z-10 h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <span className={`relative z-10 text-[11px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
                    {item.tKey ? t(item.tKey) : item.title}
                  </span>
                </Link>
              );
            })}
          </nav>
        </footer>
      </div>
    </TooltipProvider>
  );
}
