import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', unreadOnly } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = { userId: req.user!.id };
  if (unreadOnly === 'true') where.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: req.user!.id, isRead: false } }),
  ]);

  res.json({
    success: true,
    data: {
      notifications,
      unreadCount,
      pagination: { page: parseInt(page as string), total, pages: Math.ceil(total / parseInt(limit as string)) },
    },
  });
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  if (id === 'all') {
    await prisma.notification.updateMany({ where: { userId: req.user!.id }, data: { isRead: true } });
  } else {
    await prisma.notification.updateMany({ where: { id, userId: req.user!.id }, data: { isRead: true } });
  }

  res.json({ success: true, message: 'Notifications marked as read' });
};

export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.notification.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
  res.json({ success: true, message: 'Notification deleted' });
};
