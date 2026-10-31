import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);
router.get('/me',        requireAuth, ctrl.me);
router.put('/me',        requireAuth, ctrl.updateMe);

export default router;