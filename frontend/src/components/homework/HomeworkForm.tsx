import { FormEvent, useEffect, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { groupApi, homeworkApi } from '../../api/endpoints';
import { Group, HomeworkLevel } from '../../types';
import { getApiErrorMessage } from '../../api/client';
import { notify } from '../ui/toast';

const levels: { value: HomeworkLevel; label: string }[] = [
  { value: 'BEGINNER', label: "Boshlang'ich" },
  { value: 'ELEMENTARY', label: 'Elementary' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'UPPER_INTERMEDIATE', label: 'Upper-Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
];

export function HomeworkForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<HomeworkLevel>('INTERMEDIATE');
  const [groupId, setGroupId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [manualWords, setManualWords] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    groupApi.list().then(({ data }) => {
      setGroups(data.data);
      if (data.data[0]) setGroupId(data.data[0].id);
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!groupId) {
      notify.error("Guruhni tanlang");
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('level', level);
      formData.append('groupId', groupId);
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      if (manualWords.trim()) formData.append('manualWords', manualWords);
      if (file) formData.append('file', file);

      await homeworkApi.createTeacher(formData);
      notify.success('Uy vazifasi yaratildi');
      onCreated();
    } catch (error) {
      notify.error(getApiErrorMessage(error, "Vazifa yaratishda xatolik"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-xl2"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-brand-ink">Yangi uy vazifasi</h2>
          <button type="button" onClick={onClose} aria-label="Yopish">
            <X className="h-5 w-5 text-brand-slate" aria-hidden />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-brand-ink">Nomi</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-blue-500"
              placeholder="Masalan: Unit 4 — Travel vocabulary"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-brand-ink">Tavsif</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-brand-ink">Daraja</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as HomeworkLevel)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-blue-500"
              >
                {levels.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-brand-ink">Guruh</label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-blue-500"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-brand-ink">Boshlanish sanasi</label>
              <input
                required
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-brand-ink">Tugash sanasi</label>
              <input
                required
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-brand-ink">
              Fayl yuklash (PDF, DOCX, XLSX)
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-4 text-sm text-brand-slate hover:border-brand-blue-400">
              <UploadCloud className="h-4 w-4" aria-hidden />
              {file ? file.name : 'Faylni tanlang'}
              <input
                type="file"
                accept=".pdf,.docx,.xlsx,.xls"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <p className="mt-1 text-xs text-brand-slate">
              Fayl yuklanganda inglizcha so'zlar avtomatik ajratib olinadi.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-brand-ink">
              Qo'lda so'z kiritish (vergul bilan ajrating)
            </label>
            <input
              value={manualWords}
              onChange={(e) => setManualWords(e.target.value)}
              placeholder="apple, journey, weather"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-blue-500"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Bekor qilish
          </Button>
          <Button type="submit" isLoading={isSubmitting} className="flex-1">
            Saqlash
          </Button>
        </div>
      </form>
    </div>
  );
}
