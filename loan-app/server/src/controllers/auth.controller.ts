import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { config } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../config/logger';

const generateTokens = (userId: string, email: string, role: string) => {
  const accessToken = jwt.sign(
    { id: userId, email, role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN as any }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES_IN as any }
  );
  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, fullName, phone } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('Email already registered', 409);

  const hashedPassword = await bcrypt.hash(password, 12);
  const emailVerifyToken = uuidv4();

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName,
      phone,
      emailVerifyToken,
      kyc: { create: {} },
    },
    select: { id: true, email: true, fullName: true, role: true, kycStatus: true, createdAt: true },
  });

  const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  logger.info(`New user registered: ${email}`);

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please verify your email.',
    data: { user, accessToken, refreshToken },
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email, isActive: true },
    select: { id: true, email: true, password: true, fullName: true, role: true, kycStatus: true, isEmailVerified: true, avatar: true },
  });

  if (!user) throw new AppError('Invalid credentials', 401);

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new AppError('Invalid credentials', 401);

  const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken, lastLogin: new Date() },
  });

  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    message: 'Login successful',
    data: { user: userWithoutPassword, accessToken, refreshToken },
  });
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken: token } = req.body;
  if (!token) throw new AppError('Refresh token required', 400);

  try {
    const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET) as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id, refreshToken: token, isActive: true },
      select: { id: true, email: true, role: true },
    });

    if (!user) throw new AppError('Invalid refresh token', 401);

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.email, user.role);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } });

    res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user) {
    await prisma.user.update({ where: { id: req.user.id }, data: { refreshToken: null } });
  }
  res.json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, email: true, fullName: true, phone: true, role: true,
      avatar: true, isEmailVerified: true, isPhoneVerified: true,
      kycStatus: true, lastLogin: true, createdAt: true,
      kyc: true,
    },
  });
  res.json({ success: true, data: { user } });
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond with success for security (prevent email enumeration)
  if (!user) {
    res.json({ success: true, message: 'If this email exists, a reset link will be sent.' });
    return;
  }

  const resetToken = uuidv4();
  const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: resetToken, passwordResetExpiry: resetExpiry },
  });

  res.json({ success: true, message: 'Password reset instructions sent to your email.' });
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: { gt: new Date() },
    },
  });

  if (!user) throw new AppError('Invalid or expired reset token', 400);

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      passwordResetToken: null,
      passwordResetExpiry: null,
      refreshToken: null,
    },
  });

  res.json({ success: true, message: 'Password updated successfully' });
};
