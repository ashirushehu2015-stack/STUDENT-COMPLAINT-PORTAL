import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const notifs = db.getUserNotifications(req.user!.id);
  res.json({ success: true, data: notifs });
});

router.patch('/:id/read', (req: AuthenticatedRequest, res: Response) => {
  db.markNotificationAsRead(req.params.id, req.user!.id);
  res.json({ success: true });
});

router.post('/read-all', (req: AuthenticatedRequest, res: Response) => {
  db.markAllNotificationsAsRead(req.user!.id);
  res.json({ success: true });
});

export default router;
