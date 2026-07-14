import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationApi } from '../../api/endpoints';
import { NotificationItem } from '../../types';
import { Skeleton } from '../ui/Primitives';

const typeIcon: Record<string, string> = {
  HOMEWORK_ASSIGNED: '📘',
  HOMEWORK_COMPLETED: '✅',
  NEW_STUDENT: '🎓',
  ANNOUNCEMENT: '📣',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    setIsLoading(true);
    try {
      const { data } = await notificationApi.list(1, 10);
      setItems(data.data.items);
      setUnreadCount(data.data.unreadCount);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function handleMarkAllRead() {
    await notificationApi.markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Bildirishnomalar"
        className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
      >
        <Bell className="h-5 w-5 text-brand-ink" aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[90vw] rounded-xl2 border border-slate-100 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-brand-ink">Bildirishnomalar</p>
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-xs font-medium text-brand-blue-600 hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden />
              Barchasini o'qish
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-brand-slate">
                Hozircha bildirishnoma yo'q
              </p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 border-b border-slate-50 px-4 py-3 last:border-0 ${
                    !n.isRead ? 'bg-brand-blue-50/40' : ''
                  }`}
                >
                  <span className="text-lg leading-none">{typeIcon[n.type] ?? '🔔'}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-brand-ink">{n.title}</p>
                    <p className="text-xs text-brand-slate">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
