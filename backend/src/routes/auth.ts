import { Router } from 'express';
import { 
  register, 
  login, 
  getProfile, 
  validateToken 
} from '../controllers/authController';
import { 
  registerValidation, 
  loginValidation, 
  handleValidationErrors 
} from '../middleware/validation';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  registerValidation,
  handleValidationErrors,
  register
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  loginValidation,
  handleValidationErrors,
  login
);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get(
  '/profile',
  authMiddleware,
  getProfile
);

// @route   GET /api/auth/validate
// @desc    Validate JWT token
// @access  Private
router.get(
  '/validate',
  authMiddleware,
  validateToken
);

export default router;