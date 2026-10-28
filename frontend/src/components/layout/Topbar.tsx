import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';
import { useAuth } from '../../contexts/AuthContext';

export function Topbar({ title, action }: { title: string; action?: ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/90 px-4 py-4 backdrop-blur sm:px-6">
      <h1 className="text-lg font-bold text-brand-ink">{title}</h1>
      <div className="flex items-center gap-2">
        {action}
        <NotificationBell />
        {/* Telefonda yon panel yashirin, shuning uchun chiqish tugmasi shu yerda */}
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Chiqish"
          className="flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium text-red-500 hover:bg-red-50 lg:hidden"
        >
          <LogOut className="h-4.5 w-4.5" aria-hidden />
          Chiqish
        </button>
      </div>
    </header>
  );
}
