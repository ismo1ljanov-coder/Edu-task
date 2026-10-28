import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getTelegram } from '../../telegram';
import { GraduationCap, BookOpenCheck, Users, Building2, ShieldCheck, Loader2, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { notify } from '../../components/ui/toast';

const roleHome: Record<string, string> = {
  SUPER_ADMIN: '/super-admin',
  BRANCH_ADMIN: '/branch-admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
};

// Demo rejim: investor va mehmonlar parolsiz, bitta bosish bilan kiradi.
const DEMO_PASSWORD = 'Password123!';
const demoAccounts: { label: string; hint: string; phone: string; icon: LucideIcon }[] = [
  { label: "O'qituvchi", hint: 'Vazifa yaratish va tekshirish', phone: '+998900000003', icon: BookOpenCheck },
  { label: "O'quvchi", hint: 'Vazifani bajarish (So\'zdon orqali)', phone: '+998900000004', icon: Users },
  { label: 'Filial admin', hint: "Guruhlar va o'qituvchilar nazorati", phone: '+998900000002', icon: Building2 },
  { label: 'Super admin', hint: "Barcha filiallar statistikasi", phone: '+998900000001', icon: ShieldCheck },
];

export function LoginPage() {
  const { login, user, isLoading, telegramError } = useAuth();
  const navigate = useNavigate();
  const [loadingPhone, setLoadingPhone] = useState<string | null>(null);

  async function enterAs(phone: string) {
    if (loadingPhone) return;
    setLoadingPhone(phone);
    try {
      await login(phone, DEMO_PASSWORD);
      const stored = localStorage.getItem('edutask_user');
      const user = stored ? JSON.parse(stored) : null;
      navigate(roleHome[user?.role] ?? '/', { replace: true });
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Xatolik yuz berdi, qayta urinib ko\'ring');
    } finally {
      setLoadingPhone(null);
    }
  }

  if (!isLoading && user) return <Navigate to={roleHome[user.role] ?? '/'} replace />;

  // Telegram ichida demo tugmalar ko'rsatilmaydi — faqat taklif havolasi orqali kiriladi
  if (getTelegram()) {
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
          <p className="mt-2 text-sm text-brand-slate">
            {isLoading ? 'Kirilmoqda...' : telegramError ?? "Ustozingiz bergan havola orqali kiring."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-blue-50 to-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue-500 shadow-card">
            <GraduationCap className="h-7 w-7 text-white" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-brand-ink">EduTask</h1>
          <p className="mt-1 text-sm text-brand-slate">Uy vazifalarini boshqarish tizimi</p>
        </div>

        <div className="space-y-3 rounded-xl2 bg-white p-6 shadow-card">
          <p className="mb-1 text-center text-sm font-medium text-brand-ink">Demo: kim sifatida kirasiz?</p>
          {demoAccounts.map(({ label, hint, phone, icon: Icon }) => (
            <button
              key={phone}
              type="button"
              onClick={() => enterAs(phone)}
              disabled={loadingPhone !== null}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-brand-blue-500 hover:bg-brand-blue-50 disabled:opacity-60"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-blue-50 text-brand-blue-500">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-brand-ink">{label}</span>
                <span className="block text-xs text-brand-slate">{hint}</span>
              </span>
              {loadingPhone === phone ? (
                <Loader2 className="h-4 w-4 animate-spin text-brand-blue-500" aria-hidden />
              ) : (
                <ChevronRight className="h-4 w-4 text-brand-slate" aria-hidden />
              )}
            </button>
          ))}
          <p className="pt-1 text-center text-xs text-brand-slate">
            Birinchi kirish 30–50 soniya olishi mumkin: server uyg'onmoqda.
          </p>
        </div>
      </div>
    </div>
  );
}
