import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const token  = localStorage.getItem('day90_token');
    const stored = localStorage.getItem('day90_user');

    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('day90_user');
      }
    }
    setLoading(false);
  }, []);

  // Listen for auth:expired event from API interceptor
  useEffect(() => {
    const handler = () => {
      setUser(null);
      // Router will redirect via AuthGuard
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem('day90_token', token);
    localStorage.setItem('day90_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('day90_token');
    localStorage.removeItem('day90_user');
    setUser(null);
  }, []);

  const value = { user, loading, login, logout, isDemo: user?.isDemo || false };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
