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
