import { FormEvent, useEffect, useState } from 'react';
import { Plus, X, Users, GraduationCap } from 'lucide-react';
import { Topbar } from '../../components/layout/Topbar';
import { Card, EmptyState, Skeleton } from '../../components/ui/Primitives';
import { Button } from '../../components/ui/Button';
import { branchApi } from '../../api/endpoints';
import { Branch } from '../../types';
import { getApiErrorMessage } from '../../api/client';
import { notify } from '../../components/ui/toast';

export function SuperAdminBranchesPage() {
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function load() {
    branchApi
      .list()
      .then(({ data }) => setBranches(data.data))
      .catch((err) => notify.error(getApiErrorMessage(err)));
  }

  useEffect(load, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await branchApi.create({ name, address, phone });
      notify.success('Filial yaratildi');
      setShowModal(false);
      setName('');
      setAddress('');
      setPhone('');
      load();
    } catch (error) {
      notify.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <Topbar
        title="Filiallar"
        action={
          <Button onClick={() => setShowModal(true)} className="!px-3 !py-2">
            <Plus className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Yangi filial</span>
          </Button>
        }
      />
      <div className="space-y-3 px-4 py-5 sm:px-6">
        {branches === null ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : branches.length === 0 ? (
          <EmptyState
            title="Filial yo'q"
            description="Birinchi filialingizni yarating."
            action={<Button onClick={() => setShowModal(true)}>Filial yaratish</Button>}
          />
        ) : (
          branches.map((b) => (
            <Card key={b.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-brand-ink">{b.name}</p>
                  <p className="text-xs text-brand-slate">{b.address}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    b.isActive ? 'bg-brand-green-100 text-brand-green-600' : 'bg-slate-100 text-brand-slate'
                  }`}
                >
                  {b.isActive ? 'Faol' : 'Faol emas'}
                </span>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-brand-slate">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" aria-hidden />
                  {b._count?.teachers ?? 0} o'qituvchi
                </span>
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5" aria-hidden />
                  {b._count?.students ?? 0} o'quvchi
                </span>
              </div>
            </Card>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-xl2"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-brand-ink">Yangi filial</h2>
              <button type="button" onClick={() => setShowModal(false)} aria-label="Yopish">
                <X className="h-5 w-5 text-brand-slate" aria-hidden />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-brand-ink">Filial nomi</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-brand-ink">Manzil</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-brand-ink">Telefon</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-blue-500"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1">
                Bekor qilish
              </Button>
              <Button type="submit" isLoading={isSubmitting} className="flex-1">
                Yaratish
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
