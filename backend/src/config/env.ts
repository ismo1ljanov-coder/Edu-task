import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: required('NODE_ENV', 'development'),
  port: parseInt(required('PORT', '4000'), 10),
  clientUrl: required('CLIENT_URL', 'http://localhost:5173'),

  databaseUrl: required('DATABASE_URL'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    accessExpiresIn: required('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    refreshExpiresIn: required('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  rateLimit: {
    windowMs: parseInt(required('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    max: parseInt(required('RATE_LIMIT_MAX', '200'), 10),
  },

  maxUploadMb: parseInt(required('MAX_UPLOAD_MB', '10'), 10),

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    botUsername: process.env.TELEGRAM_BOT_USERNAME ?? 'sozdon_bot',
    appShortName: process.env.TELEGRAM_APP_SHORT_NAME ?? 'app',
    superAdminIds: (process.env.SUPER_ADMIN_TELEGRAM_IDS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    // Username bo'yicha ham (masalan "ismo1ljanov", @ belgisiz) — Telegram imzolagan ma'lumot
    superAdminUsernames: (process.env.SUPER_ADMIN_TELEGRAM_USERNAMES ?? '')
      .split(',')
      .map((s) => s.trim().replace(/^@/, '').toLowerCase())
      .filter(Boolean),
  },

  sozdon: {
    url: (process.env.SOZDON_URL ?? 'https://sozdon.uz').replace(/\/+$/, ''),
    // EduTask → Sozdon havolasidagi imzo kaliti
    secret: process.env.SOZDON_SHARED_SECRET,
  },
};
