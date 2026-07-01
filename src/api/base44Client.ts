/**
 * Stub of the Base44 SDK client. Only the surface the app actually touches:
 *   base44.auth.me / logout / redirectToLogin
 *   base44.appLogs.logUserInApp
 * Backed by the mock session so AuthContext / NavigationTracker / PageNotFound
 * keep working offline.
 */
import { User } from '@/entities/User';
import * as session from '@/data/session';

export const base44 = {
  auth: {
    me: () => User.me(),
    logout: (_redirectUrl?: string) => {
      session.logout();
    },
    redirectToLogin: (_redirectUrl?: string) => {
      // Offline: there is no external login — just (re)establish the demo session.
      session.login();
    },
  },
  appLogs: {
    // Returns a Promise — call sites do `.catch(...)` on it.
    logUserInApp: (_pageName?: string) => Promise.resolve(),
  },
};

export default base44;
