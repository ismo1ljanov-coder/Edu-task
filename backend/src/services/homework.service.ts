import { HomeworkLevel } from '@prisma/client';
import * as XLSX from 'xlsx';
import { env } from '../config/env';
import { escapeHtml, sendTelegramMessage } from '../utils/telegram';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import {
  extractWordsFromFile,
  detectFileType,
  parseManualWords,
  ExtractedWord,
  HomeworkLanguage,
  HOMEWORK_LANGUAGES,
} from './wordExtractor.service';
import { lookupTranslations } from './sozdonIntegration.service';

interface CreateHomeworkInput {
  title: string;
  description?: string;
  level: HomeworkLevel;
  startDate: string;
  endDate: string;
  teacherId: string;
  groupId: string;
  language?: string; // en | ru | ar
  manualWords?: string; // qo'lda: vergul yoki har qatorda, "so'z - tarjima" ham mumkin
  file?: { buffer: Buffer; mimeType: string; originalName: string };
}

export async function createHomework(input: CreateHomeworkInput) {
  const group = await prisma.group.findUnique({ where: { id: input.groupId } });
  if (!group || group.teacherId !== input.teacherId) {
    throw ApiError.badRequest("Bu guruh sizga tegishli emas");
  }

  const language: HomeworkLanguage = HOMEWORK_LANGUAGES.includes(input.language as HomeworkLanguage)
    ? (input.language as HomeworkLanguage)
    : 'en';

  let extracted: ExtractedWord[] = [];
  let sourceFileName: string | undefined;
  let sourceFileType: string | undefined;

  if (input.file) {
    const fileType = detectFileType(input.file.mimeType, input.file.originalName);
    extracted = await extractWordsFromFile(input.file.buffer, fileType, language);
    sourceFileName = input.file.originalName;
    sourceFileType = fileType;
  }
  const manual = input.manualWords?.trim() ? parseManualWords(input.manualWords, language) : [];

  // Birlashtiramiz (qo'lda yozilgani ustun), takrorlarni olib tashlaymiz
  const merged = new Map<string, ExtractedWord>();
  for (const e of [...manual, ...extracted]) {
    const k = e.word.toLowerCase();
    const prev = merged.get(k);
    if (!prev) merged.set(k, { ...e });
    else if (!prev.translation && e.translation) prev.translation = e.translation;
  }
  const entries = [...merged.values()];
  if (!entries.length) throw ApiError.badRequest("Kamida bitta so'z kiriting yoki fayl yuklang");

  // Sozdon lug'ati: (1) tarjimasi yo'q so'zlarni to'ldiramiz; (2) inglizcha vazifada ustoz
  // "olma — apple" deb teskari yozgan bo'lsa, juftlikni to'g'rilaymiz.
  const swapCandidates =
    language === 'en'
      ? entries.filter((e) => e.translation && /^[A-Za-z][A-Za-z' -]{1,40}$/.test(e.translation)).map((e) => e.translation!.toLowerCase())
      : [];
  const found = await lookupTranslations(
    [...new Set([...entries.map((e) => e.word), ...swapCandidates])],
    language,
  );
  for (const e of entries) {
    const rev = e.translation?.toLowerCase();
    if (language === 'en' && rev && !found[e.word] && found[rev]) {
      e.translation = e.word; // o'zbekcha tomoni
      e.word = rev;
    }
    if (!e.translation && found[e.word]) e.translation = found[e.word];
  }
  const missingTranslations = entries.filter((e) => !e.translation).map((e) => e.word);

  const homework = await prisma.homework.create({
    data: {
      title: input.title,
      description: input.description,
      level: input.level,
      language,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      teacherId: input.teacherId,
      groupId: input.groupId,
      sourceFileName,
      sourceFileType: sourceFileType ?? (manual.length ? 'MANUAL' : undefined),
      words: {
        create: entries.map((e, index) => ({ word: e.word, translation: e.translation ?? null, order: index })),
      },
    },
    include: { words: true },
  });
  const allWords = entries;

  // Create a pending result row for every student in the group + notify them.
  const students = await prisma.student.findMany({ where: { groupId: input.groupId } });
  await prisma.homeworkResult.createMany({
    data: students.map((s) => ({
      homeworkId: homework.id,
      studentId: s.id,
      totalCount: allWords.length,
    })),
  });
  await prisma.notification.createMany({
    data: students.map((s) => ({
      userId: s.userId,
      type: 'HOMEWORK_ASSIGNED' as const,
      title: 'Yangi vazifa berildi',
      message: `"${homework.title}" nomli yangi uy vazifasi berildi`,
    })),
  });

  // Telegram orqali o'quvchilarga xabar (bot bilan yozishmasi bor bo'lsa yetib boradi)
  const recipients = await prisma.user.findMany({
    where: { id: { in: students.map((s) => s.userId) }, telegramId: { not: null } },
    select: { telegramId: true },
  });
  const appLink = `https://t.me/${env.telegram.botUsername}/${env.telegram.appShortName}`;
  for (const r of recipients) {
    void sendTelegramMessage(
      env.telegram.botToken,
      r.telegramId!,
      `📚 Yangi vazifa keldi!\n\n<b>${escapeHtml(homework.title)}</b> — ${allWords.length} ta so'z. Keling, o'yin qilib yodlaymiz 💪`,
      { text: '🎮 Boshlash', url: appLink },
    );
  }

  return { ...homework, missingTranslations };
}

export async function listHomeworksForTeacher(teacherId: string, page: number, limit: number, skip: number) {
  const where = { teacherId };
  const [items, total] = await Promise.all([
    prisma.homework.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        group: { select: { name: true } },
        _count: { select: { words: true, results: true } },
      },
    }),
    prisma.homework.count({ where }),
  ]);
  return { items, total, page, limit };
}

export async function getHomeworkStats(homeworkId: string, teacherId: string) {
  const homework = await prisma.homework.findUnique({
    where: { id: homeworkId },
    include: { results: true, words: true },
  });
  if (!homework || homework.teacherId !== teacherId) throw ApiError.notFound('Vazifa topilmadi');

  const total = homework.results.length;
  const notStarted = homework.results.filter((r) => r.status === 'NOT_STARTED').length;
  const inProgress = homework.results.filter((r) => r.status === 'IN_PROGRESS').length;
  const completed = homework.results.filter((r) => r.status === 'COMPLETED').length;
  const avgProgress = total
    ? Math.round(homework.results.reduce((acc, r) => acc + r.progress, 0) / total)
    : 0;

  return {
    homeworkId,
    title: homework.title,
    wordCount: homework.words.length,
    totalStudents: total,
    notStarted,
    inProgress,
    completed,
    averageProgressPercent: avgProgress,
  };
}

export async function listHomeworksForStudent(studentId: string) {
  return prisma.homeworkResult.findMany({
    where: { studentId },
    include: {
      homework: {
        select: {
          id: true,
          title: true,
          level: true,
          startDate: true,
          endDate: true,
          description: true,
          _count: { select: { words: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getStudentDashboardSummary(studentId: string) {
  const results = await prisma.homeworkResult.findMany({
    where: { studentId },
    include: { homework: { select: { startDate: true, endDate: true, title: true } } },
  });

  const now = new Date();
  const todayTasks = results.filter(
    (r) => r.homework.startDate <= now && r.homework.endDate >= now && r.status !== 'COMPLETED',
  );
  const notCompleted = results.filter((r) => r.status !== 'COMPLETED');
  const completed = results.filter((r) => r.status === 'COMPLETED');

  const student = await prisma.student.findUnique({ where: { id: studentId } });

  const avgProgress = results.length
    ? Math.round(results.reduce((acc, r) => acc + r.progress, 0) / results.length)
    : 0;

  return {
    todayTasksCount: todayTasks.length,
    notCompletedCount: notCompleted.length,
    completedCount: completed.length,
    xp: student?.xp ?? 0,
    streak: student?.streak ?? 0,
    progressPercent: avgProgress,
    totalHomeworkCount: results.length,
  };
}

const STATUS_UZ: Record<string, string> = {
  NOT_STARTED: 'Boshlamagan',
  IN_PROGRESS: 'Jarayonda',
  COMPLETED: 'Bajardi',
};

/** Ustoz uchun: vazifa bo'yicha har bir o'quvchining natijasi. */
export async function getHomeworkResults(homeworkId: string, teacherId: string) {
  const homework = await prisma.homework.findUnique({
    where: { id: homeworkId },
    include: {
      group: { select: { name: true } },
      words: { orderBy: { order: 'asc' }, select: { word: true, translation: true } },
      results: {
        include: { student: { include: { user: { select: { fullName: true, phone: true } } } } },
      },
    },
  });
  if (!homework || homework.teacherId !== teacherId) throw ApiError.notFound('Vazifa topilmadi');

  // Vazifadan keyin guruhga qo'shilgan o'quvchilar ham ro'yxatda ko'rinsin
  const known = new Set(homework.results.map((r) => r.studentId));
  const latecomers = await prisma.student.findMany({
    where: { groupId: homework.groupId, id: { notIn: [...known] } },
    include: { user: { select: { fullName: true, phone: true } } },
  });
  const allResults = [
    ...homework.results,
    ...latecomers.map((st) => ({
      studentId: st.id,
      student: st,
      status: 'NOT_STARTED' as const,
      progress: 0,
      correctCount: 0,
      totalCount: 0,
      completedAt: null as Date | null,
    })),
  ];

  const rows = allResults
    .map((r) => ({
      studentId: r.studentId,
      fullName: r.student.user.fullName,
      phone: r.student.user.phone,
      status: r.status,
      progress: r.progress,
      correctCount: r.correctCount,
      totalCount: r.totalCount,
      completedAt: r.completedAt,
    }))
    .sort((a, b) => b.progress - a.progress || a.fullName.localeCompare(b.fullName));

  return {
    id: homework.id,
    title: homework.title,
    groupName: homework.group.name,
    language: homework.language,
    startDate: homework.startDate,
    endDate: homework.endDate,
    wordCount: homework.words.length,
    wordsWithoutTranslation: homework.words.filter((w) => !w.translation).map((w) => w.word),
    completed: rows.filter((r) => r.status === 'COMPLETED').length,
    total: rows.length,
    rows,
  };
}

/** Ustoz uchun: natijalarni Excel (.xlsx) faylga. */
export async function exportHomeworkResults(homeworkId: string, teacherId: string) {
  const data = await getHomeworkResults(homeworkId, teacherId);
  const sheetRows = data.rows.map((r, i) => ({
    '№': i + 1,
    "O'quvchi": r.fullName,
    Telefon: /^tg[:_]/.test(r.phone) ? '' : r.phone,
    Holat: STATUS_UZ[r.status] ?? r.status,
    'Natija, %': r.progress,
    "To'g'ri javoblar": r.totalCount ? `${r.correctCount}/${r.totalCount}` : '',
    'Bajargan vaqti': r.completedAt ? new Date(r.completedAt).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' }) : '',
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sheetRows);
  ws['!cols'] = [{ wch: 4 }, { wch: 28 }, { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Natijalar');
  const words = XLSX.utils.json_to_sheet(
    (await prisma.homeworkWord.findMany({ where: { homeworkId }, orderBy: { order: 'asc' } })).map((w, i) => ({
      '№': i + 1,
      "So'z": w.word,
      Tarjima: w.translation ?? '',
    })),
  );
  XLSX.utils.book_append_sheet(wb, words, "So'zlar");
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  const safe = data.title.replace(/[^\p{L}\p{N} _-]+/gu, '').trim().slice(0, 60) || 'vazifa';
  return { buffer, filename: `${safe} - ${data.groupName}.xlsx` };
}
