import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vertexloan.com' },
    update: {},
    create: {
      email: 'admin@vertexloan.com',
      password: adminPassword,
      fullName: 'System Administrator',
      phone: '+919876543210',
      role: 'ADMIN',
      isEmailVerified: true,
      isPhoneVerified: true,
      kycStatus: 'VERIFIED',
      kyc: {
        create: {
          gender: 'male',
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
        },
      },
    },
  });

  // Create loan officer
  const officerPassword = await bcrypt.hash('Officer@123', 12);
  await prisma.user.upsert({
    where: { email: 'officer@vertexloan.com' },
    update: {},
    create: {
      email: 'officer@vertexloan.com',
      password: officerPassword,
      fullName: 'Rajesh Kumar',
      role: 'LOAN_OFFICER',
      isEmailVerified: true,
      kycStatus: 'VERIFIED',
      kyc: { create: {} },
    },
  });

  // Create demo customer
  const customerPassword = await bcrypt.hash('Customer@123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'demo@vertexloan.com' },
    update: {},
    create: {
      email: 'demo@vertexloan.com',
      password: customerPassword,
      fullName: 'Priya Sharma',
      phone: '+919876543211',
      role: 'CUSTOMER',
      isEmailVerified: true,
      kycStatus: 'VERIFIED',
      kyc: {
        create: {
          gender: 'female',
          city: 'Mumbai',
          state: 'Maharashtra',
        },
      },
    },
  });

  // Create demo application with prediction
  const app = await prisma.loanApplication.create({
    data: {
      userId: customer.id,
      fullName: 'Priya Sharma',
      age: 32,
      gender: 'female',
      maritalStatus: 'married',
      dependents: 1,
      employmentType: 'salaried',
      companyName: 'Tech Corp India',
      jobExperience: 5,
      monthlySalary: 75000,
      annualIncome: 900000,
      existingLoans: 200000,
      creditScore: 780,
      creditCardDebt: 15000,
      monthlyExpenses: 35000,
      savings: 500000,
      investments: 300000,
      assets: 2000000,
      loanAmount: 500000,
      loanPurpose: 'home_renovation',
      loanTerm: 36,
      status: 'APPROVED',
      aiVerdict: 'APPROVED',
      aiConfidence: 0.94,
      riskScore: 18.5,
      riskLevel: 'Very Low Risk',
      fraudScore: 0.05,
      aiSummary: 'This applicant demonstrates excellent financial health with a strong credit score of 780, stable employment of 5 years, and significant savings and assets. The loan request is well within affordability limits with a debt-to-income ratio of only 28%.',
    },
  });

  await prisma.prediction.create({
    data: {
      applicationId: app.id,
      verdict: 'APPROVED',
      confidence: 0.94,
      riskScore: 18.5,
      riskLevel: 'Very Low Risk',
      fraudScore: 0.05,
      fraudFlags: JSON.stringify({ suspicious: false, flags: [] }),
      positiveFactors: JSON.stringify(['Excellent Credit Score (780)', 'Stable Employment (5 years)', 'Strong Savings & Investments', 'Low Debt-to-Income Ratio', 'High Asset Value']),
      negativeFactors: JSON.stringify(['Existing loan burden of ₹2,00,000']),
      modelUsed: 'XGBoost',
      aiSummary: 'This applicant demonstrates excellent financial health with a strong credit score of 780.',
    },
  });

  await prisma.notification.create({
    data: {
      userId: customer.id,
      applicationId: app.id,
      type: 'APPLICATION_APPROVED',
      title: 'Loan Application Approved! 🎉',
      body: 'Congratulations! Your loan application for ₹5,00,000 has been approved with 94% confidence.',
    },
  });

  console.log('✅ Seed complete!');
  console.log('Admin: admin@vertexloan.com / Admin@123');
  console.log('Officer: officer@vertexloan.com / Officer@123');
  console.log('Demo: demo@vertexloan.com / Customer@123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
