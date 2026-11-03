import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AuthSession, User } from '../../domain/user';
import { authApi } from '../../api/authApi';
import { AUTH_SESSION_STORAGE_KEY, AUTH_UNAUTHORIZED_EVENT } from '../../api/httpClient';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(() => authApi.getStoredSession());

  // Verify stored token on mount and listen for 401 unauthorized events to fallback to login page
  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      const verified = await authApi.verifyStoredSession();
      if (active) {
        setSession(verified);
      }
    };

    checkSession();

    const handleUnauthorized = () => {
      authApi.clearSession();
      setSession(null);
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === AUTH_SESSION_STORAGE_KEY) {
        setSession(authApi.getStoredSession());
      }
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      active = false;
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Keep URL path in sync with authentication fallback (/login vs /)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isAuth = Boolean(session?.token && session?.user);
    if (!isAuth && window.location.pathname !== '/login') {
      window.history.replaceState(null, '', '/login');
    } else if (isAuth && window.location.pathname === '/login') {
      window.history.replaceState(null, '', '/');
    }
  }, [session]);

  const login = useCallback(async (email: string, password: string) => {
    const newSession = await authApi.login(email, password);
    setSession(newSession);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const newSession = await authApi.register(name, email, password);
    setSession(newSession);
  }, []);

  const logout = useCallback(() => {
    authApi.clearSession();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        token: session?.token ?? null,
        isAuthenticated: Boolean(session?.token && session?.user),
        login,
        register,
        logout,
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
