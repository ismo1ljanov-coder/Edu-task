import { HomeworkLevel } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { extractWordsFromFile, detectFileType } from './wordExtractor.service';

interface CreateHomeworkInput {
  title: string;
  description?: string;
  level: HomeworkLevel;
  startDate: string;
  endDate: string;
  teacherId: string;
  groupId: string;
  manualWords?: string[]; // words typed in by hand
  file?: { buffer: Buffer; mimeType: string; originalName: string };
}

export async function createHomework(input: CreateHomeworkInput) {
  const group = await prisma.group.findUnique({ where: { id: input.groupId } });
  if (!group || group.teacherId !== input.teacherId) {
    throw ApiError.badRequest("Bu guruh sizga tegishli emas");
  }

  let extractedWords: string[] = [];
  let sourceFileName: string | undefined;
  let sourceFileType: string | undefined;

  if (input.file) {
    const fileType = detectFileType(input.file.mimeType, input.file.originalName);
    extractedWords = await extractWordsFromFile(input.file.buffer, fileType);
    sourceFileName = input.file.originalName;
    sourceFileType = fileType;
  }

  const allWords = [...new Set([...(input.manualWords ?? []), ...extractedWords])];

  const homework = await prisma.homework.create({
    data: {
      title: input.title,
      description: input.description,
      level: input.level,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      teacherId: input.teacherId,
      groupId: input.groupId,
      sourceFileName,
      sourceFileType: sourceFileType ?? (input.manualWords?.length ? 'MANUAL' : undefined),
      words: {
        create: allWords.map((word, index) => ({ word, order: index })),
      },
    },
    include: { words: true },
  });

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

  return homework;
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
