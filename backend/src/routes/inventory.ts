import express from 'express'
import { authMiddleware } from '../middleware/auth'
import {
	getInventoryItems,
	getInventoryItemById,
	getInventoryItemByProduct,
	createInventoryItem,
	updateInventoryItem,
	deleteInventoryItem,
	adjustStock,
	getAlerts,
	markAlertAsRead
} from '../controllers/inventoryController'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authMiddleware)

// Obtener todos los items de inventario
router.get('/', getInventoryItems)

// Obtener alertas activas (DEBE IR ANTES que /:id)
router.get('/alerts', getAlerts)

// Marcar alerta como leída (DEBE IR ANTES que /:id)
router.post('/alerts/:alertId/read', markAlertAsRead)

// Obtener item de inventario por producto (DEBE IR ANTES que /:id)
router.get('/product/:productId', getInventoryItemByProduct)

// Obtener item de inventario por ID
router.get('/:id', getInventoryItemById)

// Crear nuevo item de inventario
router.post('/', createInventoryItem)

// Actualizar item de inventario
router.put('/:id', updateInventoryItem)

// Eliminar item de inventario
router.delete('/:id', deleteInventoryItem)

// Ajustar stock
router.post('/:id/adjust', adjustStock)

export default router 