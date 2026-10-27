import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

/**
 * So'zdon (sozdon-uzb) bilan server-to-server aloqa.
 * Autentifikatsiya: x-api-key = SOZDON_API_KEY. O'quvchilar telefon raqami
 * (oxirgi 9 raqam) orqali moslashtiriladi.
 */

interface SozdonProgressRow {
  phone: string;
  found: boolean;
  total: number;
  learned: number;
  percent: number;
}

function assertConfigured(): { url: string; key: string } {
  if (!env.sozdon.apiUrl || !env.sozdon.apiKey) {
    throw new ApiError(503, "So'zdon integratsiyasi sozlanmagan (SOZDON_API_URL / SOZDON_API_KEY)");
  }
  return { url: env.sozdon.apiUrl.replace(/\/+$/, ''), key: env.sozdon.apiKey };
}

async function sozdonFetch<T>(path: string, init: { method: string; body?: unknown }): Promise<T> {
  const { url, key } = assertConfigured();
  let res: Response;
  try {
    res = await fetch(`${url}${path}`, {
      method: init.method,
      headers: { 'content-type': 'application/json', 'x-api-key': key },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      // Render bepul serveri uyg'onguncha ~50 soniya ketishi mumkin
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new ApiError(502, "So'zdon bilan bog'lanib bo'lmadi. Birozdan so'ng qayta urinib ko'ring.");
  }

  const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const code = typeof payload.error === 'string' ? payload.error : '';
    if (code === 'user_not_found') {
      throw ApiError.notFound("Siz So'zdon'da ro'yxatdan o'tmagansiz. Avval sozdon.uz da ro'yxatdan o'ting (shu telefon raqam bilan).");
    }
    if (code === 'ambiguous_phone') {
      throw ApiError.conflict("Telefon raqam So'zdon'da bir necha hisobga to'g'ri keladi");
    }
    throw new ApiError(502, `So'zdon xatosi (${res.status})${code ? `: ${code}` : ''}`);
  }
  return payload as T;
}

/** Vazifa so'zlarini So'zdon'ga yuboradi (idempotent: har safar almashtiriladi). */
export async function pushHomework(homeworkId: string) {
  const homework = await prisma.homework.findUnique({
    where: { id: homeworkId },
    include: { words: { orderBy: { order: 'asc' } } },
  });
  if (!homework) throw ApiError.notFound('Vazifa topilmadi');
  if (homework.words.length === 0) throw ApiError.badRequest("Bu vazifada so'zlar yo'q");

  return sozdonFetch<{ requested: number; matched: number; unmatched: string[] }>(
    `/api/integrations/edutask/assignments/${encodeURIComponent(homework.id)}`,
    { method: 'PUT', body: { title: homework.title, words: homework.words.map((w) => w.word) } },
  );
}

/** O'quvchi uchun bir martalik kirish havolasini oladi. */
export async function createLaunchUrl(homeworkId: string, userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('Foydalanuvchi topilmadi');
  await pushHomework(homeworkId);
  const { url } = await sozdonFetch<{ url: string }>('/api/integrations/edutask/launch', {
    method: 'POST',
    body: { phone: user.phone, assignmentId: homeworkId },
  });
  return url;
}

/** Guruhdagi o'quvchilar progressini So'zdon'dan olib, HomeworkResult'ga yozadi. */
export async function syncHomeworkProgress(homeworkId: string) {
  const homework = await prisma.homework.findUnique({
    where: { id: homeworkId },
    include: { results: { include: { student: { include: { user: true } } } } },
  });
  if (!homework) throw ApiError.notFound('Vazifa topilmadi');
  if (homework.results.length === 0) return { synced: 0, results: [] as SozdonProgressRow[] };

  await pushHomework(homeworkId);
  const { results } = await sozdonFetch<{ results: SozdonProgressRow[] }>(
    '/api/integrations/edutask/progress',
    {
      method: 'POST',
      body: { assignmentId: homeworkId, phones: homework.results.map((r) => r.student.user.phone) },
    },
  );

  const key = (p: string) => p.replace(/\D/g, '').slice(-9);
  const byPhone = new Map(results.map((r) => [key(r.phone), r]));
  let synced = 0;

  for (const result of homework.results) {
    const row = byPhone.get(key(result.student.user.phone));
    if (!row || !row.found) continue;

    const status = row.percent >= 100 ? 'COMPLETED' : row.learned > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
    await prisma.homeworkResult.update({
      where: { id: result.id },
      data: {
        progress: row.percent,
        correctCount: row.learned,
        totalCount: row.total,
        status,
        startedAt: result.startedAt ?? (row.learned > 0 ? new Date() : null),
        completedAt: status === 'COMPLETED' ? (result.completedAt ?? new Date()) : null,
      },
    });
    synced++;
  }

  return { synced, results };
}
