import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

// Catches everything thrown (or passed to next()) anywhere in the request
// pipeline and turns it into a consistent JSON error shape. Never leaks
// stack traces or internal details in production.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ success: false, message: "Bu qiymat allaqachon mavjud" });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, message: "Yozuv topilmadi" });
      return;
    }
  }

  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ success: false, message: 'Kutilmagan server xatoligi yuz berdi' });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ success: false, message: `Route topilmadi: ${req.originalUrl}` });
}

// Wraps async route handlers so thrown errors/rejections reach errorHandler
// without needing try/catch in every controller.
export function asyncHandler<T extends (...args: any[]) => Promise<unknown>>(fn: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
