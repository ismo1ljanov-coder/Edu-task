import { Response } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { Router } from 'express';
import { body } from 'express-validator';
import { Role } from '@prisma/client';
import * as groupController from '../controllers/group.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /groups:
 *   get:
 *     tags: [Groups]
 *     summary: Guruhlar ro'yxati (Filial Admin — filial bo'yicha, O'qituvchi — o'ziniki)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Guruhlar ro'yxati }
 *   post:
 *     tags: [Groups]
 *     summary: Yangi guruh yaratish (Filial Admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Yaratilgan guruh }
 */
router.get('/', requireRole(Role.BRANCH_ADMIN, Role.TEACHER), groupController.list);
// Ustoz o'zi uchun guruh ochadi (markaz admini kutilmaydi)
router.post(
  '/mine',
  requireRole(Role.TEACHER),
  validate([body('name').isString().trim().isLength({ min: 2, max: 80 })]),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const teacher = await prisma.teacher.findUnique({ where: { userId: req.user!.id } });
    if (!teacher) throw ApiError.forbidden("Ustoz profili topilmadi");
    const group = await prisma.group.create({
      data: { name: String(req.body.name).trim(), branchId: teacher.branchId, teacherId: teacher.id },
    });
    sendSuccess(res, group);
  }),
);

router.post(
  '/',
  requireRole(Role.BRANCH_ADMIN),
  validate([
    body('name').isString().trim().isLength({ min: 2 }),
    body('teacherId').isString().notEmpty(),
  ]),
  groupController.create,
);

/**
 * @openapi
 * /groups/{id}:
 *   patch:
 *     tags: [Groups]
 *     summary: Guruhni boshqarish/tahrirlash (Filial Admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Yangilangan guruh }
 */
router.patch('/:id', requireRole(Role.BRANCH_ADMIN), groupController.update);

/**
 * @openapi
 * /groups/{id}/students:
 *   post:
 *     tags: [Groups]
 *     summary: Guruhga o'quvchi qo'shish (Filial Admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Guruhga qo'shilgan o'quvchi }
 */
router.post(
  '/:id/students',
  requireRole(Role.BRANCH_ADMIN),
  validate([body('studentId').isString().notEmpty()]),
  groupController.addStudent,
);

export default router;
