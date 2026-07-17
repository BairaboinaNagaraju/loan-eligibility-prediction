import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', search, role } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {};
  if (search) {
    where.OR = [
      { fullName: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
      { phone: { contains: search as string } },
    ];
  }
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, fullName: true, phone: true, role: true,
        avatar: true, kycStatus: true, isEmailVerified: true, isActive: true,
        lastLogin: true, createdAt: true,
        _count: { select: { applications: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total, pages: Math.ceil(total / parseInt(limit as string)) },
    },
  });
};

export const getAllApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', status, search, riskLevel } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {};
  if (status) where.status = status;
  if (riskLevel) where.riskLevel = riskLevel;
  if (search) {
    where.OR = [
      { fullName: { contains: search as string, mode: 'insensitive' } },
      { loanPurpose: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const [applications, total] = await Promise.all([
    prisma.loanApplication.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy: { submittedAt: 'desc' },
      include: {
        user: { select: { email: true, fullName: true, avatar: true } },
        prediction: { select: { verdict: true, confidence: true, riskScore: true, riskLevel: true, fraudScore: true } },
        _count: { select: { documents: true } },
      },
    }),
    prisma.loanApplication.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      applications,
      pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total, pages: Math.ceil(total / parseInt(limit as string)) },
    },
  });
};

export const updateApplicationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const application = await prisma.loanApplication.findUnique({
    where: { id },
    include: { user: { select: { id: true } } },
  });

  if (!application) throw new AppError('Application not found', 404);

  const updated = await prisma.loanApplication.update({
    where: { id },
    data: { status, reviewedAt: new Date(), reviewedBy: req.user!.id },
  });

  // Notify user
  await prisma.notification.create({
    data: {
      userId: application.userId,
      applicationId: id,
      type: status === 'APPROVED' ? 'APPLICATION_APPROVED' : 'APPLICATION_REJECTED',
      title: `Application Status Updated`,
      body: `Your loan application status has been updated to ${status} by an admin. ${notes || ''}`,
    },
  });

  res.json({ success: true, message: 'Application status updated', data: { application: updated } });
};

export const getAnalytics = async (_req: AuthRequest, res: Response): Promise<void> => {
  const [
    totalUsers, totalApplications, approved, rejected, pending,
    totalLoanAmount, avgCreditScore, fraudAlerts, recentApplications,
    applicationsByStatus, applicationsByPurpose,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.loanApplication.count(),
    prisma.loanApplication.count({ where: { status: 'APPROVED' } }),
    prisma.loanApplication.count({ where: { status: 'REJECTED' } }),
    prisma.loanApplication.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
    prisma.loanApplication.aggregate({ _sum: { loanAmount: true }, where: { status: 'APPROVED' } }),
    prisma.loanApplication.aggregate({ _avg: { creditScore: true } }),
    prisma.prediction.count({ where: { fraudScore: { gte: 0.7 } } }),
    prisma.loanApplication.findMany({
      take: 10,
      orderBy: { submittedAt: 'desc' },
      include: {
        user: { select: { fullName: true, email: true } },
        prediction: { select: { verdict: true, confidence: true, riskLevel: true } },
      },
    }),
    prisma.loanApplication.groupBy({ by: ['status'], _count: true }),
    prisma.loanApplication.groupBy({ by: ['loanPurpose'], _count: true, orderBy: { _count: { loanPurpose: 'desc' } }, take: 8 }),
  ]);

  // Monthly trend (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const rawApplications = await prisma.loanApplication.findMany({
    where: { submittedAt: { gte: sixMonthsAgo } },
    select: { submittedAt: true, status: true },
  });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyTrendMap: Record<string, { month: string; total: number; approved: number; rejected: number; sortKey: number }> = {};

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
    monthlyTrendMap[label] = {
      month: label,
      total: 0,
      approved: 0,
      rejected: 0,
      sortKey: d.getFullYear() * 12 + d.getMonth(),
    };
  }

  rawApplications.forEach(app => {
    const d = new Date(app.submittedAt);
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
    if (monthlyTrendMap[label]) {
      monthlyTrendMap[label].total++;
      if (app.status === 'APPROVED') monthlyTrendMap[label].approved++;
      if (app.status === 'REJECTED') monthlyTrendMap[label].rejected++;
    }
  });

  const monthlyTrend = Object.values(monthlyTrendMap).sort((a, b) => a.sortKey - b.sortKey);

  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalApplications,
        approved,
        rejected,
        pending,
        approvalRate: totalApplications > 0 ? ((approved / totalApplications) * 100).toFixed(1) : 0,
        totalLoanDisbursed: totalLoanAmount._sum.loanAmount || 0,
        avgCreditScore: Math.round(avgCreditScore._avg.creditScore || 0),
        fraudAlerts,
      },
      applicationsByStatus,
      applicationsByPurpose,
      monthlyTrend,
      recentApplications,
    },
  });
};

export const getFraudAlerts = async (_req: AuthRequest, res: Response): Promise<void> => {
  const fraudApplications = await prisma.loanApplication.findMany({
    where: { fraudScore: { gte: 0.5 } },
    orderBy: { fraudScore: 'desc' },
    take: 50,
    include: {
      user: { select: { fullName: true, email: true, phone: true } },
      prediction: { select: { fraudScore: true, fraudFlags: true, verdict: true } },
    },
  });

  res.json({ success: true, data: { alerts: fraudApplications } });
};

export const deactivateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (id === req.user!.id) throw new AppError('Cannot deactivate your own account', 400);

  await prisma.user.update({ where: { id }, data: { isActive: false } });
  res.json({ success: true, message: 'User deactivated successfully' });
};

export const getModelMetrics = async (_req: Request, res: Response): Promise<void> => {
  const metrics = await prisma.modelMetrics.findMany({ orderBy: { trainedAt: 'desc' } });
  res.json({ success: true, data: { metrics } });
};
