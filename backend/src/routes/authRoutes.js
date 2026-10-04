// ============================================================
// authRoutes.js - Authentication Endpoint Routing
// ============================================================

import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateRegister, validateLogin } from '../middleware/validate.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authRateLimiter, validateRegister, register);
router.post('/login', authRateLimiter, validateLogin, login);
router.get('/me', authenticate, getMe);

export default router;
