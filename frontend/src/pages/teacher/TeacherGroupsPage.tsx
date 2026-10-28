import { FormEvent, useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { Topbar } from '../../components/layout/Topbar';
import { InviteButton } from '../../components/InviteButton';
import { Card, EmptyState, Skeleton } from '../../components/ui/Primitives';
import { groupApi } from '../../api/endpoints';
import { Group } from '../../types';
import { getApiErrorMessage } from '../../api/client';
import { notify } from '../../components/ui/toast';

export function TeacherGroupsPage() {
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  function load() {
    groupApi
      .list()
      .then(({ data }) => setGroups(data.data))
      .catch((err) => notify.error(getApiErrorMessage(err)));
  }

  useEffect(load, []);

  async function createGroup(e: FormEvent) {
    e.preventDefault();
    if (newName.trim().length < 2) return;
    setCreating(true);
    try {
      await groupApi.createMine(newName.trim());
      notify.success("Guruh ochildi — endi o'quvchilarni taklif qiling");
      setNewName('');
      load();
    } catch (err) {
      notify.error(getApiErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <Topbar title="Guruhlarim" />
      <div className="space-y-3 px-4 py-5 sm:px-6">
        <form onSubmit={createGroup} className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Yangi guruh nomi, masalan: Beginner 1"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-blue-500"
          />
          <button
            type="submit"
            disabled={creating || newName.trim().length < 2}
            className="shrink-0 rounded-xl bg-brand-blue-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {creating ? '...' : 'Ochish'}
          </button>
        </form>
        {groups === null ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : groups.length === 0 ? (
          <EmptyState
            title="Hali guruh yo'q"
            description="Yuqorida guruh nomini yozib oching, so'ng o'quvchilarga taklif havolasini yuboring."
          />
        ) : (
          groups.map((g) => (
            <Card key={g.id}>
              <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-brand-ink">{g.name}</p>
                <p className="text-xs text-brand-slate">{g._count?.homeworks ?? 0} ta homework</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-brand-blue-50 px-3 py-1.5 text-xs font-medium text-brand-blue-600">
                <Users className="h-3.5 w-3.5" aria-hidden />
                {g._count?.students ?? 0}
              </div>
              </div>
              <InviteButton
                role="STUDENT"
                groupId={g.id}
                label="O'quvchilarni taklif qilish"
                shareText={`${g.name} guruhi: uy vazifalari uchun EduTask'ga kiring`}
              />
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
