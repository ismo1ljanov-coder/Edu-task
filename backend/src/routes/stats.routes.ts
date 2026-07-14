import { Router } from 'express';
import { Role } from '@prisma/client';
import * as statsController from '../controllers/stats.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();
router.use(authenticate, requireRole(Role.SUPER_ADMIN));

/**
 * @openapi
 * /stats/platform:
 *   get:
 *     tags: [Stats]
 *     summary: Butun platforma bo'yicha statistika (Super Admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Platforma statistikasi }
 */
router.get('/platform', statsController.platformStats);

/**
 * @openapi
 * /stats/branches/export.pdf:
 *   get:
 *     tags: [Stats]
 *     summary: Filiallar hisobotini PDF sifatida eksport qilish (Super Admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: PDF fayl
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 */
router.get('/branches/export.pdf', statsController.exportBranchesPdf);

export default router;
