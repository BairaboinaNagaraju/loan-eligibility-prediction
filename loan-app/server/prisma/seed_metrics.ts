import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding model metrics...');
  
  const metricsPath = path.join(__dirname, '../../models/metrics.json');
  if (!fs.existsSync(metricsPath)) {
    console.error('metrics.json not found! Run train.py first.');
    return;
  }

  const data = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
  const bestModel = data.best_model;
  const results = data.results;
  const importance = data.feature_importance;

  // Clear existing
  await prisma.modelMetrics.deleteMany({});

  for (const [name, metrics] of Object.entries(results)) {
    const m = metrics as any;
    await prisma.modelMetrics.create({
      data: {
        modelName: name,
        accuracy: m.accuracy,
        precision: m.precision,
        recall: m.recall,
        f1Score: m.f1_score,
        rocAuc: m.roc_auc,
        isBest: name === bestModel,
        featureImportance: name === bestModel ? JSON.stringify(importance) : null,
      },
    });
  }

  console.log('✅ Model metrics seeded successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
