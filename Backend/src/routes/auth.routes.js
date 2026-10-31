<<<<<<< HEAD
import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);
router.get('/me',        requireAuth, ctrl.me);
router.put('/me',        requireAuth, ctrl.updateMe);

export default router;
=======
import { Router } from "express";
import {
  currentUser,
  login,
  register,
  requestPasswordReset,
  resetPassword,
} from "../controllers/auth.controller.js";
import requireAuth from "../middleware/requireAuth.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/forgot-password", requestPasswordReset);
authRouter.post("/reset-password", resetPassword);
authRouter.get("/me", requireAuth, currentUser);
authRouter.post("/logout", requireAuth, (_request, response) =>
  response.json({ message: "Signed out successfully." }),
);

export default authRouter;
>>>>>>> 315d366 (done)
