import { useEffect, useState } from 'react';
import { Plus, Phone, Trophy } from 'lucide-react';
import { Topbar } from '../../components/layout/Topbar';
import { Card, EmptyState, Skeleton } from '../../components/ui/Primitives';
import { Button } from '../../components/ui/Button';
import { AddPersonModal } from '../../components/ui/AddPersonModal';
import { userApi, groupApi } from '../../api/endpoints';
import { Group } from '../../types';
import { getApiErrorMessage } from '../../api/client';
import { notify } from '../../components/ui/toast';

interface StudentRow {
  id: string;
  fullName: string;
  phone: string;
  student?: { xp: number; streak: number; groupId: string | null };
}

export function BranchStudentsPage() {
  const [students, setStudents] = useState<StudentRow[] | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');

  function load() {
    userApi
      .listStudents()
      .then(({ data }: any) => setStudents(data.data))
      .catch((err) => notify.error(getApiErrorMessage(err)));
  }

  useEffect(() => {
    load();
    groupApi.list().then(({ data }) => {
      setGroups(data.data);
      if (data.data[0]) setSelectedGroupId(data.data[0].id);
    });
  }, []);

  async function togglePayment(studentId: string, status: 'PAID' | 'UNPAID') {
    try {
      const month = new Date();
      month.setDate(1);
      await userApi.setPayment({
        studentId,
        month: month.toISOString(),
        status,
        amount: 500000,
      });
      notify.success("To'lov holati yangilandi");
    } catch (error) {
      notify.error(getApiErrorMessage(error));
    }
  }

  return (
    <div>
      <Topbar
        title="O'quvchilar"
        action={
          <Button onClick={() => setShowModal(true)} className="!px-3 !py-2">
            <Plus className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Qo'shish</span>
          </Button>
        }
      />
      <div className="space-y-3 px-4 py-5 sm:px-6">
        {students === null ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : students.length === 0 ? (
          <EmptyState
            title="O'quvchi yo'q"
            description="Filialingizga birinchi o'quvchini qo'shing."
            action={<Button onClick={() => setShowModal(true)}>O'quvchi qo'shish</Button>}
          />
        ) : (
          students.map((s) => (
            <Card key={s.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-brand-ink">{s.fullName}</p>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-brand-slate">
                    <Phone className="h-3 w-3" aria-hidden />
                    {s.phone}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-amber-600">
                  <Trophy className="h-3.5 w-3.5" aria-hidden />
                  {s.student?.xp ?? 0} XP
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => togglePayment(s.id, 'PAID')}
                  className="flex-1 rounded-lg bg-brand-green-50 py-1.5 text-xs font-semibold text-brand-green-600 hover:bg-brand-green-100"
                >
                  To'landi
                </button>
                <button
                  onClick={() => togglePayment(s.id, 'UNPAID')}
                  className="flex-1 rounded-lg bg-red-50 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                >
                  To'lanmagan
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {showModal && (
        <AddPersonModal
          title="O'quvchi qo'shish"
          onClose={() => setShowModal(false)}
          extraField={
            <div>
              <label className="mb-1 block text-xs font-medium text-brand-ink">Guruh</label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-blue-500"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          }
          onSubmit={async (data) => {
            try {
              await userApi.createStudent({ ...data, groupId: selectedGroupId || undefined });
              notify.success("O'quvchi qo'shildi");
              setShowModal(false);
              load();
            } catch (error) {
              notify.error(getApiErrorMessage(error));
            }
          }}
        />
      )}
    </div>
  );
}
