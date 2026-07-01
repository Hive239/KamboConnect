import { useEffect, useState, Suspense } from 'react'
import { Toaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { User } from '@/entities/User'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import Landing from './pages/Landing'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import RoleSwitcher from '@/components/dev/RoleSwitcher';
import { ThemeProvider } from 'next-themes';
import { CartProvider } from '@/lib/cart';
import ErrorBoundary from '@/components/ErrorBoundary';
import CommandPalette from '@/components/CommandPalette';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// Routes that render standalone (no app sidebar): marketing + auth.
const BARE_ROUTES = new Set(['Auth', 'Landing']);

const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin"></div>
  </div>
);

/** Index route: logged-out visitors get the marketing Landing page; members get the app home. */
const IndexRoute = () => {
  const [state, setState] = useState<'loading' | 'app' | 'landing'>('loading');
  useEffect(() => {
    User.me().then((u) => setState(u ? 'app' : 'landing')).catch(() => setState('landing'));
  }, []);
  if (state === 'loading') return <Spinner />;
  if (state === 'landing') return <Landing />;
  return <LayoutWrapper currentPageName={mainPageKey}><MainPage /></LayoutWrapper>;
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
                : <LayoutWrapper currentPageName={path}>
                    <Page />
                  </LayoutWrapper>
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
          {import.meta.env.DEV && <RoleSwitcher />}
        </QueryClientProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
