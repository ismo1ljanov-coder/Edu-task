import { HomeworkResultStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { escapeHtml, sendTelegramMessage } from '../utils/telegram';

// ---------------------------------------------------------------------------
// Muddat eslatmasi: vazifaning oxirgi kuni ertalab (Toshkent vaqti ~09:00)
// hali bajarmagan o'quvchilarga Telegram orqali bir marta eslatma yuboriladi.
// "Tugash sanasi" kun oxirigacha amal qiladi deb hisoblanadi.
// ---------------------------------------------------------------------------

const CHECK_EVERY_MS = 30 * 60_000;
const TASHKENT_OFFSET_MS = 5 * 3600_000;
const REMIND_AT_LOCAL_HOUR = 9;

/** Ustun mavjud bo'lmasa qo'shadi (schema o'zgarishi production bazaga yetib borishi uchun). */
export async function ensureHomeworkColumns() {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Homework" ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'en'`,
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Homework" ADD COLUMN IF NOT EXISTS "reminderSentAt" TIMESTAMP(3)`,
    );
  } catch (e) {
    console.warn('[schema] Homework ustunlarini qo\'shib bo\'lmadi:', (e as Error).message);
  }
}

export async function sendDueReminders(now = new Date()) {
  // Bugungi sana (Toshkent) 00:00 UTC ko'rinishida — endDate shu ko'rinishda saqlanadi
  const local = new Date(now.getTime() + TASHKENT_OFFSET_MS);
  if (local.getUTCHours() < REMIND_AT_LOCAL_HOUR) return 0;
  const dayStart = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
  const dayEnd = new Date(dayStart.getTime() + 24 * 3600_000);

  const homeworks = await prisma.homework.findMany({
    where: { reminderSentAt: null, endDate: { gte: dayStart, lt: dayEnd } },
    include: { results: { select: { studentId: true, status: true } } },
  });
  const appLink = `https://t.me/${env.telegram.botUsername}/${env.telegram.appShortName}`;
  let sent = 0;
  for (const hw of homeworks) {
    // Avval belgilaymiz — server qayta ishga tushsa ham ikki marta yubormaslik uchun
    await prisma.homework.update({ where: { id: hw.id }, data: { reminderSentAt: now } });
    // Guruhdagi barcha o'quvchilar (vazifadan keyin qo'shilganlar ham), bajarganlardan tashqari
    const status = new Map(hw.results.map((r) => [r.studentId, r.status]));
    const students = await prisma.student.findMany({
      where: { groupId: hw.groupId },
      select: { id: true, user: { select: { telegramId: true } } },
    });
    for (const st of students) {
      const st8 = status.get(st.id);
      if (st8 === HomeworkResultStatus.COMPLETED) continue;
      const tgId = st.user.telegramId;
      if (!tgId) continue;
      const text =
        st8 === HomeworkResultStatus.IN_PROGRESS
          ? `⏰ Bugun oxirgi kun! «<b>${escapeHtml(hw.title)}</b>» vazifasini boshlagansiz — oxiriga yetkazib qo'ying 💪`
          : `⏰ Eslatma: «<b>${escapeHtml(hw.title)}</b>» vazifasining bugun oxirgi kuni. 5 daqiqa ajrating — o'yin qilib yodlaymiz 🎮`;
      void sendTelegramMessage(env.telegram.botToken, tgId, text, { text: '🎮 Boshlash', url: appLink });
      sent++;
    }
  }
  return sent;
}

export function startReminderJob() {
  const run = () =>
    sendDueReminders().catch((e) => console.warn('[reminder] xato:', (e as Error).message));
  setTimeout(run, 60_000);
  setInterval(run, CHECK_EVERY_MS);
}
