import { Response } from 'express';
import axios from 'axios';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { config } from '../config/env';
import { logger } from '../config/logger';

export const submitApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const ip = req.ip || req.connection.remoteAddress;
  const data = req.body;

  // Check duplicate IP applications (basic fraud check)
  const recentSameIP = await prisma.loanApplication.count({
    where: { ipAddress: ip, submittedAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });

  // Create the application
  const application = await prisma.loanApplication.create({
    data: {
      userId,
      ipAddress: ip,
      fullName: data.fullName,
      age: parseInt(data.age),
      gender: data.gender,
      maritalStatus: data.maritalStatus,
      dependents: parseInt(data.dependents || 0),
      employmentType: data.employmentType,
      companyName: data.companyName,
      jobExperience: parseFloat(data.jobExperience),
      monthlySalary: parseFloat(data.monthlySalary),
      annualIncome: parseFloat(data.annualIncome),
      existingLoans: parseFloat(data.existingLoans || 0),
      creditScore: parseInt(data.creditScore),
      creditCardDebt: parseFloat(data.creditCardDebt || 0),
      monthlyExpenses: parseFloat(data.monthlyExpenses),
      savings: parseFloat(data.savings || 0),
      investments: parseFloat(data.investments || 0),
      assets: parseFloat(data.assets || 0),
      loanAmount: parseFloat(data.loanAmount),
      loanPurpose: data.loanPurpose,
      loanTerm: parseInt(data.loanTerm),
      interestPref: data.interestPref || 'fixed',
      status: 'SUBMITTED',
    },
  });

  // Call ML service for prediction
  try {
    const mlPayload = {
      age: application.age,
      gender: application.gender,
      married: application.maritalStatus === 'married' ? 1 : 0,
      dependents: application.dependents,
      education: data.education || 'Graduate',
      self_employed: application.employmentType === 'self_employed' ? 1 : 0,
      applicant_income: application.monthlySalary,
      coapplicant_income: parseFloat(data.coapplicantIncome || 0),
      loan_amount: application.loanAmount,
      loan_term: application.loanTerm,
      credit_score: application.creditScore,
      credit_history: application.creditScore >= 650 ? 1.0 : 0.0,
      property_area: data.propertyArea || 'Urban',
      annual_income: application.annualIncome,
      existing_loans: application.existingLoans,
      monthly_expenses: application.monthlyExpenses,
      savings: application.savings,
      assets: application.assets,
      investments: application.investments,
      job_experience: application.jobExperience,
      ip_address: ip || '',
      same_ip_count: recentSameIP,
    };

    const mlResponse = await axios.post(`${config.ML_SERVICE_URL}/predict`, mlPayload, { timeout: 15000 });
    const mlData = mlResponse.data;

    // Save prediction
    const prediction = await prisma.prediction.create({
      data: {
        applicationId: application.id,
        verdict: mlData.verdict,
        confidence: mlData.confidence,
        riskScore: mlData.risk_score,
        riskLevel: mlData.risk_level,
        fraudScore: mlData.fraud_score,
        fraudFlags: mlData.fraud_flags ? JSON.stringify(mlData.fraud_flags) : null,
        positiveFactors: mlData.positive_factors ? JSON.stringify(mlData.positive_factors) : null,
        negativeFactors: mlData.negative_factors ? JSON.stringify(mlData.negative_factors) : null,
        shapValues: mlData.shap_values ? JSON.stringify(mlData.shap_values) : null,
        modelUsed: mlData.model_used,
        aiSummary: mlData.ai_summary,
        improvements: mlData.improvements ? JSON.stringify(mlData.improvements) : null,
        processingMs: mlData.processing_ms,
      },
    });

    // Update application with AI results
    await prisma.loanApplication.update({
      where: { id: application.id },
      data: {
        aiVerdict: mlData.verdict,
        aiConfidence: mlData.confidence,
        riskScore: mlData.risk_score,
        riskLevel: mlData.risk_level,
        fraudScore: mlData.fraud_score,
        fraudFlags: mlData.fraud_flags ? JSON.stringify(mlData.fraud_flags) : null,
        explanation: JSON.stringify({ positive: mlData.positive_factors, negative: mlData.negative_factors }),
        aiSummary: mlData.ai_summary,
        improvements: mlData.improvements ? JSON.stringify(mlData.improvements) : null,
        status: mlData.verdict === 'APPROVED' ? 'APPROVED' : 'REJECTED',
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        applicationId: application.id,
        type: mlData.verdict === 'APPROVED' ? 'APPLICATION_APPROVED' : 'APPLICATION_REJECTED',
        title: `Loan Application ${mlData.verdict === 'APPROVED' ? 'Approved! 🎉' : 'Reviewed'}`,
        body: mlData.verdict === 'APPROVED'
          ? `Congratulations! Your loan application for ₹${application.loanAmount.toLocaleString()} has been approved with ${(mlData.confidence * 100).toFixed(1)}% confidence.`
          : `Your loan application has been reviewed. ${mlData.improvements ? 'We have suggestions to improve your eligibility.' : ''}`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted and AI analysis complete',
      data: { applicationId: application.id, prediction },
    });
  } catch (mlError) {
    logger.error('ML service error:', mlError);
    // Still save the application even if ML fails
    res.status(201).json({
      success: true,
      message: 'Application submitted. AI analysis in progress.',
      data: { applicationId: application.id, prediction: null },
    });
  }
};

export const getMyApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '10', status } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = { userId: req.user!.id };
  if (status) where.status = status;

  const [applications, total] = await Promise.all([
    prisma.loanApplication.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy: { submittedAt: 'desc' },
      include: {
        prediction: {
          select: { verdict: true, confidence: true, riskScore: true, riskLevel: true, fraudScore: true },
        },
        documents: { select: { id: true, type: true, originalName: true } },
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

export const getApplicationById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;
  const isAdmin = ['ADMIN', 'LOAN_OFFICER'].includes(req.user!.role);

  const application = await prisma.loanApplication.findUnique({
    where: { id },
    include: {
      prediction: true,
      documents: true,
      user: { select: { email: true, fullName: true, avatar: true } },
    },
  });

  if (!application) throw new AppError('Application not found', 404);
  if (!isAdmin && application.userId !== userId) throw new AppError('Access denied', 403);

  // Parse JSON fields back to objects
  const parsedApp = {
    ...application,
    fraudFlags: application.fraudFlags ? JSON.parse(application.fraudFlags) : null,
    explanation: application.explanation ? JSON.parse(application.explanation) : null,
    improvements: application.improvements ? JSON.parse(application.improvements) : null,
    prediction: application.prediction ? {
      ...application.prediction,
      fraudFlags: application.prediction.fraudFlags ? JSON.parse(application.prediction.fraudFlags) : null,
      positiveFactors: application.prediction.positiveFactors ? JSON.parse(application.prediction.positiveFactors) : null,
      negativeFactors: application.prediction.negativeFactors ? JSON.parse(application.prediction.negativeFactors) : null,
      shapValues: application.prediction.shapValues ? JSON.parse(application.prediction.shapValues) : null,
      improvements: application.prediction.improvements ? JSON.parse(application.prediction.improvements) : null,
    } : null,
  };

  res.json({ success: true, data: { application: parsedApp } });
};

export const calculateEMI = async (req: AuthRequest, res: Response): Promise<void> => {
  const { loanAmount, interestRate, loanTerm } = req.query;
  const P = parseFloat(loanAmount as string);
  const annualRate = parseFloat(interestRate as string);
  const n = parseInt(loanTerm as string);

  if (!P || !annualRate || !n) throw new AppError('loanAmount, interestRate and loanTerm are required', 400);

  const r = annualRate / (12 * 100);
  const emi = r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalAmount = emi * n;
  const totalInterest = totalAmount - P;

  res.json({
    success: true,
    data: {
      emi: Math.round(emi * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      loanAmount: P,
      interestRate: annualRate,
      loanTerm: n,
    },
  });
};
