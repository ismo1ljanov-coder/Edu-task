import { useEffect, useState } from 'react';
import { Users, GraduationCap, Boxes } from 'lucide-react';
import { Topbar } from '../../components/layout/Topbar';
import { Card, SkeletonGrid } from '../../components/ui/Primitives';
import { userApi, groupApi } from '../../api/endpoints';
import { getApiErrorMessage } from '../../api/client';
import { notify } from '../../components/ui/toast';

export function BranchAdminDashboardPage() {
  const [stats, setStats] = useState<{ teachers: number; students: number; groups: number } | null>(
    null,
  );

  useEffect(() => {
    Promise.all([userApi.listTeachers(1, 1), userApi.listStudents(1, 1), groupApi.list()])
      .then(([teachersRes, studentsRes, groupsRes]: any[]) => {
        setStats({
          teachers: teachersRes.data.pagination?.total ?? 0,
          students: studentsRes.data.pagination?.total ?? 0,
          groups: groupsRes.data.data.length,
        });
      })
      .catch((err) => notify.error(getApiErrorMessage(err)));
  }, []);

  return (
    <div>
      <Topbar title="Bosh sahifa" />
      <div className="px-4 py-5 sm:px-6">
        {!stats ? (
          <SkeletonGrid count={3} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Card>
              <div className="flex items-center gap-2 text-brand-slate">
                <Users className="h-4 w-4" aria-hidden />
                <p className="text-xs font-medium">O'qituvchilar</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-brand-ink">{stats.teachers}</p>
            </Card>
            <Card>
              <div className="flex items-center gap-2 text-brand-slate">
                <GraduationCap className="h-4 w-4" aria-hidden />
                <p className="text-xs font-medium">O'quvchilar</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-brand-ink">{stats.students}</p>
            </Card>
            <Card>
              <div className="flex items-center gap-2 text-brand-slate">
                <Boxes className="h-4 w-4" aria-hidden />
                <p className="text-xs font-medium">Guruhlar</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-brand-ink">{stats.groups}</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
