import { NextFunction, Request, Response } from 'express';
import xss from 'xss';

// Recursively strips dangerous HTML/script content from every string field
// in the request body. Combined with Prisma's parameterized queries (which
// already neutralize SQL injection) and Helmet's CSP headers, this covers
// the app's main injection surfaces.
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return xss(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = sanitizeValue(val);
    }
    return result;
  }
  return value;
}

export function sanitizeBody(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
}
