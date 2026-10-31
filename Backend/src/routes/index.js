import { Router } from 'express';
import authRoutes from './auth.routes.js';
import staffRoutes from './staff.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/staff', staffRoutes);

// Add more route groups here as features grow:
// router.use('/admin/users', adminUserRoutes);
// router.use('/subscriptions', subscriptionRoutes);

export default router;