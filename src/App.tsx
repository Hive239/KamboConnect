import { useEffect, useState, Suspense, type ReactNode } from 'react'
import { Toaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { User } from '@/entities/User'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import Landing from './pages/Landing'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { getRole, roleHome, canAccess, PUBLIC_PAGES } from '@/lib/roles';
import { createPageUrl } from '@/utils';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import RoleSwitcher from '@/components/dev/RoleSwitcher';
import { ThemeProvider } from 'next-themes';
import { CartProvider } from '@/lib/cart';
import ErrorBoundary from '@/components/ErrorBoundary';
import CommandPalette from '@/components/CommandPalette';
import CookieConsent from '@/components/CookieConsent';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

// Page content is wrapped in its own ErrorBoundary, keyed by route, so a single
// page crash is contained (the nav/sidebar stay usable) and clears on navigation.
const LayoutWrapper = ({ children, currentPageName }) => {
  const inner = <ErrorBoundary key={currentPageName}>{children}</ErrorBoundary>;
  return Layout ? <Layout currentPageName={currentPageName}>{inner}</Layout> : inner;
};

// Routes that render standalone (no app sidebar): marketing + auth.
const BARE_ROUTES = new Set(['Auth', 'Landing', 'ResetPassword']);

const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin"></div>
  </div>
);

/** Index route: logged-out visitors get the marketing Landing page; members go to their role-home. */
const IndexRoute = () => {
  const [state, setState] = useState<'loading' | 'landing'>('loading');
  const [home, setHome] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    User.me()
      .then((u) => { if (active) setHome(roleHome(getRole(u))); })
      .catch(() => { if (active) setState('landing'); });
    return () => { active = false; };
  }, []);
  if (state === 'landing') return <Landing />;
  if (home) return <Navigate to={home} replace />;
  return <Spinner />;
};

/**
 * Route guard: redirects a logged-in user whose role can't view `page` to their
 * role-home, and an anonymous visitor on a non-public page to sign-in. Central —
 * one wrapper covers every route, no per-page edits.
 */
const RequireRole = ({ page, children }: { page: string; children: ReactNode }) => {
  const [status, setStatus] = useState<'loading' | 'ok' | 'redirect'>('loading');
  const [dest, setDest] = useState('/');
  useEffect(() => {
    let active = true;
    User.me()
      .then((u) => {
        if (!active) return;
        if (canAccess(page, getRole(u))) setStatus('ok');
        else { setDest(roleHome(getRole(u))); setStatus('redirect'); }
      })
      .catch(() => {
        if (!active) return;
        if (PUBLIC_PAGES.has(page)) setStatus('ok');
        else { setDest(createPageUrl('Auth')); setStatus('redirect'); }
      });
    return () => { active = false; };
  }, [page]);
  if (status === 'loading') return <Spinner />;
  if (status === 'redirect') return <Navigate to={dest} replace />;
  return <>{children}</>;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app. Suspense catches the lazy page chunks while they load.
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/" element={<IndexRoute />} />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              BARE_ROUTES.has(path)
                ? <Page />
                : <RequireRole page={path}>
                    <LayoutWrapper currentPageName={path}>
                      <Page />
                    </LayoutWrapper>
                  </RequireRole>
            }
          />
        ))}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <AuthProvider>
        <CartProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <NavigationTracker />
            <CommandPalette />
            <ErrorBoundary>
              <AuthenticatedApp />
            </ErrorBoundary>
          </Router>
          <Toaster />
          <CookieConsent />
          {import.meta.env.DEV && <RoleSwitcher />}
        </QueryClientProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
