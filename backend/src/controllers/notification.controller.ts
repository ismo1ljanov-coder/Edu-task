import { Response } from 'express';
import * as notificationService from '../services/notification.service';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const skip = (page - 1) * limit;
  const result = await notificationService.listNotifications(req.user!.id, page, limit, skip);
  sendSuccess(res, { items: result.items, unreadCount: result.unreadCount }, 200, {
    page,
    limit,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / limit)),
  });
});

export const markRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await notificationService.markAsRead(req.params.id, req.user!.id);
  sendSuccess(res, { ok: true });
});

export const markAllRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await notificationService.markAllAsRead(req.user!.id);
  sendSuccess(res, { ok: true });
});
