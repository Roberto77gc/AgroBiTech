import { Router } from 'express';
import authRoutes from './auth';
import dashboardRoutes from './dashboard';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'AgroDigital API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);

// 404 handler for API routes
router.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    error: 'Route not found'
  });
});

export default router;