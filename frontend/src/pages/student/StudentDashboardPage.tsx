import { useEffect, useState } from 'react';
import { Flame, Trophy, ListChecks, CheckCircle2 } from 'lucide-react';
import { Topbar } from '../../components/layout/Topbar';
import { Card, SkeletonGrid } from '../../components/ui/Primitives';
import { homeworkApi } from '../../api/endpoints';
import { StudentDashboardSummary } from '../../types';
import { getApiErrorMessage } from '../../api/client';
import { notify } from '../../components/ui/toast';

export function StudentDashboardPage() {
  const [summary, setSummary] = useState<StudentDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    homeworkApi
      .studentDashboard()
      .then(({ data }) => setSummary(data.data))
      .catch((err) => notify.error(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <Topbar title="Bosh sahifa" />
      <div className="space-y-5 px-4 py-5 sm:px-6">
        {isLoading || !summary ? (
          <SkeletonGrid count={4} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card>
                <div className="flex items-center gap-2 text-brand-slate">
                  <ListChecks className="h-4 w-4" aria-hidden />
                  <p className="text-xs font-medium">Bugungi vazifalar</p>
                </div>
                <p className="mt-1 text-2xl font-bold text-brand-ink">{summary.todayTasksCount}</p>
              </Card>
              <Card>
                <div className="flex items-center gap-2 text-brand-slate">
                  <ListChecks className="h-4 w-4" aria-hidden />
                  <p className="text-xs font-medium">Tugallanmagan</p>
                </div>
                <p className="mt-1 text-2xl font-bold text-brand-ink">{summary.notCompletedCount}</p>
              </Card>
              <Card>
                <div className="flex items-center gap-2 text-brand-slate">
                  <CheckCircle2 className="h-4 w-4 text-brand-green-500" aria-hidden />
                  <p className="text-xs font-medium">Tugatilgan</p>
                </div>
                <p className="mt-1 text-2xl font-bold text-brand-green-600">{summary.completedCount}</p>
              </Card>
              <Card>
                <div className="flex items-center gap-2 text-brand-slate">
                  <Trophy className="h-4 w-4 text-amber-500" aria-hidden />
                  <p className="text-xs font-medium">XP</p>
                </div>
                <p className="mt-1 text-2xl font-bold text-brand-ink">{summary.xp}</p>
              </Card>
            </div>

            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" aria-hidden />
                  <p className="text-sm font-semibold text-brand-ink">
                    {summary.streak} kunlik streak
                  </p>
                </div>
                <p className="text-sm font-medium text-brand-slate">
                  Jami homework: {summary.totalHomeworkCount}
                </p>
              </div>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-brand-slate">
                  <span>Umumiy progress</span>
                  <span>{summary.progressPercent}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-green-500 transition-all"
                    style={{ width: `${summary.progressPercent}%` }}
                  />
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
