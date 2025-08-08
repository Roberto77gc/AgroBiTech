import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getDashboardStats,
  getAdvancedDashboard,
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivityById,
  addFertigationDay,
  updateFertigationDay,
  deleteFertigationDay,
  addPhytosanitaryDay,
  addWaterDay,
  updatePhytosanitaryDay,
  deletePhytosanitaryDay,
  updateWaterDay,
  deleteWaterDay
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

// ===== NUEVAS RUTAS PARA REGISTROS DIARIOS =====

// Fertigation Day Management
router.post('/activities/:activityId/fertigation', addFertigationDay);
router.put('/activities/:activityId/fertigation/:dayIndex', updateFertigationDay);
router.delete('/activities/:activityId/fertigation/:dayIndex', deleteFertigationDay);

// Phytosanitary Day Management
router.post('/activities/:activityId/phytosanitary', addPhytosanitaryDay);
router.put('/activities/:activityId/phytosanitary/:dayIndex', updatePhytosanitaryDay);
router.delete('/activities/:activityId/phytosanitary/:dayIndex', deletePhytosanitaryDay);

// Water Day Management
router.post('/activities/:activityId/water', addWaterDay);
router.put('/activities/:activityId/water/:dayIndex', updateWaterDay);
router.delete('/activities/:activityId/water/:dayIndex', deleteWaterDay);

// Rutas legacy para compatibilidad
router.get('/', getDashboardStats);
router.get('/activities', getActivities);

export default router;