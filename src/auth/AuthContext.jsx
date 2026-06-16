// Global auth/session state for Yala.
// Hydrates the session on mount: if a token exists, it fetches GET /users/me
// to get the full profile (role, isVerifiedSeller, reputation, avatar).
// Exposes login / register / logout and derived flags used across screens.

import React from 'react';
import * as authApi from '../api/auth.js';

const AuthContext = React.createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    if (!authApi.hasSession()) {
      setLoading(false);
      return undefined;
    }
    authApi
      .getCurrentUser()
      .then((profile) => {
        if (alive) setUser(profile);
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

  const login = React.useCallback(async (credentials) => {
    await authApi.login(credentials);
    const profile = await authApi.getCurrentUser();
    setUser(profile);
    return profile;
  }, []);

  const register = React.useCallback(async (payload) => {
    await authApi.register(payload);
    const profile = await authApi.getCurrentUser();
    setUser(profile);
    return profile;
  }, []);

  const logout = React.useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isVerifiedSeller: !!(user && user.isVerifiedSeller),
      role: user ? user.role : null,
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout],
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
