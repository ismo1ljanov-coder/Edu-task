import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { notify } from '../../components/ui/toast';

const roleHome: Record<string, string> = {
  SUPER_ADMIN: '/super-admin',
  BRANCH_ADMIN: '/branch-admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
};

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(phone, password);
      const stored = localStorage.getItem('edutask_user');
      const user = stored ? JSON.parse(stored) : null;
      navigate(roleHome[user?.role] ?? '/', { replace: true });
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
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

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl2 bg-white p-6 shadow-card">
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-brand-ink">
              Telefon raqami
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-slate" aria-hidden />
              <input
                id="phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="+998 90 123 45 67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-brand-ink">
              Parol
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-slate" aria-hidden />
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-blue-500"
              />
            </div>
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full">
            Kirish
          </Button>
        </form>
      </div>
    </div>
  );
}
