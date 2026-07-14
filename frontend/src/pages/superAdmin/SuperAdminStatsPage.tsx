import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Topbar } from '../../components/layout/Topbar';
import { Card, SkeletonGrid } from '../../components/ui/Primitives';
import { Button } from '../../components/ui/Button';
import { statsApi } from '../../api/endpoints';
import { getApiErrorMessage } from '../../api/client';
import { notify } from '../../components/ui/toast';

export function SuperAdminStatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    statsApi
      .platform()
      .then(({ data }: any) => setStats(data.data))
      .catch((err) => notify.error(getApiErrorMessage(err)));
  }, []);

  async function handleExport() {
    setIsExporting(true);
    try {
      const response = await statsApi.exportBranchesPdf();
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'edutask-filiallar-hisoboti.pdf';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      notify.error(getApiErrorMessage(error, 'PDF eksport qilishda xatolik'));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div>
      <Topbar title="Statistika" />
      <div className="space-y-5 px-4 py-5 sm:px-6">
        {!stats ? (
          <SkeletonGrid count={4} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card>
                <p className="text-xs font-medium text-brand-slate">Filiallar</p>
                <p className="mt-1 text-2xl font-bold text-brand-ink">{stats.branchCount}</p>
              </Card>
              <Card>
                <p className="text-xs font-medium text-brand-slate">O'qituvchilar</p>
                <p className="mt-1 text-2xl font-bold text-brand-ink">{stats.teacherCount}</p>
              </Card>
              <Card>
                <p className="text-xs font-medium text-brand-slate">O'quvchilar</p>
                <p className="mt-1 text-2xl font-bold text-brand-ink">{stats.studentCount}</p>
              </Card>
              <Card>
                <p className="text-xs font-medium text-brand-slate">Faol foydalanuvchilar</p>
                <p className="mt-1 text-2xl font-bold text-brand-green-600">{stats.activeUserCount}</p>
              </Card>
            </div>

            <Card>
              <p className="mb-3 text-sm font-semibold text-brand-ink">To'lov holati (ko'rish uchun)</p>
              <div className="space-y-2">
                {(stats.paymentBreakdown ?? []).map((p: any) => (
                  <div key={p.status} className="flex justify-between text-sm">
                    <span className="text-brand-slate">{p.status}</span>
                    <span className="font-semibold text-brand-ink">{p.count}</span>
                  </div>
                ))}
                {(stats.paymentBreakdown ?? []).length === 0 && (
                  <p className="text-sm text-brand-slate">Hozircha to'lov ma'lumoti yo'q</p>
                )}
              </div>
            </Card>

            <Button onClick={handleExport} isLoading={isExporting} variant="secondary" className="w-full">
              <Download className="h-4 w-4" aria-hidden />
              Filiallar hisobotini PDF qilib yuklab olish
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
