import { Router, Response } from 'express';
import { Role } from '@prisma/client';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import * as sozdon from '../services/sozdonIntegration.service';

// ---------------------------------------------------------------------------
// So'zdon integratsiyasi
//  - /api/sozdon/link            — o'quvchi vazifani Sozdon'da ochish havolasini oladi
//  - /api/sozdon/homework?t=...  — Sozdon serveri vazifa so'zlarini oladi (imzoli token)
//  - /api/sozdon/result          — Sozdon serveri natijani yuboradi (imzoli token)
// ---------------------------------------------------------------------------

const router = Router();

router.post(
  '/link',
  authenticate,
  requireRole(Role.STUDENT),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const homeworkId = String(req.body?.homeworkId ?? '');
    if (!homeworkId) throw ApiError.badRequest('homeworkId majburiy');
    sendSuccess(res, await sozdon.createSozdonLink(req.user!.id, homeworkId));
  }),
);

router.get(
  '/homework',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const token = String(req.query.t ?? '');
    if (!token) throw ApiError.badRequest('Token majburiy');
    sendSuccess(res, await sozdon.getHomeworkForSozdon(token));
  }),
);

router.post(
  '/result',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const token = String(req.body?.t ?? '');
    if (!token) throw ApiError.badRequest('Token majburiy');
    sendSuccess(res, await sozdon.saveSozdonResult(token, Number(req.body?.correct), Number(req.body?.total)));
  }),
);

export default router;
