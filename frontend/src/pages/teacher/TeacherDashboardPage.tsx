import { useEffect, useState } from 'react';
import { Boxes, BookOpenCheck, Users, TrendingUp } from 'lucide-react';
import { Topbar } from '../../components/layout/Topbar';
import { Card, SkeletonGrid } from '../../components/ui/Primitives';
import { groupApi, homeworkApi } from '../../api/endpoints';
import { getApiErrorMessage } from '../../api/client';
import { notify } from '../../components/ui/toast';

export function TeacherDashboardPage() {
  const [stats, setStats] = useState<{
    groupsCount: number;
    homeworkCount: number;
    studentsCount: number;
  } | null>(null);

  useEffect(() => {
    Promise.all([groupApi.list(), homeworkApi.listForTeacher(1, 1)])
      .then(([groupsRes, hwRes]) => {
        const groups = groupsRes.data.data;
        const studentsCount = groups.reduce((acc, g) => acc + (g._count?.students ?? 0), 0);
        setStats({
          groupsCount: groups.length,
          homeworkCount: hwRes.data.pagination?.total ?? 0,
          studentsCount,
        });
      })
      .catch((err) => notify.error(getApiErrorMessage(err)));
  }, []);

  return (
    <div>
      <Topbar title="Bosh sahifa" />
      <div className="px-4 py-5 sm:px-6">
        {!stats ? (
          <SkeletonGrid count={4} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card>
              <div className="flex items-center gap-2 text-brand-slate">
                <Boxes className="h-4 w-4" aria-hidden />
                <p className="text-xs font-medium">Guruhlar</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-brand-ink">{stats.groupsCount}</p>
            </Card>
            <Card>
              <div className="flex items-center gap-2 text-brand-slate">
                <BookOpenCheck className="h-4 w-4" aria-hidden />
                <p className="text-xs font-medium">Homework</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-brand-ink">{stats.homeworkCount}</p>
            </Card>
            <Card>
              <div className="flex items-center gap-2 text-brand-slate">
                <Users className="h-4 w-4" aria-hidden />
                <p className="text-xs font-medium">Faol o'quvchilar</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-brand-ink">{stats.studentsCount}</p>
            </Card>
            <Card>
              <div className="flex items-center gap-2 text-brand-slate">
                <TrendingUp className="h-4 w-4" aria-hidden />
                <p className="text-xs font-medium">O'rtacha bajarilish</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-brand-green-600">—</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
