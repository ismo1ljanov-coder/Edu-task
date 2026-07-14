import { useEffect, useState } from 'react';
import { ExternalLink, Calendar } from 'lucide-react';
import { Topbar } from '../../components/layout/Topbar';
import { Card, EmptyState, Skeleton } from '../../components/ui/Primitives';
import { homeworkApi, sozdonApi } from '../../api/endpoints';
import { HomeworkResultRow } from '../../types';
import { getApiErrorMessage } from '../../api/client';
import { notify } from '../../components/ui/toast';

// The real So'zdon (Word-Box-Game) site the student is redirected to.
// Configure via VITE_SOZDON_URL — defaults to the production domain.
const SOZDON_URL = import.meta.env.VITE_SOZDON_URL ?? 'https://sozdon.uz';

const statusLabel: Record<string, { text: string; className: string }> = {
  NOT_STARTED: { text: 'Boshlanmagan', className: 'bg-slate-100 text-brand-slate' },
  IN_PROGRESS: { text: 'Jarayonda', className: 'bg-amber-100 text-amber-700' },
  COMPLETED: { text: 'Tugatilgan', className: 'bg-brand-green-100 text-brand-green-600' },
};

const levelLabel: Record<string, string> = {
  BEGINNER: 'Boshlang\'ich',
  ELEMENTARY: 'Elementary',
  INTERMEDIATE: 'Intermediate',
  UPPER_INTERMEDIATE: 'Upper-Intermediate',
  ADVANCED: 'Advanced',
};

export function StudentHomeworkPage() {
  const [rows, setRows] = useState<HomeworkResultRow[] | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    homeworkApi
      .listForStudent()
      .then(({ data }) => setRows(data.data))
      .catch((err) => notify.error(getApiErrorMessage(err)));
  }, []);

  // Called when the student taps "So'zdon orqali bajarish". We first ping our
  // own mock /sozdon/start endpoint (so a session record exists on our side),
  // then open the real sozdon.uz site in a new tab with the homework id so
  // So'zdon knows which word list to load once its own API is ready.
  async function handleOpenSozdon(homeworkId: string) {
    setOpeningId(homeworkId);
    try {
      await sozdonApi.start(homeworkId);
    } catch {
      // Non-blocking: even if our mock call fails, still let the student
      // continue to So'zdon — the backend integration isn't live yet anyway.
    } finally {
      setOpeningId(null);
      const url = `${SOZDON_URL}/?homeworkId=${encodeURIComponent(homeworkId)}&source=edutask`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <div>
      <Topbar title="Vazifalarim" />
      <div className="space-y-3 px-4 py-5 sm:px-6">
        {rows === null ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : rows.length === 0 ? (
          <EmptyState
            title="Hozircha vazifa yo'q"
            description="O'qituvchingiz yangi uy vazifasi berganda shu yerda ko'rinadi."
          />
        ) : (
          rows.map((row) => {
            const status = statusLabel[row.status];
            return (
              <Card key={row.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-brand-ink">
                      {row.homework.title}
                    </p>
                    <p className="mt-0.5 text-xs text-brand-slate">
                      {levelLabel[row.homework.level]} · {row.homework._count.words} ta so'z
                    </p>
                    <div className="mt-1.5 flex items-center gap-1 text-xs text-brand-slate">
                      <Calendar className="h-3.5 w-3.5" aria-hidden />
                      {new Date(row.homework.startDate).toLocaleDateString('uz-UZ')} —{' '}
                      {new Date(row.homework.endDate).toLocaleDateString('uz-UZ')}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>
                    {status.text}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-brand-slate">
                    <span>Progress</span>
                    <span>{row.progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-blue-500"
                      style={{ width: `${row.progress}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleOpenSozdon(row.homework.id)}
                  disabled={openingId === row.homework.id}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-600 disabled:opacity-60"
                >
                  {openingId === row.homework.id ? "Ochilmoqda..." : "So'zdon orqali bajarish"}
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </button>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
