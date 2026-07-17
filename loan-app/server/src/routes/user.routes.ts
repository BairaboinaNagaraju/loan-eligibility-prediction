import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth';
import {
  getProfile, updateProfile, uploadAvatar, submitKYC,
  changePassword, getDashboardStats,
} from '../controllers/user.controller';
import { config } from '../config/env';

const router = Router();

const avatarStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.join(process.cwd(), config.UPLOAD_DIR, 'avatars')),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uuidv4()}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  },
});

router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/avatar', avatarUpload.single('avatar'), uploadAvatar);
router.post('/kyc', submitKYC);
router.put('/password', changePassword);
router.get('/dashboard-stats', getDashboardStats);

export default router;
