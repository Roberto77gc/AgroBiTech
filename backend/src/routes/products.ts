import express from 'express'
import { authMiddleware } from '../middleware/auth'
import {
	getProducts,
	getProductsByType,
	createProduct,
	updateProduct,
	deleteProduct
} from '../controllers/productController'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authMiddleware)

// Obtener todos los productos del usuario
router.get('/', getProducts)

// Obtener productos por tipo
router.get('/type/:type', getProductsByType)

// Crear nuevo producto
router.post('/', createProduct)

// Actualizar producto
router.put('/:id', updateProduct)

// Eliminar producto
router.delete('/:id', deleteProduct)

export default router 