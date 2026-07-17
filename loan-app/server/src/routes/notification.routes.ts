import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getNotifications, markAsRead, deleteNotification } from '../controllers/notification.controller';

const router = Router();
router.use(authenticate);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead); // id can be 'all'
router.delete('/:id', deleteNotification);

export default router;
