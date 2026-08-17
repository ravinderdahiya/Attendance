import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as api from '../services/api';
import type { StaffUser } from '../types';

interface AuthState {
  user: StaffUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!api.getToken()) {
      setIsLoading(false);
      return;
    }
    api.me()
      .then(({ user }) => setUser(user))
      .catch(() => api.clearToken())
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const { token, user } = await api.managerLogin(username, password);
    api.setToken(token);
    setUser(user);
  };

  const logout = async () => {
    try { await api.logout(); } catch { /* token may already be invalid */ }
    api.clearToken();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
