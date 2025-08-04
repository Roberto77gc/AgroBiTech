import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getDashboardStats,
  getAdvancedDashboard,
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivityById
} from '../controllers/dashboardController';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Dashboard básico
router.get('/stats', getDashboardStats);

// Dashboard avanzado con gráficos
router.get('/advanced', getAdvancedDashboard);

// Actividades
router.get('/activities', getActivities);
router.post('/activities', createActivity);
router.put('/activities/:id', updateActivity);
router.delete('/activities/:id', deleteActivity);
router.get('/activities/:id', getActivityById);

// Rutas legacy para compatibilidad
router.get('/', getDashboardStats);
router.get('/activities', getActivities);

export default router;