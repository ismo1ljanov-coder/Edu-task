import { useEffect, useState } from 'react';
import { Building2, Users, GraduationCap } from 'lucide-react';
import { Topbar } from '../../components/layout/Topbar';
import { Card, SkeletonGrid } from '../../components/ui/Primitives';
import { statsApi } from '../../api/endpoints';
import { getApiErrorMessage } from '../../api/client';
import { notify } from '../../components/ui/toast';

interface PlatformStats {
  branchCount: number;
  teacherCount: number;
  studentCount: number;
  activeUserCount: number;
}

export function SuperAdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    statsApi
      .platform()
      .then(({ data }: any) => setStats(data.data))
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
                <Building2 className="h-4 w-4" aria-hidden />
                <p className="text-xs font-medium">Filiallar</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-brand-ink">{stats.branchCount}</p>
            </Card>
            <Card>
              <div className="flex items-center gap-2 text-brand-slate">
                <Users className="h-4 w-4" aria-hidden />
                <p className="text-xs font-medium">O'qituvchilar</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-brand-ink">{stats.teacherCount}</p>
            </Card>
            <Card>
              <div className="flex items-center gap-2 text-brand-slate">
                <GraduationCap className="h-4 w-4" aria-hidden />
                <p className="text-xs font-medium">O'quvchilar</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-brand-ink">{stats.studentCount}</p>
            </Card>
            <Card>
              <div className="flex items-center gap-2 text-brand-slate">
                <Users className="h-4 w-4" aria-hidden />
                <p className="text-xs font-medium">Faol foydalanuvchilar</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-brand-green-600">{stats.activeUserCount}</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
