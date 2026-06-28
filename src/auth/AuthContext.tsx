// Global auth/session state for Yala.
// Hydrates the session on mount: if a token exists, it fetches GET /users/me
// to get the full profile (role, isVerifiedSeller, reputation, avatar).
// Exposes login / register / logout and derived flags used across screens.

import React from 'react';
import * as authApi from '../api/auth';
import { subscribeIdentity } from '../api/realtime';

const AuthContext = React.createContext<any>(null);

// The backend has no buyer identity field, so the "DNI verified" flag lives on
// the client (set after a successful Didit check). Persisted so it survives a
// reload during the demo; cleared on logout.
const IDENTITY_KEY = 'yala.identityVerified';
const readIdentity = () => {
  try {
    return localStorage.getItem(IDENTITY_KEY) === 'true';
  } catch {
    return false;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [identityVerified, setIdentityVerifiedState] = React.useState(readIdentity);

  const setIdentityVerified = React.useCallback((value: any) => {
    const next = !!value;
    setIdentityVerifiedState(next);
    try {
      if (next) localStorage.setItem(IDENTITY_KEY, 'true');
      else localStorage.removeItem(IDENTITY_KEY);
    } catch {
      /* localStorage unavailable — keep it in memory only */
    }
  }, []);

  React.useEffect(() => {
    let alive = true;
    if (!authApi.hasSession()) {
      setLoading(false);
      return undefined;
    }
    authApi
      .getCurrentUser()
      .then((profile) => {
        if (alive) {
          setUser(profile);
          // Sync identity flag from backend (source of truth after first login).
          if (profile?.isIdentityVerified) setIdentityVerified(true);
        }
      })
      .catch(() => {
        // Token invalid/expired and refresh failed -> drop the session.
        authApi.logout();
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Subscribe to the per-user identity topic so the UI updates immediately
  // when the backend confirms a DNI check, without requiring a page reload.
  React.useEffect(() => {
    if (!user) return undefined;
    return subscribeIdentity(user.id, (msg: any) => {
      if (msg?.verified) {
        setIdentityVerified(true);
        // Re-fetch profile so user.isIdentityVerified is in sync with the backend.
        authApi.getCurrentUser().then((profile) => setUser(profile)).catch(() => {});
      }
    });
  }, [user?.id, setIdentityVerified]);

  const login = React.useCallback(async (credentials: any) => {
    await authApi.login(credentials);
    const profile = await authApi.getCurrentUser();
    setUser(profile);
    if (profile?.isIdentityVerified) setIdentityVerified(true);
    return profile;
  }, [setIdentityVerified]);

  const register = React.useCallback(async (payload: any) => {
    await authApi.register(payload);
    const profile = await authApi.getCurrentUser();
    setUser(profile);
    if (profile?.isIdentityVerified) setIdentityVerified(true);
    return profile;
  }, [setIdentityVerified]);

  const logout = React.useCallback(() => {
    authApi.logout();
    setUser(null);
    setIdentityVerified(false);
  }, [setIdentityVerified]);

  const value = React.useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isVerifiedSeller: !!(user && user.isVerifiedSeller),
      isIdentityVerified: identityVerified,
      setIdentityVerified,
      role: user ? user.role : null,
      login,
      register,
      logout,
    }),
    [user, loading, identityVerified, setIdentityVerified, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}
