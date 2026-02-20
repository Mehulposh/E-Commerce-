import express from 'express';
import rateLimit from 'express-rate-limit';
import {
    register,
    login,
    logout,
    refresh,
    verifyToken,
    getMe,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: 'Too many requests, please try again later' },
});

const router = express.Router();

// Public routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected routes
router.get('/me', protect, getMe);
router.post('/verify', protect, verifyToken);  // Used by other services

export default router;