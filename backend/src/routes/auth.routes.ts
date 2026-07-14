import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { loginLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Telefon raqami va parol orqali tizimga kirish
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, password]
 *             properties:
 *               phone: { type: string, example: "+998901234567" }
 *               password: { type: string, example: "Password123!" }
 *     responses:
 *       200: { description: JWT access/refresh token va foydalanuvchi ma'lumoti }
 *       401: { description: Login yoki parol noto'g'ri }
 */
router.post(
  '/login',
  loginLimiter,
  validate([
    body('phone').isString().trim().notEmpty().withMessage('Telefon raqami majburiy'),
    body('password').isString().notEmpty().withMessage('Parol majburiy'),
  ]),
  authController.login,
);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Access tokenni refresh token orqali yangilash
 *     responses:
 *       200: { description: Yangi access token }
 */
router.post(
  '/refresh',
  validate([body('refreshToken').isString().notEmpty()]),
  authController.refresh,
);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Joriy autentifikatsiya qilingan foydalanuvchi ma'lumoti
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Foydalanuvchi profili }
 */
router.get('/me', authenticate, authController.me);

export default router;
