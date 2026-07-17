import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { submitApplication, getMyApplications, getApplicationById, calculateEMI } from '../controllers/loan.controller';
import { predictionRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate);

router.post('/apply', predictionRateLimiter, submitApplication);
router.get('/my-applications', getMyApplications);
router.get('/emi-calculator', calculateEMI);
router.get('/:id', getApplicationById);

export default router;
