import { ReactNode } from 'react';
import { NotificationBell } from '../notifications/NotificationBell';

export function Topbar({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/90 px-4 py-4 backdrop-blur sm:px-6">
      <h1 className="text-lg font-bold text-brand-ink">{title}</h1>
      <div className="flex items-center gap-2">
        {action}
        <NotificationBell />
      </div>
    </header>
  );
}
