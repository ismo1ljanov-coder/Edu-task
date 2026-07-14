import { NextFunction, Request, Response } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ApiError } from '../utils/ApiError';

/**
 * Runs an array of express-validator chains, then rejects with 400 + details
 * if any failed. Use as the last middleware before the controller:
 *   router.post('/x', validate([body('name').notEmpty()]), controller)
 */
export function validate(validations: ValidationChain[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map((v) => v.run(req)));

    const result = validationResult(req);
    if (result.isEmpty()) {
      next();
      return;
    }

    throw ApiError.badRequest(
      "Kiritilgan ma'lumotlarda xatolik bor",
      result.array().map((e) => ({ field: 'path' in e ? e.path : undefined, message: e.msg })),
    );
  };
}
