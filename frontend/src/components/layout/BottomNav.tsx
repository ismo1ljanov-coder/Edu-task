import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { navByRole } from './nav.config';

export function BottomNav() {
  const { user } = useAuth();
  if (!user) return null;
  const items = navByRole[user.role].slice(0, 4);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-100 bg-white/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${
              isActive ? 'text-brand-blue-600' : 'text-brand-slate'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className={`h-5 w-5 ${isActive ? 'text-brand-blue-600' : ''}`} aria-hidden />
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
