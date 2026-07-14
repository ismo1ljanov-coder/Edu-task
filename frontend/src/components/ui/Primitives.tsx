import { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl2 bg-white p-5 shadow-card border border-slate-100 ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  accent = 'blue',
}: {
  label: string;
  value: string | number;
  accent?: 'blue' | 'green';
}) {
  const accentClass = accent === 'blue' ? 'text-brand-blue-600' : 'text-brand-green-600';
  return (
    <Card>
      <p className="text-xs font-medium text-brand-slate">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accentClass}`}>{value}</p>
    </Card>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-20" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl2 border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue-50">
        <Inbox className="h-6 w-6 text-brand-blue-500" aria-hidden />
      </div>
      <h3 className="text-sm font-semibold text-brand-ink">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-brand-slate">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
