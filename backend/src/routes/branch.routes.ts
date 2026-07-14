import { Router } from 'express';
import { body } from 'express-validator';
import { Role } from '@prisma/client';
import * as branchController from '../controllers/branch.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.use(authenticate, requireRole(Role.SUPER_ADMIN));

/**
 * @openapi
 * /branches:
 *   get:
 *     tags: [Branches]
 *     summary: Barcha filiallar ro'yxati (Super Admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Filiallar ro'yxati }
 *   post:
 *     tags: [Branches]
 *     summary: Yangi filial yaratish (Super Admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Yaratilgan filial }
 */
router.get('/', branchController.list);
router.post(
  '/',
  validate([
    body('name').isString().trim().isLength({ min: 2 }).withMessage('Filial nomi majburiy'),
    body('address').optional().isString(),
    body('phone').optional().isString(),
  ]),
  branchController.create,
);

/**
 * @openapi
 * /branches/{id}:
 *   patch:
 *     tags: [Branches]
 *     summary: Filialni tahrirlash (Super Admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Yangilangan filial }
 */
router.patch('/:id', branchController.update);

/**
 * @openapi
 * /branches/{id}/stats:
 *   get:
 *     tags: [Branches]
 *     summary: Filial bo'yicha statistika (faol foydalanuvchilar, to'lov holati)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Filial statistikasi }
 */
router.get('/:id/stats', branchController.stats);

export default router;
