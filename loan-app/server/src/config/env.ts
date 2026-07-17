import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  DATABASE_URL: requireEnv('DATABASE_URL', 'postgresql://loanuser:loanpassword@localhost:5432/loandb'),
  JWT_SECRET: requireEnv('JWT_SECRET', 'dev-jwt-secret-change-in-production-32chars'),
  JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-in-production-32chars'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8001',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
  ENCRYPTION_KEY: requireEnv('ENCRYPTION_KEY', 'dev-encryption-key-32-chars-here!!'),
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'Vertex Loan AI <noreply@vertexloan.com>',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
} as const;
