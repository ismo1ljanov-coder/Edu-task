import { FormEvent, useEffect, useState } from 'react';
import { Plus, X, Users } from 'lucide-react';
import { Topbar } from '../../components/layout/Topbar';
import { Card, EmptyState, Skeleton } from '../../components/ui/Primitives';
import { Button } from '../../components/ui/Button';
import { groupApi, userApi } from '../../api/endpoints';
import { Group } from '../../types';
import { getApiErrorMessage } from '../../api/client';
import { notify } from '../../components/ui/toast';

interface TeacherOption {
  id: string;
  fullName: string;
  teacher?: { id: string };
}

export function BranchGroupsPage() {
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function load() {
    groupApi
      .list()
      .then(({ data }) => setGroups(data.data))
      .catch((err) => notify.error(getApiErrorMessage(err)));
  }

  useEffect(() => {
    load();
    userApi.listTeachers().then(({ data }: any) => setTeachers(data.data));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await groupApi.create({ name, teacherId });
      notify.success('Guruh yaratildi');
      setShowModal(false);
      setName('');
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
        title="Guruhlar"
        action={
          <Button onClick={() => setShowModal(true)} className="!px-3 !py-2">
            <Plus className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Yangi guruh</span>
          </Button>
        }
      />
      <div className="space-y-3 px-4 py-5 sm:px-6">
        {groups === null ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : groups.length === 0 ? (
          <EmptyState
            title="Guruh yo'q"
            description="Birinchi guruhingizni yarating va o'qituvchi biriktiring."
            action={<Button onClick={() => setShowModal(true)}>Guruh yaratish</Button>}
          />
        ) : (
          groups.map((g) => (
            <Card key={g.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-brand-ink">{g.name}</p>
                <p className="text-xs text-brand-slate">{g.teacher?.user.fullName}</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-brand-blue-50 px-3 py-1.5 text-xs font-medium text-brand-blue-600">
                <Users className="h-3.5 w-3.5" aria-hidden />
                {g._count?.students ?? 0}
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
              <h2 className="text-base font-bold text-brand-ink">Yangi guruh</h2>
              <button type="button" onClick={() => setShowModal(false)} aria-label="Yopish">
                <X className="h-5 w-5 text-brand-slate" aria-hidden />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-brand-ink">Guruh nomi</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-blue-500"
                  placeholder="Masalan: Intermediate — B2"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-brand-ink">O'qituvchi</label>
                <select
                  required
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-blue-500"
                >
                  <option value="">Tanlang</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.teacher?.id}>
                      {t.fullName}
                    </option>
                  ))}
                </select>
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
