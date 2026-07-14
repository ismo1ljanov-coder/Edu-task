import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Foydalanuvchi bildirishnomalari (bell icon uchun)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Bildirishnomalar ro'yxati va o'qilmaganlar soni }
 */
router.get('/', notificationController.list);

/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Bitta bildirishnomani o'qilgan deb belgilash
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.patch('/:id/read', notificationController.markRead);

/**
 * @openapi
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Barcha bildirishnomalarni o'qilgan deb belgilash
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.patch('/read-all', notificationController.markAllRead);

export default router;
