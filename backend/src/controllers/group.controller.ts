import { Response } from 'express';
import * as groupService from '../services/group.service';
import { sendCreated, sendSuccess, parsePagination } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const branchId = req.user!.branchId!;
  const group = await groupService.createGroup({ ...req.body, branchId });
  sendCreated(res, group);
});

export const update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const branchId = req.user!.branchId!;
  const group = await groupService.updateGroup(req.params.id, branchId, req.body);
  sendSuccess(res, group);
});

export const list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);

  if (req.user!.role === Role.TEACHER) {
    const teacher = await import('../config/prisma').then((m) =>
      m.prisma.teacher.findUnique({ where: { userId: req.user!.id } }),
    );
    const items = teacher ? await groupService.listGroupsForTeacher(teacher.id) : [];
    sendSuccess(res, items);
    return;
  }

  const branchId = req.user!.branchId!;
  const { items, pagination } = await groupService.listGroups(branchId, page, limit, skip);
  sendSuccess(res, items, 200, pagination);
});

export const addStudent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const branchId = req.user!.branchId!;
  const { studentId } = req.body;
  const student = await groupService.addStudentToGroup(req.params.id, studentId, branchId);
  sendSuccess(res, student);
});
