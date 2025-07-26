import { Router } from 'express';
import { 
  getDashboardStats, 
  getActivitiesSummary 
} from '../controllers/dashboardController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all dashboard routes
router.use(authMiddleware);

// @route   GET /api/dashboard
// @desc    Get dashboard statistics
// @access  Private
router.get('/', getDashboardStats);

// @route   GET /api/dashboard/activities
// @desc    Get activities summary with pagination and filters
// @access  Private
router.get('/activities', getActivitiesSummary);

export default router;