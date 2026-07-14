import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: Role;
    branchId: string | null;
  };
}

/**
 * Verifies the Bearer access token and attaches the decoded identity to
 * req.user. Every protected route sits behind this middleware.
 */
export function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized("Token taqdim etilmagan");
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, branchId: payload.branchId };
    next();
  } catch {
    throw ApiError.unauthorized("Token yaroqsiz yoki muddati o'tgan");
  }
}
