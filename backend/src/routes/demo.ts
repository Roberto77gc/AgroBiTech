import { Router } from 'express';
import { 
  demoLogin, 
  demoRegister, 
  demoGetProfile, 
  demoValidateToken,
  demoDashboardStats,
  demoActivities
} from '../controllers/demoController';
import { 
  loginValidation, 
  registerValidation,
  handleValidationErrors 
} from '../middleware/validation';

const router = Router();

// Auth routes (demo mode)
router.post(
  '/auth/login',
  loginValidation,
  handleValidationErrors,
  demoLogin
);

router.post(
  '/auth/register',
  registerValidation,
  handleValidationErrors,
  demoRegister
);

router.get('/auth/profile', demoGetProfile);
router.get('/auth/validate', demoValidateToken);

// Dashboard routes (demo mode)
router.get('/dashboard', demoDashboardStats);
router.get('/dashboard/activities', demoActivities);

export default router;