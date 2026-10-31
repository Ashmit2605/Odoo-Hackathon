import { Router } from 'express';
import authRoutes from './auth.routes.js';

const router = Router();

router.use('/auth', authRoutes);

// Add more route groups here as features grow:
// router.use('/admin/users', adminUserRoutes);
// router.use('/subscriptions', subscriptionRoutes);

export default router;