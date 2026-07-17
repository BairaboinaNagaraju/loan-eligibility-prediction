import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

export const globalRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many authentication attempts, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const predictionRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { success: false, message: 'Too many prediction requests, please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});
