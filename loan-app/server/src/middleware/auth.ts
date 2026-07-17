import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { prisma } from '../config/database';
import { AppError } from './errorHandler';
export type Role = 'CUSTOMER' | 'LOAN_OFFICER' | 'ADMIN';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    fullName: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Access token required', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      id: string;
      email: string;
      role: Role;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id, isActive: true },
      select: { id: true, email: true, role: true, fullName: true, isActive: true },
    });

    if (!user) throw new AppError('User not found or deactivated', 401);

    req.user = { id: user.id, email: user.email, role: user.role as Role, fullName: user.fullName };
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError('Invalid or expired token', 401));
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403);
    }
    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { id: string; email: string; role: Role };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id, isActive: true },
      select: { id: true, email: true, role: true, fullName: true },
    });
    if (user) req.user = { id: user.id, email: user.email, role: user.role as Role, fullName: user.fullName };
  } catch {}
  next();
};
