import express from 'express'
import authRoutes from './auth'
import dashboardRoutes from './dashboard'
import inventoryRoutes from './inventory'

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

export default router