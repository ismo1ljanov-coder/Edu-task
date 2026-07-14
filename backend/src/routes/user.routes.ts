import { Router } from 'express';
import { body } from 'express-validator';
import { Role } from '@prisma/client';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();
router.use(authenticate);

const personValidation = [
  body('fullName').isString().trim().isLength({ min: 2 }).withMessage("To'liq ism majburiy"),
  body('phone').isString().trim().notEmpty().withMessage('Telefon raqami majburiy'),
  body('password').isString().isLength({ min: 6 }).withMessage("Parol kamida 6 belgidan iborat bo'lsin"),
];

/**
 * @openapi
 * /users/branch-admins:
 *   post:
 *     tags: [Users]
 *     summary: Filialga Filial Admin tayinlash (Super Admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Yaratilgan Filial Admin }
 */
router.post(
  '/branch-admins',
  requireRole(Role.SUPER_ADMIN),
  validate([...personValidation, body('branchId').isString().notEmpty()]),
  userController.createBranchAdmin,
);

/**
 * @openapi
 * /users/teachers:
 *   post:
 *     tags: [Users]
 *     summary: Filialga o'qituvchi qo'shish (Filial Admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Yaratilgan o'qituvchi }
 *   get:
 *     tags: [Users]
 *     summary: Filial o'qituvchilari ro'yxati (Filial Admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: O'qituvchilar ro'yxati }
 */
router.post(
  '/teachers',
  requireRole(Role.BRANCH_ADMIN),
  validate(personValidation),
  userController.createTeacher,
);
router.get('/teachers', requireRole(Role.BRANCH_ADMIN), userController.listTeachers);

/**
 * @openapi
 * /users/teachers/{teacherUserId}/activity:
 *   get:
 *     tags: [Users]
 *     summary: O'qituvchi faoliyatini kuzatish (Filial Admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: O'qituvchining guruhlari va vazifalari }
 */
router.get(
  '/teachers/:teacherUserId/activity',
  requireRole(Role.BRANCH_ADMIN),
  userController.teacherActivity,
);

/**
 * @openapi
 * /users/students:
 *   post:
 *     tags: [Users]
 *     summary: Filialga o'quvchi qo'shish (Filial Admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Yaratilgan o'quvchi }
 *   get:
 *     tags: [Users]
 *     summary: Filial o'quvchilari ro'yxati (Filial Admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: O'quvchilar ro'yxati }
 */
router.post(
  '/students',
  requireRole(Role.BRANCH_ADMIN),
  validate([...personValidation, body('groupId').optional().isString()]),
  userController.createStudent,
);
router.get('/students', requireRole(Role.BRANCH_ADMIN), userController.listStudents);

/**
 * @openapi
 * /users/payments:
 *   post:
 *     tags: [Users]
 *     summary: O'quvchi to'lov holatini belgilash (Filial Admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Yangilangan to'lov yozuvi }
 */
router.post(
  '/payments',
  requireRole(Role.BRANCH_ADMIN),
  validate([
    body('studentId').isString().notEmpty(),
    body('month').isISO8601(),
    body('status').isIn(['PAID', 'UNPAID', 'OVERDUE']),
    body('amount').isFloat({ min: 0 }),
  ]),
  userController.setPayment,
);

export default router;
