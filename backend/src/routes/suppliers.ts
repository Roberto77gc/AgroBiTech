import express from 'express'
import { authMiddleware } from '../middleware/auth'
import {
	getSuppliers,
	getSupplierById,
	createSupplier,
	updateSupplier,
	deleteSupplier
} from '../controllers/supplierController'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authMiddleware)

// Obtener todos los proveedores del usuario
router.get('/', getSuppliers)

// Obtener proveedor por ID
router.get('/:id', getSupplierById)

// Crear nuevo proveedor
router.post('/', createSupplier)

// Actualizar proveedor
router.put('/:id', updateSupplier)

// Eliminar proveedor
router.delete('/:id', deleteSupplier)

export default router 