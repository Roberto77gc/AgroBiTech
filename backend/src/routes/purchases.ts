import express from 'express'
import { authMiddleware } from '../middleware/auth'
import {
	getPurchases,
	getPurchasesByProduct,
	getPurchasesBySupplier,
	createPurchase,
	updatePurchase,
	deletePurchase
} from '../controllers/purchaseController'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authMiddleware)

// Obtener todas las compras del usuario
router.get('/', getPurchases)

// Obtener compras por producto
router.get('/product/:productId', getPurchasesByProduct)

// Obtener compras por proveedor
router.get('/supplier/:supplier', getPurchasesBySupplier)

// Crear nueva compra
router.post('/', createPurchase)

// Actualizar compra
router.put('/:id', updatePurchase)

// Eliminar compra
router.delete('/:id', deletePurchase)

export default router 