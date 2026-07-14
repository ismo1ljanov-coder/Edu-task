import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser } from '../types';
import { authApi } from '../api/endpoints';
import { getApiErrorMessage } from '../api/client';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('edutask_user');
    const token = localStorage.getItem('edutask_access_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  async function login(phone: string, password: string) {
    try {
      const { data } = await authApi.login(phone, password);
      localStorage.setItem('edutask_access_token', data.data.accessToken);
      localStorage.setItem('edutask_refresh_token', data.data.refreshToken);
      localStorage.setItem('edutask_user', JSON.stringify(data.data.user));
      setUser(data.data.user);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Telefon raqami yoki parol noto'g'ri"));
    }
  }

  function logout() {
    localStorage.removeItem('edutask_access_token');
    localStorage.removeItem('edutask_refresh_token');
    localStorage.removeItem('edutask_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
