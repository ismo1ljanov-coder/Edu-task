import { useEffect, useState } from 'react';
import { Plus, Phone } from 'lucide-react';
import { Topbar } from '../../components/layout/Topbar';
import { Card, EmptyState, Skeleton } from '../../components/ui/Primitives';
import { Button } from '../../components/ui/Button';
import { AddPersonModal } from '../../components/ui/AddPersonModal';
import { userApi } from '../../api/endpoints';
import { getApiErrorMessage } from '../../api/client';
import { notify } from '../../components/ui/toast';

interface TeacherRow {
  id: string;
  fullName: string;
  phone: string;
  isActive: boolean;
  teacher?: { _count: { groups: number; homeworks: number } };
}

export function BranchTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherRow[] | null>(null);
  const [showModal, setShowModal] = useState(false);

  function load() {
    userApi
      .listTeachers()
      .then(({ data }: any) => setTeachers(data.data))
      .catch((err) => notify.error(getApiErrorMessage(err)));
  }

  useEffect(load, []);

  return (
    <div>
      <Topbar
        title="O'qituvchilar"
        action={
          <Button onClick={() => setShowModal(true)} className="!px-3 !py-2">
            <Plus className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Qo'shish</span>
          </Button>
        }
      />
      <div className="space-y-3 px-4 py-5 sm:px-6">
        {teachers === null ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)
        ) : teachers.length === 0 ? (
          <EmptyState
            title="O'qituvchi yo'q"
            description="Filialingizga birinchi o'qituvchini qo'shing."
            action={<Button onClick={() => setShowModal(true)}>O'qituvchi qo'shish</Button>}
          />
        ) : (
          teachers.map((t) => (
            <Card key={t.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-brand-ink">{t.fullName}</p>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-brand-slate">
                  <Phone className="h-3 w-3" aria-hidden />
                  {t.phone}
                </div>
              </div>
              <div className="text-right text-xs text-brand-slate">
                <p>{t.teacher?._count.groups ?? 0} guruh</p>
                <p>{t.teacher?._count.homeworks ?? 0} vazifa</p>
              </div>
            </Card>
          ))
        )}
      </div>

      {showModal && (
        <AddPersonModal
          title="O'qituvchi qo'shish"
          onClose={() => setShowModal(false)}
          onSubmit={async (data) => {
            try {
              await userApi.createTeacher(data);
              notify.success("O'qituvchi qo'shildi");
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
