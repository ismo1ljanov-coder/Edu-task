import { Response } from 'express';
import * as authService from '../services/auth.service';
import { loginWithTelegram } from '../services/telegramAuth.service';
import { ApiError } from '../utils/ApiError';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const login = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { phone, password } = req.body;
  const result = await authService.loginWithPhone(phone, password);
  sendSuccess(res, result);
});

export const refresh = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshAccessToken(refreshToken);
  sendSuccess(res, result);
});

export const me = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.id);
  sendSuccess(res, user);
});

export const telegramLogin = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const initData = req.header('x-telegram-init-data');
  if (!initData) throw ApiError.badRequest("Telegram ma'lumotlari yo'q");
  const startParam = typeof req.body?.startParam === 'string' ? req.body.startParam : undefined;
  const result = await loginWithTelegram(initData, startParam);
  sendSuccess(res, result);
});
