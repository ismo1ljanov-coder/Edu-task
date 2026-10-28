import { useState } from 'react';
import { Copy, Link2, Loader2, Send } from 'lucide-react';
import { inviteApi, InviteResult } from '../api/endpoints';
import { getApiErrorMessage } from '../api/client';
import { notify } from './ui/toast';
import { shareLink } from '../telegram';

interface Props {
  role: 'BRANCH_ADMIN' | 'TEACHER' | 'STUDENT';
  branchId?: string;
  groupId?: string;
  label: string;
  /** Ulashishda havola bilan birga boradigan matn */
  shareText: string;
}

/** Telegram taklif havolasini yaratadi va ulashish/nusxa olish imkonini beradi. */
export function InviteButton({ role, branchId, groupId, label, shareText }: Props) {
  const [invite, setInvite] = useState<InviteResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function open() {
    if (invite) {
      setInvite(null);
      return;
    }
    setLoading(true);
    try {
      const { data } = await inviteApi.create({ role, branchId, groupId });
      setInvite(data.data);
    } catch (error) {
      notify.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(invite.link);
      notify.success('Havola nusxalandi');
    } catch {
      notify.error("Nusxa olib bo'lmadi — havolani qo'lda belgilang");
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={open}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-brand-blue-500/30 bg-brand-blue-50 px-3 py-2 text-xs font-semibold text-brand-blue-600 transition hover:bg-brand-blue-500 hover:text-white disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Link2 className="h-3.5 w-3.5" aria-hidden />}
        {label}
      </button>

      {invite && (
        <div className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="break-all font-mono text-xs text-brand-ink">{invite.link}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => shareLink(invite.link, shareText)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-blue-500 px-3 py-2 text-xs font-semibold text-white"
            >
              <Send className="h-3.5 w-3.5" aria-hidden /> Telegramda ulashish
            </button>
            <button
              type="button"
              onClick={copy}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-brand-ink"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden /> Nusxa
            </button>
          </div>
          <p className="text-[11px] text-brand-slate">
            {invite.uses} kishi qo'shildi · 30 kun amal qiladi
          </p>
        </div>
      )}
    </div>
  );
}
