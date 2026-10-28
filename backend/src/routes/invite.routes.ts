import { Router, Response } from 'express';
import { Role } from '@prisma/client';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { createInvite } from '../services/invite.service';

const router = Router();
router.use(authenticate, requireRole(Role.SUPER_ADMIN, Role.BRANCH_ADMIN, Role.TEACHER));

// POST /api/invites  { role: 'BRANCH_ADMIN'|'TEACHER'|'STUDENT', branchId?, groupId? }
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const role = String(req.body?.role ?? '') as Role;
    if (![Role.BRANCH_ADMIN, Role.TEACHER, Role.STUDENT].includes(role as 'BRANCH_ADMIN')) {
      throw ApiError.badRequest("Rol noto'g'ri");
    }
    const result = await createInvite(req.user!, {
      role,
      branchId: req.body?.branchId ? String(req.body.branchId) : undefined,
      groupId: req.body?.groupId ? String(req.body.groupId) : undefined,
    });
    sendSuccess(res, result);
  }),
);

export default router;
