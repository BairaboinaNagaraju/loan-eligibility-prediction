import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllUsers, getAllApplications, updateApplicationStatus,
  getAnalytics, getFraudAlerts, deactivateUser, getModelMetrics,
} from '../controllers/admin.controller';

const router = Router();

router.use(authenticate, authorize('ADMIN', 'LOAN_OFFICER'));

router.get('/users', getAllUsers);
router.patch('/users/:id/deactivate', authorize('ADMIN'), deactivateUser);
router.get('/applications', getAllApplications);
router.patch('/applications/:id/status', updateApplicationStatus);
router.get('/analytics', getAnalytics);
router.get('/fraud-alerts', getFraudAlerts);
router.get('/model-metrics', getModelMetrics);

export default router;
