import { Response } from 'express';
import * as homeworkService from '../services/homework.service';
import { sendCreated, sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

async function resolveTeacherId(userId: string): Promise<string> {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) throw ApiError.forbidden("Faqat o'qituvchilar vazifa yarata oladi");
  return teacher.id;
}

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const teacherId = await resolveTeacherId(req.user!.id);
  const file = (req as any).file as
    | { buffer: Buffer; mimetype: string; originalname: string }
    | undefined;

  const homework = await homeworkService.createHomework({
    title: req.body.title,
    description: req.body.description,
    level: req.body.level,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    teacherId,
    groupId: req.body.groupId,
    language: req.body.language,
    manualWords: req.body.manualWords ? String(req.body.manualWords) : undefined,
    file: file
      ? { buffer: file.buffer, mimeType: file.mimetype, originalName: file.originalname }
      : undefined,
  });

  sendCreated(res, homework);
});

export const listForTeacher = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const teacherId = await resolveTeacherId(req.user!.id);
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const skip = (page - 1) * limit;
  const result = await homeworkService.listHomeworksForTeacher(teacherId, page, limit, skip);
  sendSuccess(res, result.items, 200, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
  });
});

export const stats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const teacherId = await resolveTeacherId(req.user!.id);
  const result = await homeworkService.getHomeworkStats(req.params.id, teacherId);
  sendSuccess(res, result);
});

export const listForStudent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
  if (!student) throw ApiError.forbidden("Faqat o'quvchilar uchun");
  const result = await homeworkService.listHomeworksForStudent(student.id);
  sendSuccess(res, result);
});

export const studentDashboard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
  if (!student) throw ApiError.forbidden("Faqat o'quvchilar uchun");
  const summary = await homeworkService.getStudentDashboardSummary(student.id);
  sendSuccess(res, summary);
});

export const results = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const teacherId = await resolveTeacherId(req.user!.id);
  sendSuccess(res, await homeworkService.getHomeworkResults(String(req.params.id), teacherId));
});

export const exportResults = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const teacherId = await resolveTeacherId(req.user!.id);
  const { buffer, filename } = await homeworkService.exportHomeworkResults(String(req.params.id), teacherId);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
  res.send(buffer);
});
