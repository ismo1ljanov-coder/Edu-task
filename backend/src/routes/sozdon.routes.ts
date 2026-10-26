import { Router, Response } from 'express';
import { Role } from '@prisma/client';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { prisma } from '../config/prisma';
import * as sozdonService from '../services/sozdon.service';

// ---------------------------------------------------------------------------
// So'zdon integratsiyasi (sozdon-uzb bilan server-to-server).
//   POST /sozdon/start          — o'quvchi uchun bir martalik kirish havolasi
//   POST /sozdon/sync/:id       — o'qituvchi: guruh progressini So'zdon'dan yangilash
//   GET  /sozdon/progress       — o'quvchi: o'z progressini yangilash
// ---------------------------------------------------------------------------

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /sozdon/start:
 *   post:
 *     tags: [Sozdon]
 *     summary: "So'zdon'da vazifani bajarish uchun bir martalik havola (O'quvchi)"
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [homeworkId]
 *             properties:
 *               homeworkId: { type: string }
 *     responses:
 *       200: { description: "{ url } — 2 daqiqa amal qiladi" }
 */
router.post(
  '/start',
  requireRole(Role.STUDENT),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const homeworkId = String(req.body.homeworkId ?? '');
    if (!homeworkId) throw ApiError.badRequest('homeworkId kerak');

    const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
    if (!student) throw ApiError.forbidden("Faqat o'quvchilar uchun");
    const assigned = await prisma.homeworkResult.findUnique({
      where: { homeworkId_studentId: { homeworkId, studentId: student.id } },
    });
    if (!assigned) throw ApiError.forbidden('Bu vazifa sizga berilmagan');

    const url = await sozdonService.createLaunchUrl(homeworkId, req.user!.id);
    sendSuccess(res, { url });
  }),
);

/**
 * @openapi
 * /sozdon/sync/{homeworkId}:
 *   post:
 *     tags: [Sozdon]
 *     summary: "Vazifa progressini So'zdon'dan yangilash (O'qituvchi)"
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: homeworkId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: "Yangilangan o'quvchilar soni" }
 */
router.post(
  '/sync/:homeworkId',
  requireRole(Role.TEACHER),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const teacher = await prisma.teacher.findUnique({ where: { userId: req.user!.id } });
    const homework = await prisma.homework.findUnique({ where: { id: req.params.homeworkId } });
    if (!teacher || !homework || homework.teacherId !== teacher.id) {
      throw ApiError.notFound('Vazifa topilmadi');
    }
    const { synced } = await sozdonService.syncHomeworkProgress(homework.id);
    sendSuccess(res, { synced });
  }),
);

/**
 * @openapi
 * /sozdon/progress:
 *   get:
 *     tags: [Sozdon]
 *     summary: "O'quvchi progressini So'zdon'dan yangilash (O'quvchi)"
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: homeworkId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: "Yangilangan natija" }
 */
router.get(
  '/progress',
  requireRole(Role.STUDENT),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const homeworkId = String(req.query.homeworkId ?? '');
    if (!homeworkId) throw ApiError.badRequest('homeworkId kerak');
    const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
    if (!student) throw ApiError.forbidden("Faqat o'quvchilar uchun");
    const assigned = await prisma.homeworkResult.findUnique({
      where: { homeworkId_studentId: { homeworkId, studentId: student.id } },
    });
    if (!assigned) throw ApiError.forbidden('Bu vazifa sizga berilmagan');

    await sozdonService.syncHomeworkProgress(homeworkId);
    const result = await prisma.homeworkResult.findUnique({
      where: { homeworkId_studentId: { homeworkId, studentId: student.id } },
    });
    sendSuccess(res, {
      progress: result?.progress ?? 0,
      status: result?.status ?? 'NOT_STARTED',
      learned: result?.correctCount ?? 0,
      total: result?.totalCount ?? 0,
    });
  }),
);

export default router;
