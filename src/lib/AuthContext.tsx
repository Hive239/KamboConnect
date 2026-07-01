/**
 * Auth context backed by the mock session (src/data/session).
 * Keeps the exact shape App.tsx and pages expect:
 *   { user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings,
 *     authError, appPublicSettings, logout, navigateToLogin, checkAppState }
 *
 * The original called the Base44 backend (`/api/apps/public`) on mount, which
 * gated the whole render and made the app un-runnable offline. That call is gone.
 */
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as session from '@/data/session';
import type { User } from '@/types/entities';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  isLoadingPublicSettings: boolean;
  authError: { type: string; message: string } | null;
  appPublicSettings: any;
  logout: (shouldRedirect?: boolean) => void;
  navigateToLogin: () => void;
  checkAppState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const SYNTHETIC_PUBLIC_SETTINGS = {
  id: 'kamboconnect',
  public_settings: { name: 'KamboConnect', requiresAuth: false },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState<{ type: string; message: string } | null>(null);
  const [appPublicSettings, setAppPublicSettings] = useState<any>(null);

  const checkAppState = useCallback(async () => {
    setAuthError(null);
    setIsLoadingPublicSettings(true);
    setIsLoadingAuth(true);
    // Public settings are static offline.
    setAppPublicSettings(SYNTHETIC_PUBLIC_SETTINGS);
    setIsLoadingPublicSettings(false);
    try {
      const currentUser = await session.getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkAppState();
    // Re-check whenever the demo session changes (Role Switcher).
    const unsub = session.onSessionChange(() => {
      checkAppState();
    });
    return unsub;
  }, [checkAppState]);

  const logout = (shouldRedirect = true) => {
    session.logout();
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) window.location.href = '/';
  };

  const navigateToLogin = () => {
    session.login();
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
