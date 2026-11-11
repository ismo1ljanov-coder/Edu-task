import { useEffect, useState } from 'react';
import { Download, X, CheckCircle2, Clock, Circle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Primitives';
import { homeworkApi } from '../../api/endpoints';
import { getApiErrorMessage } from '../../api/client';
import { notify } from '../ui/toast';
import { HomeworkResultsDetail } from '../../types';

const LANG_LABEL: Record<string, string> = { en: '🇬🇧 Ingliz', ru: '🇷🇺 Rus', ar: '🇸🇦 Arab' };

const STATUS: Record<string, { label: string; cls: string; Icon: typeof Circle }> = {
  COMPLETED: { label: 'Bajardi', cls: 'text-emerald-600 bg-emerald-50', Icon: CheckCircle2 },
  IN_PROGRESS: { label: 'Jarayonda', cls: 'text-amber-600 bg-amber-50', Icon: Clock },
  NOT_STARTED: { label: 'Boshlamagan', cls: 'text-slate-500 bg-slate-100', Icon: Circle },
};

/** Ustoz uchun: vazifa natijalari — kim bajardi, necha foiz, Excel'ga yuklash. */
export function HomeworkResultsModal({ homeworkId, onClose }: { homeworkId: string; onClose: () => void }) {
  const [data, setData] = useState<HomeworkResultsDetail | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    homeworkApi
      .results(homeworkId)
      .then(({ data }) => setData(data.data))
      .catch((err) => {
        notify.error(getApiErrorMessage(err));
        onClose();
      });
  }, [homeworkId, onClose]);

  async function download() {
    if (!data) return;
    setDownloading(true);
    try {
      const res = await homeworkApi.exportResults(homeworkId);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.title} - ${data.groupName}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      notify.error(getApiErrorMessage(err, "Faylni yuklab bo'lmadi"));
    } finally {
      setDownloading(false);
    }
  }

  const pct = data && data.total ? Math.round((data.completed / data.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-xl2">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-brand-ink">{data?.title ?? 'Natijalar'}</h2>
            {data && (
              <p className="text-xs text-brand-slate">
                {data.groupName} · {LANG_LABEL[data.language] ?? data.language} · {data.wordCount} ta so'z ·{' '}
                {new Date(data.endDate).toLocaleDateString('uz-UZ')} gacha
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Yopish">
            <X className="h-5 w-5 text-brand-slate" aria-hidden />
          </button>
        </div>

        {!data ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          <>
            <div className="mb-3 rounded-xl bg-brand-blue-50 p-3">
              <div className="mb-1 flex justify-between text-sm font-semibold text-brand-ink">
                <span>Bajardi</span>
                <span>
                  {data.completed}/{data.total} ({pct}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-brand-blue-500" style={{ width: `${pct}%` }} />
              </div>
            </div>

            {data.wordsWithoutTranslation.length > 0 && (
              <p className="mb-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
                {data.wordsWithoutTranslation.length} ta so'zning tarjimasi yo'q va o'yinga tushmaydi:{' '}
                {data.wordsWithoutTranslation.slice(0, 10).join(', ')}
                {data.wordsWithoutTranslation.length > 10 ? '…' : ''}
              </p>
            )}

            {data.rows.length === 0 ? (
              <p className="py-6 text-center text-sm text-brand-slate">Guruhda hali o'quvchi yo'q</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.rows.map((r) => {
                  const st = STATUS[r.status] ?? STATUS.NOT_STARTED;
                  return (
                    <li key={r.studentId} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-brand-ink">{r.fullName}</p>
                        <span className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${st.cls}`}>
                          <st.Icon className="h-3 w-3" aria-hidden />
                          {st.label}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-brand-ink">{r.progress}%</p>
                        {r.totalCount > 0 && (
                          <p className="text-[11px] text-brand-slate">
                            {r.correctCount}/{r.totalCount}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <Button onClick={download} isLoading={downloading} className="mt-4 w-full">
              <Download className="h-4 w-4" aria-hidden />
              Excel'ga yuklab olish
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
