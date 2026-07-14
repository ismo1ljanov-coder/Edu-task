import { NavLink } from 'react-router-dom';
import { GraduationCap, LogOut } from 'lucide-react';
import { navByRole } from './nav.config';
import { useAuth } from '../../contexts/AuthContext';

export function Sidebar() {
  const { user, logout } = useAuth();
  if (!user) return null;
  const items = navByRole[user.role];

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-100 bg-white lg:flex">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue-500">
          <GraduationCap className="h-5 w-5 text-white" aria-hidden />
        </div>
        <span className="text-lg font-bold text-brand-ink">EduTask</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-blue-50 text-brand-blue-600'
                  : 'text-brand-slate hover:bg-slate-50 hover:text-brand-ink'
              }`
            }
          >
            <item.icon className="h-4.5 w-4.5" aria-hidden />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="mb-2 px-3">
          <p className="truncate text-sm font-semibold text-brand-ink">{user.fullName}</p>
          <p className="text-xs text-brand-slate">{roleLabel(user.role)}</p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50"
        >
          <LogOut className="h-4.5 w-4.5" aria-hidden />
          Chiqish
        </button>
      </div>
    </aside>
  );
}

export function roleLabel(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'BRANCH_ADMIN':
      return 'Filial Admin';
    case 'TEACHER':
      return "O'qituvchi";
    case 'STUDENT':
      return "O'quvchi";
    default:
      return role;
  }
}
