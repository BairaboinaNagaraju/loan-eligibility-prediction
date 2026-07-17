import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import CryptoJS from 'crypto-js';
import { config } from '../config/env';

const encrypt = (text: string) => CryptoJS.AES.encrypt(text, config.ENCRYPTION_KEY).toString();
const decrypt = (cipher: string) => CryptoJS.AES.decrypt(cipher, config.ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, email: true, fullName: true, phone: true, role: true,
      avatar: true, isEmailVerified: true, isPhoneVerified: true,
      kycStatus: true, lastLogin: true, createdAt: true, updatedAt: true,
      kyc: {
        select: {
          id: true, dob: true, gender: true, address: true, city: true,
          state: true, pincode: true, country: true,
          aadhaar: true, pan: true,
        },
      },
    },
  });

  if (!user) throw new AppError('User not found', 404);

  // Mask sensitive fields
  const result = {
    ...user,
    kyc: user.kyc ? {
      ...user.kyc,
      aadhaar: user.kyc.aadhaar ? `XXXX XXXX ${decrypt(user.kyc.aadhaar).slice(-4)}` : null,
      pan: user.kyc.pan ? `XXXXX${decrypt(user.kyc.pan).slice(-4)}` : null,
    } : null,
  };

  res.json({ success: true, data: { user: result } });
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { fullName, phone } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { fullName, phone },
    select: { id: true, email: true, fullName: true, phone: true, role: true, avatar: true, updatedAt: true },
  });

  res.json({ success: true, message: 'Profile updated', data: { user } });
};

export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) throw new AppError('No image file uploaded', 400);

  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  await prisma.user.update({ where: { id: req.user!.id }, data: { avatar: avatarUrl } });

  res.json({ success: true, message: 'Avatar updated', data: { avatarUrl } });
};

export const submitKYC = async (req: AuthRequest, res: Response): Promise<void> => {
  const { aadhaar, pan, dob, gender, address, city, state, pincode } = req.body;

  const kycData: any = {
    gender, address, city, state, pincode,
    dob: dob ? new Date(dob) : undefined,
  };

  if (aadhaar) kycData.aadhaar = encrypt(aadhaar);
  if (pan) kycData.pan = encrypt(pan);

  await prisma.kYCData.upsert({
    where: { userId: req.user!.id },
    create: { userId: req.user!.id, ...kycData },
    update: kycData,
  });

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { kycStatus: 'SUBMITTED' },
  });

  res.json({ success: true, message: 'KYC information submitted for verification' });
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw new AppError('User not found', 404);

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) throw new AppError('Current password is incorrect', 400);

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: req.user!.id }, data: { password: hashed, refreshToken: null } });

  res.json({ success: true, message: 'Password changed successfully. Please login again.' });
};

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const [totalApps, approved, rejected, pending, latestPrediction] = await Promise.all([
    prisma.loanApplication.count({ where: { userId } }),
    prisma.loanApplication.count({ where: { userId, status: 'APPROVED' } }),
    prisma.loanApplication.count({ where: { userId, status: 'REJECTED' } }),
    prisma.loanApplication.count({ where: { userId, status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
    prisma.prediction.findFirst({
      where: { application: { userId } },
      orderBy: { createdAt: 'desc' },
      include: { application: { select: { loanAmount: true, loanPurpose: true, submittedAt: true } } },
    }),
  ]);

  res.json({
    success: true,
    data: {
      stats: { totalApps, approved, rejected, pending },
      latestPrediction,
    },
  });
};
