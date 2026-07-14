import { useEffect, useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { Topbar } from '../../components/layout/Topbar';
import { Card, EmptyState, Skeleton } from '../../components/ui/Primitives';
import { Button } from '../../components/ui/Button';
import { HomeworkForm } from '../../components/homework/HomeworkForm';
import { homeworkApi } from '../../api/endpoints';
import { Homework } from '../../types';
import { getApiErrorMessage } from '../../api/client';
import { notify } from '../../components/ui/toast';

export function TeacherHomeworkPage() {
  const [homeworks, setHomeworks] = useState<Homework[] | null>(null);
  const [showForm, setShowForm] = useState(false);

  function load() {
    homeworkApi
      .listForTeacher()
      .then(({ data }) => setHomeworks(data.data))
      .catch((err) => notify.error(getApiErrorMessage(err)));
  }

  useEffect(load, []);

  return (
    <div>
      <Topbar
        title="Uy vazifalari"
        action={
          <Button onClick={() => setShowForm(true)} className="!px-3 !py-2">
            <Plus className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Yangi vazifa</span>
          </Button>
        }
      />
      <div className="space-y-3 px-4 py-5 sm:px-6">
        {homeworks === null ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : homeworks.length === 0 ? (
          <EmptyState
            title="Hali vazifa yaratilmagan"
            description="Birinchi uy vazifangizni yarating — fayl yuklang yoki qo'lda so'z kiriting."
            action={<Button onClick={() => setShowForm(true)}>Vazifa yaratish</Button>}
          />
        ) : (
          homeworks.map((hw) => (
            <Card key={hw.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-brand-ink">{hw.title}</p>
                  <p className="text-xs text-brand-slate">{hw.group?.name}</p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-brand-blue-50 px-2.5 py-1 text-xs font-medium text-brand-blue-600">
                  <FileText className="h-3.5 w-3.5" aria-hidden />
                  {hw._count?.words ?? 0} so'z
                </div>
              </div>
              <div className="mt-2 flex justify-between text-xs text-brand-slate">
                <span>{new Date(hw.startDate).toLocaleDateString('uz-UZ')}</span>
                <span>{new Date(hw.endDate).toLocaleDateString('uz-UZ')}</span>
              </div>
            </Card>
          ))
        )}
      </div>

      {showForm && (
        <HomeworkForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}
