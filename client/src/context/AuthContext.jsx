import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('devpilot_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('devpilot_token'));
  const [isLoading, setIsLoading] = useState(true);

  const persistSession = useCallback((nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    if (nextUser && nextToken) {
      localStorage.setItem('devpilot_user', JSON.stringify(nextUser));
      localStorage.setItem('devpilot_token', nextToken);
    } else {
      localStorage.removeItem('devpilot_user');
      localStorage.removeItem('devpilot_token');
    }
  }, []);

  useEffect(() => {
    async function bootstrap() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.data.user);
      } catch {
        persistSession(null, null);
      } finally {
        setIsLoading(false);
      }
    }
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const register = useCallback(
    async (payload) => {
      try {
        const { data } = await api.post('/auth/register', payload);
        persistSession(data.data.user, data.data.token);
        return { success: true };
      } catch (error) {
        return { success: false, message: getErrorMessage(error, 'Registration failed') };
      }
    },
    [persistSession]
  );

  const login = useCallback(
    async (payload) => {
      try {
        const { data } = await api.post('/auth/login', payload);
        persistSession(data.data.user, data.data.token);
        return { success: true };
      } catch (error) {
        return { success: false, message: getErrorMessage(error, 'Login failed') };
      }
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    persistSession(null, null);
  }, [persistSession]);

  const value = useMemo(
    () => ({ user, token, isAuthenticated: Boolean(token && user), isLoading, register, login, logout }),
    [user, token, isLoading, register, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
