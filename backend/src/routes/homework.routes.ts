import { Router } from 'express';
import multer from 'multer';
import { body } from 'express-validator';
import { Role } from '@prisma/client';
import * as homeworkController from '../controllers/homework.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { env } from '../config/env';

const router = Router();
router.use(authenticate);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

/**
 * @openapi
 * /homework:
 *   post:
 *     tags: [Homework]
 *     summary: Yangi uy vazifasi yaratish (O'qituvchi). PDF/DOCX/XLSX yuklansa, inglizcha so'zlar avtomatik ajratiladi.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               level: { type: string, enum: [BEGINNER, ELEMENTARY, INTERMEDIATE, UPPER_INTERMEDIATE, ADVANCED] }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *               groupId: { type: string }
 *               manualWords: { type: string, description: "vergul bilan ajratilgan so'zlar" }
 *               file: { type: string, format: binary }
 *     responses:
 *       201: { description: Yaratilgan uy vazifasi va so'zlar ro'yxati }
 *   get:
 *     tags: [Homework]
 *     summary: O'qituvchining vazifalari ro'yxati
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Vazifalar ro'yxati }
 */
router.post(
  '/',
  requireRole(Role.TEACHER),
  upload.single('file'),
  validate([
    body('title').isString().trim().isLength({ min: 2 }),
    body('level').isIn(['BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'UPPER_INTERMEDIATE', 'ADVANCED']),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('groupId').isString().notEmpty(),
  ]),
  homeworkController.create,
);
router.get('/', requireRole(Role.TEACHER), homeworkController.listForTeacher);

/**
 * @openapi
 * /homework/{id}/stats:
 *   get:
 *     tags: [Homework]
 *     summary: Vazifa statistikasi — boshlamagan/boshlagan/tugatgan, progress %
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Vazifa statistikasi }
 */
router.get('/:id/stats', requireRole(Role.TEACHER), homeworkController.stats);

/**
 * @openapi
 * /homework/student/dashboard:
 *   get:
 *     tags: [Homework]
 *     summary: O'quvchi dashboard xulosasi (bugungi/tugallanmagan/tugatilgan, XP, streak, progress)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Dashboard xulosasi }
 */
router.get('/student/dashboard', requireRole(Role.STUDENT), homeworkController.studentDashboard);

/**
 * @openapi
 * /homework/student/list:
 *   get:
 *     tags: [Homework]
 *     summary: O'quvchiga tayinlangan uy vazifalari ro'yxati
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Vazifalar ro'yxati }
 */
router.get('/student/list', requireRole(Role.STUDENT), homeworkController.listForStudent);

export default router;
