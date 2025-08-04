import express from 'express'
import { authMiddleware } from '../middleware/auth'
import {
	getUserInventory,
	addProduct,
	updateProduct,
	deleteProduct,
	getLowStockProducts,
	getInventoryStats
} from '../controllers/inventoryController'

const router = express.Router()

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware)

// Obtener inventario del usuario
router.get('/', getUserInventory)

// Obtener estadísticas del inventario
router.get('/stats', getInventoryStats)

// Obtener productos con stock bajo
router.get('/low-stock', getLowStockProducts)

// Añadir nuevo producto
router.post('/', addProduct)

// Actualizar producto
router.put('/:id', updateProduct)

// Eliminar producto
router.delete('/:id', deleteProduct)

export default router 