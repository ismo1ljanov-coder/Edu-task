import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { setupBot } from './services/bot.service';
import { ensureHomeworkColumns, startReminderJob } from './services/reminder.service';

const app = createApp();

// Yangi ustunlar bazada bo'lmasa, so'rovlar boshlanishidan oldin qo'shamiz
void ensureHomeworkColumns();

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.info(`EduTask API ${env.port}-portda ishga tushdi (${env.nodeEnv})`);
  // eslint-disable-next-line no-console
  console.info(`Swagger docs: http://localhost:${env.port}/api/docs`);
  void setupBot();
  startReminderJob();
});

async function shutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.info(`${signal} qabul qilindi, server yopilmoqda...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
