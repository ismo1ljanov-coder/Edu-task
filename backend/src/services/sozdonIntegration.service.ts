import jwt from 'jsonwebtoken';
import { HomeworkResultStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { escapeHtml, sendTelegramMessage } from '../utils/telegram';

interface SozdonTokenPayload {
  sid: string; // studentId
  hw: string; // homeworkId
}

function secret() {
  const s = env.sozdon.secret || env.jwt.accessSecret;
  return `${s}:sozdon`;
}

function verifyToken(token: string): SozdonTokenPayload {
  try {
    return jwt.verify(token, secret()) as SozdonTokenPayload;
  } catch {
    throw ApiError.unauthorized("Havola eskirgan. EduTask'dan qaytadan oching.");
  }
}

/** O'quvchi uchun Sozdon'da vazifani ochadigan imzolangan havola (2 soat amal qiladi). */
export async function createSozdonLink(userId: string, homeworkId: string) {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) throw ApiError.forbidden("Faqat o'quvchilar uchun");
  const homework = await prisma.homework.findUnique({ where: { id: homeworkId } });
  if (!homework || homework.groupId !== student.groupId) {
    throw ApiError.notFound('Vazifa topilmadi');
  }
  const token = jwt.sign({ sid: student.id, hw: homework.id }, secret(), { expiresIn: '2h' });

  await prisma.homeworkResult.upsert({
    where: { homeworkId_studentId: { homeworkId: homework.id, studentId: student.id } },
    update: { startedAt: new Date() },
    create: {
      homeworkId: homework.id,
      studentId: student.id,
      status: HomeworkResultStatus.IN_PROGRESS,
      startedAt: new Date(),
    },
  });

  return { url: `${env.sozdon.url}/edutask?t=${encodeURIComponent(token)}` };
}

/** Sozdon serveri vazifa so'zlarini oladi. */
export async function getHomeworkForSozdon(token: string) {
  const { sid, hw } = verifyToken(token);
  const homework = await prisma.homework.findUnique({
    where: { id: hw },
    include: { words: { orderBy: { order: 'asc' } } },
  });
  const student = await prisma.student.findUnique({ where: { id: sid }, include: { user: true } });
  if (!homework || !student) throw ApiError.notFound('Vazifa topilmadi');

  const result = await prisma.homeworkResult.findUnique({
    where: { homeworkId_studentId: { homeworkId: hw, studentId: sid } },
  });

  return {
    homeworkId: homework.id,
    title: homework.title,
    level: homework.level,
    studentName: student.user.fullName,
    bestProgress: result?.progress ?? 0,
    returnUrl: env.clientUrl,
    words: homework.words.map((w) => ({ word: w.word, translation: w.translation })),
  };
}

/** Sozdon serveri o'yin natijasini yuboradi — eng yaxshi natija saqlanadi. */
export async function saveSozdonResult(token: string, correct: number, total: number) {
  const { sid, hw } = verifyToken(token);
  if (!Number.isInteger(correct) || !Number.isInteger(total) || total < 1 || total > 500 || correct < 0 || correct > total) {
    throw ApiError.badRequest("Natija noto'g'ri");
  }
  const progress = Math.round((correct / total) * 100);
  const key = { homeworkId_studentId: { homeworkId: hw, studentId: sid } };
  const prev = await prisma.homeworkResult.findUnique({ where: key });
  const isBetter = !prev || progress >= prev.progress;
  const firstCompletion = !prev || prev.status !== HomeworkResultStatus.COMPLETED;

  const saved = await prisma.homeworkResult.upsert({
    where: key,
    create: {
      homeworkId: hw,
      studentId: sid,
      status: HomeworkResultStatus.COMPLETED,
      progress,
      correctCount: correct,
      totalCount: total,
      startedAt: new Date(),
      completedAt: new Date(),
    },
    update: isBetter
      ? {
          status: HomeworkResultStatus.COMPLETED,
          progress,
          correctCount: correct,
          totalCount: total,
          completedAt: new Date(),
        }
      : { status: HomeworkResultStatus.COMPLETED },
  });

  if (firstCompletion) {
    const homework = await prisma.homework.findUnique({
      where: { id: hw },
      include: { teacher: { include: { user: true } } },
    });
    const student = await prisma.student.findUnique({ where: { id: sid }, include: { user: true } });
    if (homework && student) {
      await prisma.student.update({ where: { id: sid }, data: { xp: { increment: correct } } });
      await prisma.notification.create({
        data: {
          userId: homework.teacher.userId,
          type: 'HOMEWORK_COMPLETED',
          title: 'Vazifa bajarildi',
          message: `${student.user.fullName} "${homework.title}" vazifasini bajardi: ${correct}/${total}`,
        },
      });
      if (homework.teacher.user.telegramId) {
        await sendTelegramMessage(
          env.telegram.botToken,
          homework.teacher.user.telegramId,
          `${correct / total >= 0.8 ? '🌟' : '✅'} <b>${escapeHtml(student.user.fullName)}</b> «${escapeHtml(homework.title)}» vazifasini tugatdi — <b>${correct}/${total}</b>${correct === total ? '. Hammasi to\'g\'ri, qoyil! 🎉' : ''}`,
        );
      }
    }
  }

  return { progress: saved.progress, correct: saved.correctCount, total: saved.totalCount };
}
