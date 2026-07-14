import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { Topbar } from '../../components/layout/Topbar';
import { Card, EmptyState, Skeleton } from '../../components/ui/Primitives';
import { groupApi } from '../../api/endpoints';
import { Group } from '../../types';
import { getApiErrorMessage } from '../../api/client';
import { notify } from '../../components/ui/toast';

export function TeacherGroupsPage() {
  const [groups, setGroups] = useState<Group[] | null>(null);

  useEffect(() => {
    groupApi
      .list()
      .then(({ data }) => setGroups(data.data))
      .catch((err) => notify.error(getApiErrorMessage(err)));
  }, []);

  return (
    <div>
      <Topbar title="Guruhlarim" />
      <div className="space-y-3 px-4 py-5 sm:px-6">
        {groups === null ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : groups.length === 0 ? (
          <EmptyState
            title="Guruh biriktirilmagan"
            description="Filial admin sizga guruh biriktirganda shu yerda ko'rinadi."
          />
        ) : (
          groups.map((g) => (
            <Card key={g.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-brand-ink">{g.name}</p>
                <p className="text-xs text-brand-slate">{g._count?.homeworks ?? 0} ta homework</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-brand-blue-50 px-3 py-1.5 text-xs font-medium text-brand-blue-600">
                <Users className="h-3.5 w-3.5" aria-hidden />
                {g._count?.students ?? 0}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
