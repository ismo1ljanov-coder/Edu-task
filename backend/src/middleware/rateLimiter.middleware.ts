import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// General API limiter — protects every route from abuse/DoS.
export const apiLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "So'rovlar soni chegaradan oshdi. Birozdan so'ng qayta urinib ko'ring." },
});

// Stricter limiter specifically for the login endpoint to blunt brute-force
// password guessing against a phone number.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Ko'p marta urinildi. 15 daqiqadan so'ng qayta urinib ko'ring." },
});
