import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { sendSuccess } from '../utils/apiResponse';
import { Response } from 'express';

// ---------------------------------------------------------------------------
// So'zdon (Word-Box-Game) integration — MOCK ENDPOINTS ONLY.
// The real "So'zdon bilan bajarish" button on the student homework page calls
// these placeholders for now. Replace with real So'zdon API calls once that
// service is ready; the response shapes here are the intended contract.
// ---------------------------------------------------------------------------

const router = Router();
router.use(authenticate, requireRole(Role.STUDENT));

/**
 * @openapi
 * /sozdon/start:
 *   post:
 *     tags: [Sozdon]
 *     summary: "So'zdon o'yinini boshlash (mock)"
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               homeworkId: { type: string }
 *     responses:
 *       200: { description: "Mock session identifikatori qaytadi" }
 */
router.post(
  '/start',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    sendSuccess(res, {
      sessionId: `mock-session-${Date.now()}`,
      homeworkId: req.body.homeworkId ?? null,
      status: 'MOCK_STARTED',
      message: "So'zdon hali ulanmagan — bu placeholder javob",
    });
  }),
);

/**
 * @openapi
 * /sozdon/result:
 *   post:
 *     tags: [Sozdon]
 *     summary: "So'zdon o'yini natijasini yuborish (mock)"
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Mock natija qabul qilindi" }
 */
router.post(
  '/result',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    sendSuccess(res, {
      received: true,
      sessionId: req.body.sessionId ?? null,
      status: 'MOCK_RECEIVED',
      message: "Natija saqlandi (mock) — haqiqiy hisoblash keyinroq ulanadi",
    });
  }),
);

/**
 * @openapi
 * /sozdon/progress:
 *   get:
 *     tags: [Sozdon]
 *     summary: "So'zdon progressini olish (mock)"
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Mock progress qiymati" }
 */
router.get(
  '/progress',
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    sendSuccess(res, {
      progressPercent: 0,
      status: 'MOCK_NOT_CONNECTED',
      message: "So'zdon API hali ulanmagan",
    });
  }),
);

export default router;
