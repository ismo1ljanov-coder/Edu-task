import { Response } from 'express';
import * as userService from '../services/user.service';
import { sendCreated, sendSuccess, parsePagination } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ApiError } from '../utils/ApiError';

export const createBranchAdmin = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const admin = await userService.createBranchAdmin(req.body);
  sendCreated(res, admin);
});

export const createTeacher = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const branchId = req.user!.branchId;
  if (!branchId) throw ApiError.badRequest("Filial admin uchun branchId aniqlanmagan");
  const teacher = await userService.createTeacher({ ...req.body, branchId });
  sendCreated(res, teacher);
});

export const createStudent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const branchId = req.user!.branchId;
  if (!branchId) throw ApiError.badRequest("Filial admin uchun branchId aniqlanmagan");
  const student = await userService.createStudent({ ...req.body, branchId });
  sendCreated(res, student);
});

export const listTeachers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const branchId = req.user!.branchId!;
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
  const { items, pagination } = await userService.listTeachers(branchId, page, limit, skip);
  sendSuccess(res, items, 200, pagination);
});

export const listStudents = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const branchId = req.user!.branchId!;
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
  const { items, pagination } = await userService.listStudents(branchId, page, limit, skip);
  sendSuccess(res, items, 200, pagination);
});

export const setPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { studentId, month, status, amount } = req.body;
  const payment = await userService.setPaymentStatus(studentId, new Date(month), status, amount);
  sendSuccess(res, payment);
});

export const teacherActivity = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await userService.getTeacherActivity(req.params.teacherUserId);
  sendSuccess(res, result);
});
