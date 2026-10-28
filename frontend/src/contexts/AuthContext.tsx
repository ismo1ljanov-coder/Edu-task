import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser } from '../types';
import { authApi } from '../api/endpoints';
import { getApiErrorMessage } from '../api/client';
import { getTelegram } from '../telegram';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  /** Telegram orqali kirish xatosi (masalan, havolasiz kirgan bo'lsa) */
  telegramError: string | null;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [telegramError, setTelegramError] = useState<string | null>(null);

  function saveSession(data: { accessToken: string; refreshToken: string; user: AuthUser }) {
    localStorage.setItem('edutask_access_token', data.accessToken);
    localStorage.setItem('edutask_refresh_token', data.refreshToken);
    localStorage.setItem('edutask_user', JSON.stringify(data.user));
    setUser(data.user);
  }

  useEffect(() => {
    const tg = getTelegram();
    const stored = localStorage.getItem('edutask_user');
    const token = localStorage.getItem('edutask_access_token');

    if (tg) {
      // Telegram ichida: har safar Telegram orqali kiramiz (taklif havolasi ham shu yerda qabul qilinadi)
      tg.ready();
      tg.expand();
      authApi
        .telegram(
          tg.initData,
          tg.initDataUnsafe?.start_param ||
            new URLSearchParams(window.location.search).get('invite') ||
            undefined,
        )
        .then(({ data }) => {
          saveSession(data.data);
          tg.requestWriteAccess?.();
        })
        .catch((error) => {
          setTelegramError(getApiErrorMessage(error, "Telegram orqali kirib bo'lmadi"));
          if (stored && token) setUser(JSON.parse(stored));
        })
        .finally(() => setIsLoading(false));
      return;
    }

    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  async function login(phone: string, password: string) {
    try {
      const { data } = await authApi.login(phone, password);
      saveSession(data.data);
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
    <AuthContext.Provider value={{ user, isLoading, telegramError, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
