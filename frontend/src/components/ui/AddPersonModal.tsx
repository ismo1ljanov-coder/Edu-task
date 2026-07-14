import { FormEvent, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';

export function AddPersonModal({
  title,
  onClose,
  onSubmit,
  extraField,
}: {
  title: string;
  onClose: () => void;
  onSubmit: (data: { fullName: string; phone: string; password: string }) => Promise<void>;
  extraField?: React.ReactNode;
}) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ fullName, phone, password });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-xl2"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-brand-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Yopish">
            <X className="h-5 w-5 text-brand-slate" aria-hidden />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-brand-ink">To'liq ism</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-brand-ink">Telefon raqami</label>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998901234567"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-brand-ink">Vaqtinchalik parol</label>
            <input
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-blue-500"
            />
          </div>
          {extraField}
        </div>

        <div className="mt-5 flex gap-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Bekor qilish
          </Button>
          <Button type="submit" isLoading={isSubmitting} className="flex-1">
            Qo'shish
          </Button>
        </div>
      </form>
    </div>
  );
}
