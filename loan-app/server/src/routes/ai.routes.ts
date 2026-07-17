import { Router, Response } from 'express';
import axios from 'axios';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { config } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../config/database';

const router = Router();
router.use(authenticate);

// Proxy to ML service
router.post('/predict', async (req: AuthRequest, res: Response) => {
  const response = await axios.post(`${config.ML_SERVICE_URL}/predict`, req.body, { timeout: 15000 });
  res.json({ success: true, data: response.data });
});

router.post('/risk-score', async (req: AuthRequest, res: Response) => {
  const response = await axios.post(`${config.ML_SERVICE_URL}/risk-score`, req.body, { timeout: 10000 });
  res.json({ success: true, data: response.data });
});

router.post('/fraud-check', async (req: AuthRequest, res: Response) => {
  const response = await axios.post(`${config.ML_SERVICE_URL}/fraud`, req.body, { timeout: 10000 });
  res.json({ success: true, data: response.data });
});

router.get('/model-info', async (_req: AuthRequest, res: Response) => {
  const response = await axios.get(`${config.ML_SERVICE_URL}/model-info`, { timeout: 5000 });
  res.json({ success: true, data: response.data });
});

router.post('/chat', async (req: AuthRequest, res: Response) => {
  const { message, context } = req.body;

  // AI Chat responses based on context
  const lowerMsg = message.toLowerCase();
  let reply = '';

  if (lowerMsg.includes('credit score') || lowerMsg.includes('cibil')) {
    reply = '💳 Your credit score is the most important factor in loan approval. A score above 750 significantly improves your chances. Pay all EMIs on time and reduce credit card utilization below 30% to improve it.';
  } else if (lowerMsg.includes('reject') || lowerMsg.includes('denied')) {
    reply = '🔍 Common reasons for rejection include: low credit score (below 650), high existing debt, unstable income, or incomplete documents. I can analyze your specific case if you share your application ID.';
  } else if (lowerMsg.includes('emi') || lowerMsg.includes('monthly payment')) {
    reply = '📊 EMI = [P × r × (1+r)^n] / [(1+r)^n - 1]. Where P = Principal, r = monthly interest rate, n = months. Use our EMI calculator for exact figures!';
  } else if (lowerMsg.includes('document') || lowerMsg.includes('kyc')) {
    reply = '📁 Required documents: Aadhaar card, PAN card, last 3 months salary slips, 6 months bank statement, and a passport-size photo. All documents should be clear and valid.';
  } else if (lowerMsg.includes('interest rate')) {
    reply = '📈 Interest rates typically range from 8.5% to 24% per annum depending on your credit profile, loan type, and tenure. A higher credit score gets you lower rates.';
  } else if (lowerMsg.includes('approval')) {
    reply = '✅ Key factors for approval: Credit Score > 700, Stable income for 2+ years, Debt-to-income ratio below 40%, Clean repayment history, and valid KYC documents.';
  } else if (lowerMsg.includes('improve') || lowerMsg.includes('eligibility')) {
    reply = '🚀 To improve eligibility: (1) Increase your income or add a co-applicant, (2) Pay off existing loans, (3) Improve credit score, (4) Apply for a lower loan amount, (5) Increase loan tenure to reduce EMI burden.';
  } else {
    reply = `💬 I'm your AI Loan Assistant. I can help you understand:\n• Loan eligibility criteria\n• Credit score improvement tips\n• EMI calculations\n• Document requirements\n• Interest rate information\n\nWhat would you like to know?`;
  }

  res.json({ success: true, data: { reply, timestamp: new Date().toISOString() } });
});

export default router;
