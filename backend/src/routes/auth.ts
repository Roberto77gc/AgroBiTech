import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  checkUsers,
  resetPassword
} from '../controllers/authController';

const router = express.Router();

// === RUTAS PÚBLICAS ===

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/check-users
// @desc    Check existing users (temporary)
// @access  Public
router.get('/check-users', checkUsers);

// @route   POST /api/auth/reset-password
// @desc    Reset user password (temporary)
// @access  Public
router.post('/reset-password', resetPassword);

// === RUTAS PRIVADAS ===

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authMiddleware, getProfile);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, updateProfile);

// @route   PUT /api/auth/password
// @desc    Change password
// @access  Private
router.put('/password', authMiddleware, changePassword);

// @route   DELETE /api/auth/account
// @desc    Delete account
// @access  Private
router.delete('/account', authMiddleware, deleteAccount);

export default router;