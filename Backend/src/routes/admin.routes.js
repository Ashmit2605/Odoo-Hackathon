import { Router } from 'express';
import { getOverview } from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));
router.get('/overview', getOverview);

export default router;
