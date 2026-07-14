import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { apiLimiter } from './middleware/rateLimiter.middleware';
import { sanitizeBody } from './middleware/sanitize.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

import authRoutes from './routes/auth.routes';
import branchRoutes from './routes/branch.routes';
import userRoutes from './routes/user.routes';
import groupRoutes from './routes/group.routes';
import homeworkRoutes from './routes/homework.routes';
import sozdonRoutes from './routes/sozdon.routes';
import notificationRoutes from './routes/notification.routes';
import statsRoutes from './routes/stats.routes';

export function createApp(): Express {
  const app = express();

  // --- Security & platform middleware ---------------------------------------
  app.use(helmet());
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    }),
  );
  app.use(hpp()); // guards against HTTP Parameter Pollution
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(sanitizeBody); // XSS sanitation on every request body
  app.use('/api', apiLimiter); // rate limiting on all API routes

  // --- API docs ---------------------------------------------------------------
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // --- Health check -------------------------------------------------------------
  app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok' }));

  // --- Feature routes -----------------------------------------------------------
  app.use('/api/auth', authRoutes);
  app.use('/api/branches', branchRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/groups', groupRoutes);
  app.use('/api/homework', homeworkRoutes);
  app.use('/api/sozdon', sozdonRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/stats', statsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
