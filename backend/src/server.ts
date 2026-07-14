import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

const app = createApp();

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.info(`EduTask API ${env.port}-portda ishga tushdi (${env.nodeEnv})`);
  // eslint-disable-next-line no-console
  console.info(`Swagger docs: http://localhost:${env.port}/api/docs`);
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
