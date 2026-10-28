import { Navigate } from 'react-router-dom';
import { GraduationCap, Loader2, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getTelegram } from '../../telegram';

const roleHome: Record<string, string> = {
  SUPER_ADMIN: '/super-admin',
  BRANCH_ADMIN: '/branch-admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
};

const BOT_APP_URL = 'https://t.me/sozdon_bot/app';

// Kirish faqat Telegram orqali: ustoz/markaz bergan taklif havolasi yoki @sozdon_bot.
export function LoginPage() {
  const { user, isLoading, telegramError } = useAuth();
  const inTelegram = !!getTelegram();

  if (!isLoading && user) return <Navigate to={roleHome[user.role] ?? '/'} replace />;

  const message = inTelegram
    ? isLoading
      ? 'Kirilmoqda...'
      : telegramError ?? "Ustozingiz bergan havola orqali kiring."
    : "EduTask Telegram orqali ishlaydi. Ustozingiz yoki markazingiz bergan havolani oching.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-blue-50 to-white px-4">
      <div className="w-full max-w-sm rounded-xl2 bg-white p-6 text-center shadow-card">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue-500">
          {isLoading ? (
            <Loader2 className="h-7 w-7 animate-spin text-white" aria-hidden />
          ) : (
            <GraduationCap className="h-7 w-7 text-white" aria-hidden />
          )}
        </div>
        <h1 className="text-xl font-bold text-brand-ink">EduTask</h1>
        <p className="mt-1 text-xs text-brand-slate">Uy vazifalarini boshqarish tizimi</p>
        <p className="mt-4 text-sm text-brand-slate">{message}</p>
        {!inTelegram && (
          <a
            href={BOT_APP_URL}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue-500 px-4 py-3 text-sm font-semibold text-white"
          >
            <Send className="h-4 w-4" aria-hidden /> Telegram'da ochish
          </a>
        )}
      </div>
    </div>
  );
}
