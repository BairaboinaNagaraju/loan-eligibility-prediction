import { Router } from 'express';
import { register, login, refreshToken, logout, getMe, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
