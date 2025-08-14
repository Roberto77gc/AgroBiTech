import express from 'express'
import authRoutes from './auth'
import dashboardRoutes from './dashboard'
import inventoryRoutes from './inventory'
import productRoutes from './products'
import supplierRoutes from './suppliers'
import purchaseRoutes from './purchases'
import templateRoutes from './templates'

const router = express.Router()

// Health check endpoint
router.get('/health', (_req, res) => {
	res.json({
		success: true,
		message: 'AgroDigital API is running',
		timestamp: new Date().toISOString(),
		version: '1.0.0'
	})
})

// API routes
router.use('/auth', authRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/inventory', inventoryRoutes)
router.use('/products', productRoutes)
router.use('/suppliers', supplierRoutes)
router.use('/purchases', purchaseRoutes)
router.use('/templates', templateRoutes)

export default router