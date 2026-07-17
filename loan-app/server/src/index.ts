import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import { config } from './config/env';
import { logger } from './config/logger';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler';
import { globalRateLimiter } from './middleware/rateLimiter';
import { prisma } from './config/database';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import loanRoutes from './routes/loan.routes';
import aiRoutes from './routes/ai.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes';
import documentRoutes from './routes/document.routes';

const app = express();
const httpServer = createServer(app);

// Socket.IO for real-time notifications
const io = new SocketServer(httpServer, {
  cors: {
    origin: config.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible via app
app.set('io', io);

// ─── Security Middleware ─────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ─── Core Middleware ─────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));

// ─── Rate Limiting ────────────────────────────────────────────────────────
app.use('/api/', globalRateLimiter);

// ─── Static Files (uploads) ───────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), config.UPLOAD_DIR)));

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/documents', documentRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ─── Socket.IO ────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join-room', (userId: string) => {
    socket.join(`user-${userId}`);
    logger.info(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────
const start = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');

    httpServer.listen(config.PORT, () => {
      logger.info(`🚀 Server running on port ${config.PORT} [${config.NODE_ENV}]`);
      logger.info(`📚 API: http://localhost:${config.PORT}/api`);
      logger.info(`❤️  Health: http://localhost:${config.PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

start();

export { io };
