import { Response } from 'express';
import * as authService from '../services/auth.service';
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
