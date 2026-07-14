import { NextFunction, Response } from 'express';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from './auth.middleware';
import { ApiError } from '../utils/ApiError';

/**
 * Role Based Access Control guard.
 * Usage: router.get('/branches', authenticate, requireRole('SUPER_ADMIN'), handler)
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden("Ushbu amal uchun ruxsatingiz yo'q");
    }
    next();
  };
}

/**
 * Ensures a Branch Admin / Teacher / Student can only touch data that
 * belongs to their own branch. Super Admin bypasses this check.
 */
export function requireSameBranch(getBranchId: (req: AuthenticatedRequest) => string | undefined) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) throw ApiError.unauthorized();
    if (req.user.role === Role.SUPER_ADMIN) return next();

    const targetBranchId = getBranchId(req);
    if (!targetBranchId || targetBranchId !== req.user.branchId) {
      throw ApiError.forbidden("Boshqa filial ma'lumotlariga ruxsatingiz yo'q");
    }
    next();
  };
}
